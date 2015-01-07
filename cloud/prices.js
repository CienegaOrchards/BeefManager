var Prices = Parse.Object.extend('Prices');
var Meat = Parse.Object.extend('Meat');
var Animal = Parse.Object.extend('Animal');
var Freezer = Parse.Object.extend('Freezer');


// Function: getOrMakePrice
// @param {String} req.params.species       The species of the meat, eg. "Beef" or "Chicken"
// @param {String} req.params.cut           The cut of the meat, eg. "Rump Roast" or "Stewing Hen"
// @param {String} [req.params.category]    The category of this cut, eg. "Roasts" or "Organic"
// @param {String} [req.params.units]       The type of the units for this cut, eg. "lb" or "hen"
// @param {Number} [req.params.price]       The price per unit, eg. 15.5 for "$15.50 per lb"
//
// Search for price matching {species, cut}; if not found, create new one with params data and return it
Parse.Cloud.define('getOrMakePrice', function(req,res)
{
    // Same handler used for finding/creating by species/butcheryDate, or by identifier
    handler_block = {
                success: function(price)
                {
                    // Found, so return it
                    res.success({ price: price });
                },
                error: function(err)
                {
                    // Not found, so create it
                    var price = new Price();
                    price.save({
                        species: req.params.species,
                        category: req.params.category,
                        cut: req.params.cut,
                        units: req.params.units,
                        price: req.params.price
                    },{
                        success: function(price)
                        {
                            res.success({ price: price });
                        },
                        error: function(price, err)
                        {
                            res.error({ error: err, message: "Failed to save new price", price: price });
                        }
                    });
                }
            };

    if(req.params.species === undefined)
    {
        res.json(400, new Parse.Error(Parse.Error.MISSING_OBJECT_ID, 'Failed to specify species'));
    }
    else if(req.params.cut === undefined)
    {
        res.json(400, new Parse.Error(Parse.Error.MISSING_OBJECT_ID, 'Failed to specify cut'));
    }
    else
    {
        // We have a species & butcheryDate -- search for it; if not found, create it
        (new Parse.Query(Prices))
            .equalTo("species",req.params.species)
            .equalTo("cut", req.params.cut)
            .first(handler_block);
    }
});



module.exports = exports = function(app)
{
    app.get('/prices', function(req, res) { res.render('prices'); });
};
