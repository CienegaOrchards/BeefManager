var Prices = Parse.Object.extend('Prices');
var Meat = Parse.Object.extend('Meat');
var Animal = Parse.Object.extend('Animal');
var Freezer = Parse.Object.extend('Freezer');
var Order = Parse.Object.extend('Order');
var OrderItem = Parse.Object.extend('OrderItem');

// Function: makeMeat
// @param {String} req.params.species            The species of the meat, eg. "Beef" or "Chicken"
// @param {String} req.params.cut                The cut of the meat, eg. "Rump Roast" or "Stewing Hen"
// @param {Number} req.params.units              The number of units of meat, eg. 3.0 for 3.0 lb or 1 for 1 hen; Unit type depends on what the cut was and is defined when creating the cut
// @param {String} req.params.butcheryDate       The date on which the meat was butchered, eg. "2014-06-04"
// @param {String} [req.params.animalIdentifier] The 'identifier' field for the animal, eg. "Bessy" or "XYZ12345"
// @param {String} [req.params.category]         The category of this cut, eg. "Roasts" or "Organic"
// @param {String} [req.params.unitType]         The type of the units for this cut, eg. "lb" or "hen"
// @param {Number} [req.params.pricePerUnit]     The price per unit, eg. 15.5 for "$15.50 per lb"
Parse.Cloud.define('makeMeat', function(req,res)
{
    if(req.params.species === undefined)
    {
        res.json(400, new Parse.Error(Parse.Error.MISSING_OBJECT_ID, 'Failed to specify species'));
    }
    else if(req.params.cut === undefined)
    {
        res.json(400, new Parse.Error(Parse.Error.MISSING_OBJECT_ID, 'Failed to specify cut'));
    }
    else if(req.params.units === undefined)
    {
        res.json(400, new Parse.Error(Parse.Error.MISSING_OBJECT_ID, 'Failed to specify units'));
    }
    else if(req.params.butcheryDate === undefined)
    {
        res.json(400, new Parse.Error(Parse.Error.MISSING_OBJECT_ID, 'Failed to specify butcherDate'));
    }
    else
    {
        // Find the Animal if it exists, and if not, create it
        Parse.Cloud.run('getOrMakeAnimal', { identifier: req.params.animalIdentifier, species: req.params.species, butcheryDate: req.params.butcheryDate },
        {
            success: function(animalRes)
            {
                // Find the Price if it exists, and if not, create it
                Parse.Cloud.run('getOrMakePrice', { species: req.params.species, category: req.params.category, cut: req.params.cut, units: req.params.unitType, price: req.params.pricePerUnit },
                {
                    success: function(priceRes)
                    {
                        // Now make the meat
                        var theMeat = new Meat();
                        theMeat.save({
                            animal: animalRes.animal,
                            cut: priceRes.price,
                            location: "Unknown - new meat",
                            units: req.params.units
                        },
                        {
                            success: function(savedMeat)
                            {
                                res.success(savedMeat);
                            },
                            error: function(unsavedMeat, err)
                            {
                                res.error({ error: err.message, message: "Failed to save meat", meat: unsavedMeat });
                            }
                        });
                    },
                    error: function(err)
                    {
                        res.error({ error: err.message, message: "Failed to get/make price", cut: req.params.cut, units: req.params.unitType, price: req.params.pricePerUnit });
                    }
                });
            },
            error: function(err)
            {
                res.error({ error: err.message, message: "Failed to get/make animal", identifier: req.params.animalIdentifier, species: req.params.species, butcheryDate: req.params.butcheryDate });
            }
        });
    }
});

// Function: moveMeatIDToFreezerID
// @param {String} req.params.meat The ID of the meat object to move
// @param {String} req.params.freezer The ID of the freezer object to move the meat into
Parse.Cloud.define('moveMeatIDToFreezerID', function(req,res)
{
    if(req.params.meat === undefined)
    {
        res.json(400, new Parse.Error(Parse.Error.MISSING_OBJECT_ID, 'Failed to specify ID for meat'));
    }
    else if(req.params.freezer === undefined)
    {
        res.json(400, new Parse.Error(Parse.Error.MISSING_OBJECT_ID, 'Failed to specify ID for freezer'));
    }
    else
    {
        new Parse.Query(Meat).get(req.params.meat,
        {
            success: function(meat)
            {
                new Parse.Query(Freezer).get(req.params.freezer,
                {
                    success: function(freezer)
                    {
                        meat.save({ freezer: freezer },
                            {
                                success: function(meat)
                                {
                                    // All OK, return the new meat and freezer objects
                                    res.success({ meat: meat, freezer: freezer });
                                },
                                error: function(meat, err)
                                {
                                    res.error({ error: err, message: "Failed to save meat", meat: meat, freezer: freezer });
                                }
                            });
                    },
                    error: function(err)
                    {
                        res.error({ error: err, message: "Freezer not found", meat: req.params.freezer });
                    }
                });
            },
            error: function(err)
            {
                res.error({ error: err, message: "Meat not found", meat: req.params.meat });
            }
        });
    }
});

// Function: moveMeatIDToLocation
// Move the meat to the named location and freezer; create a new freezer if it didn't already exist
//
// @param {String} req.params.meat The ID of the meat object to move
// @param {String} req.params.location The name of the location the new freezer is at
// @param {String} req.params.freezer The name of the freezer at the new location
Parse.Cloud.define('moveMeatIDToLocation', function(req, res)
{
    if(req.params.meat === undefined)
    {
        res.error(new Parse.Error(Parse.Error.MISSING_OBJECT_ID, 'Failed to specify ID for meat'));
    }
    else if(req.params.location === undefined)
    {
        res.error(new Parse.Error(Parse.Error.MISSING_OBJECT_ID, 'Failed to specify location'));
    }
    else if(req.params.freezer === undefined)
    {
        res.error(new Parse.Error(Parse.Error.MISSING_OBJECT_ID, 'Failed to specify freezer'));
    }
    else
    {
        new Parse.Query(Meat).get(req.params.meat,
        {
            success: function(meat)
            {
                // Find the freezer if it exists
                new Parse.Query(Freezer)
                    .equalTo('location', req.params.location)
                    .equalTo('identifier', req.params.freezer)
                    .first({
                        success: function(freezer)
                        {
                            meat.save({ freezer: freezer },
                            {
                                success: function(meat)
                                {
                                    // All OK, return the new meat and freezer objects
                                    res.success({ meat: meat, freezer: freezer });
                                },
                                error: function(meat, err)
                                {
                                    res.error({ error: err, message: "Failed to save meat", meat: meat, freezer: freezer });
                                }
                            });
                        },
                        error: function(err)
                        {
                            if(err.code == Parse.Error.OBJECT_NOT_FOUND)
                            {
                                // Make a freezer
                                new Freezer().save({ location: req.params.location, identifier: req.params.freezer },
                                {
                                    success: function(freezer)
                                    {
                                        meat.save({ freezer: freezer },
                                        {
                                            success: function(meat)
                                            {
                                                // All OK, return the new meat and freezer objects
                                                res.success({ meat: meat, freezer: freezer });
                                            },
                                            error: function(meat, err)
                                            {
                                                res.error({ error: err, message: "Failed to save meat", meat: meat, freezer: freezer });
                                            }
                                        });
                                    },
                                    error: function(freezer, err)
                                    {
                                        res.error({ error: err, message: "Failed to create freezer/location", meat: meat, location: req.params.location, freezer: req.params.freezer });
                                    }
                                });
                            }
                            else
                            {
                                res.error({ error: err, message: "Failed while querying for freezer/location", meat: meat, location: req.params.location, freezer: req.params.freezer });
                            }
                        }
                    });
            },
            error: function(err)
            {
                res.error({ error: err, message: "Meat not found", meat: req.params.meat } );
            }
        });
    }
});

module.exports = exports = function(app)
{

    // QR CODES
    // ========
    app.get('/qrcodes', function(req, res) {
        // Query for Meat that is in the price list
        var meatQuery = new Parse.Query('Meat')
            .include('cut')
            .include('freezer')
            .include('animal');

        // Parse.Query.ascending(xyz) won't let you sort by sub-object fields like cut.species,
        // so we form a collection and sort using a comparator
        var meats = meatQuery.collection();
        meats.comparator = function(object)
        {
            var cut = object.get('cut');
            // Use | as separator because at least in ASCII it's alphabetically later than all letters
            return cut.get('species')+'|'+cut.get('category')+'|'+cut.get('cut');
        };

        var freezerQuery = new Parse.Query('Freezer');
        var freezers = freezerQuery.collection();
        freezers.comparator = function(object)
        {
            return object.get('location')+'|'+object.get('identifier');
        };
        freezers.fetch({
            success: function(freezers)
            {
                meats.fetch({
                    success: function(meats)
                    {
                        res.render('qrcodes', { meats: meats, freezers: freezers });
                    },
                    error: function(err)
                    {
                        res.json(500, err);
                    }
                });
            },
            error: function(err)
            {
                res.json(500, err);
            }
        });

    });

    app.get('/bulkEntry', function(req, res) { res.render('bulkEntry'); });
};
