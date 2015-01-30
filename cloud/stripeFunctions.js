
var Stripe = require('stripe');

// Params:
// stripeToken - string token to charge against
// amountCents - number amount in cents
// description - string description
Parse.Cloud.define("chargeCard",
function(req, res)
{
    // Be admin so we can access secret keys for stripe
    Parse.Cloud.useMasterKey();

    var stripeToken;
    var amountCents;
    var description;

    Parse.Promise.as(req.params)
    .then(function(params)
    {
        if(!params.stripeToken || !params.amountCents || !params.description)
        {
            return Parse.Promise.error('Missing parameter');
        }
        else
        {
            stripeToken = params.stripeToken;
            amountCents = params.amountCents;
            description = params.description;

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

        var secret = secretKey.get('value');

        Stripe.initialize(secret);

        console.log('Charge card: '+stripeToken+' for $'+(amountCents/100.0).toFixed(2));

        return Stripe.Charges.create({
                card: stripeToken,
            amount: amountCents,
            description: description,
            currency: 'usd',
            statement_descriptor: 'CIENEGA ORCHARDS MEAT'
        });
    })
    .then(function(result)
    {
        res.success(result);
        return Parse.Promise.as('ok');
    })
    .fail(function(error)
    {
        res.error(error.message);
        return Parse.Promise.as('handled');
    });
});

module.exports = exports = function(app)
{
};
