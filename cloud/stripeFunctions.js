
var Stripe = require('stripe');

// Params:
// stripeToken - string token to charge against
// orderID     - order to charge for
Parse.Cloud.define("chargeCard",
function(req, res)
{
    // Be admin so we can access secret keys for stripe
    Parse.Cloud.useMasterKey();

    var stripeToken;
    var orderID;
    var theOrder;

    Parse.Promise.as(req.params)
    .then(function(params)
    {
        if(!params.stripeToken || !params.orderID)
        {
            return Parse.Promise.error('Missing parameter');
        }
        else
        {
            stripeToken = params.stripeToken;
            orderID = params.orderID;

            return Parse.Config.get();
        }
    })
    .then(function(config)
    {
        return (new Parse.Query('KVPair'))
        .equalTo('key',config.get('PRODUCTION_MODE')+'stripeSecretKey')
        .first();
    })
    .then(function(secretKey)
    {
        if(!secretKey) return Parse.Promise.error('Could not get Stripe authentication key');

        Stripe.initialize(secretKey.get('value'));

        return (new Parse.Query('Order'))
        .equalTo('objectId', orderID)
        .first();
    })
    .then(function(order)
    {
        if(!order) return Parse.Promise.error('Could not find order');

        theOrder = order;
        var amountCents = Math.floor((order.get('totalPrice')-order.get('paid'))*100);
        var description = 'Order # '+order.id+' - '+order.get('itemCount')+' item'+(order.get('itemCount')>1?'s':'');

        return Stripe.Charges.create({
            card: stripeToken,
            amount: amountCents,
            description: description,
            currency: 'usd',
            statement_descriptor: 'CIENEGA ORCHARDS MEAT'
        })
        .then(null,function(error)
        {
            console.log('Charging with stripe failed. Error: ' + error);
            return Parse.Promise.error(error.message);
        });
    })
    .then(function(result)
    {
        return theOrder.increment('paid',result.amount/100.0).save();
    })
    .then(function(result)
    {
        res.success(result);
    })
    .fail(function(error)
    {
        res.error(error);
    });
});

module.exports = exports = function(app)
{
};
