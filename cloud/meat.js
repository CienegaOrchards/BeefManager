var Prices = Parse.Object.extend('Prices');
var Meat = Parse.Object.extend('Meat');
var Animal = Parse.Object.extend('Animal');
var Freezer = Parse.Object.extend('Freezer');
var Order = Parse.Object.extend('Order');
var OrderItem = Parse.Object.extend('OrderItem');

// Function: moveMeatIDToFreezerID
// @param {String} req.param.meat The ID of the meat object to move
// @param {String} req.param.freezer The ID of the freezer object to move the meat into
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
                                    res.json(200, { meat: meat, freezer: freezer });
                                },
                                error: function(meat, err)
                                {
                                    res.json(500, { error: err, message: "Failed to save meat", meat: meat, freezer: freezer });
                                }
                            });
                    },
                    error: function(error)
                    {
                        res.json(404, { error: err, message: "Freezer not found", meat: req.params.freezer } );
                    }
                });
            },
            error: function(err)
            {
                res.json(404, { error: err, message: "Meat not found", meat: req.params.meat } );
            }
        });
    }
});

// Function: moveMeatIDToLocation
// Move the meat to the named location and freezer; create a new freezer if it didn't already exist
//
// @param {String} req.param.meat The ID of the meat object to move
// @param {String} req.param.location The name of the location the new freezer is at
// @param {String} req.param.freezer The name of the freezer at the new location
Parse.Cloud.define('moveMeatIDToLocation', function(res, req)
{
    if(req.params.meat === undefined)
    {
        res.json(400, new Parse.Error(Parse.Error.MISSING_OBJECT_ID, 'Failed to specify ID for meat'));
    }
    else if(req.params.location === undefined)
    {
        res.json(400, new Parse.Error(Parse.Error.MISSING_OBJECT_ID, 'Failed to specify location'));
    }
    else if(req.params.freezer === undefined)
    {
        res.json(400, new Parse.Error(Parse.Error.MISSING_OBJECT_ID, 'Failed to specify freezer'));
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
                                    res.json(200, { meat: meat, freezer: freezer });
                                },
                                error: function(meat, err)
                                {
                                    res.json(500, { error: err, message: "Failed to save meat", meat: meat, freezer: freezer });
                                }
                            });
                        },
                        error: function(error)
                        {
                            if(error.code == Parse.Error.OBJECT_NOT_FOUND)
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
                                                res.json(200, { meat: meat, freezer: freezer });
                                            },
                                            error: function(meat, err)
                                            {
                                                res.json(500, { error: err, message: "Failed to save meat", meat: meat, freezer: freezer });
                                            }
                                        });
                                    },
                                    error: function(freezer, err)
                                    {
                                        res.json(500, { error: err, message: "Failed to create freezer/location", meat: meat, location: req.params.location, freezer: req.params.freezer });
                                    }
                                });
                            }
                            else
                            {
                                res.json(500, { error: err, message: "Failed while querying for freezer/location", meat: meat, location: req.params.location, freezer: req.params.freezer });
                            }
                        }
                    });
            },
            error: function(err)
            {
                res.json(404, { error: err, message: "Meat not found", meat: req.params.meat } );
            }
        });
    }
});
