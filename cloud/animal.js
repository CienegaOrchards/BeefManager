var Prices = Parse.Object.extend('Prices');
var Meat = Parse.Object.extend('Meat');
var Animal = Parse.Object.extend('Animal');
var Freezer = Parse.Object.extend('Freezer');


// Function: getOrMakeAnimal
// @param {String} [req.params.identifier]   The 'identifier' field for the animal, eg. "Bessy" or "XYZ12345"
// @param {String} req.params.species        The species of the meat, eg. "Beef" or "Chicken"
// @param {String} req.params.butcheryDate   The date on which the meat was butchered, eg. "2014-06-04"
//
// If identifier is defined, search for animal matching identifier; if not found, create new one with params data and return it
// If identifier *not* defined, search for animal matching {species, butcheryDate}; if not found, create new one with params data and return it
Parse.Cloud.define('getOrMakeAnimal', function(req,res)
{
    // Same handler used for finding/creating by species/butcheryDate, or by identifier
    handler_block = {
                success: function(animal)
                {
                    // Found, so return it
                    res.success({ animal: animal });
                },
                error: function(err)
                {
                    // Not found, so create it
                    var animal = new Animal();
                    animal.save({
                        identifier: req.params.identifier,
                        species: req.params.species,
                        slaughtered: req.params.butcheryDate
                    },{
                        success: function(animal)
                        {
                            res.success({ animal: animal });
                        },
                        error: function(animal, err)
                        {
                            res.error({ error: err, message: "Failed to save new animal", animal: animal });
                        }
                    });
                }
            };

    if(req.params.identifier === undefined)
    {
        if(req.params.species === undefined)
        {
            res.json(400, new Parse.Error(Parse.Error.MISSING_OBJECT_ID, 'Failed to specify species'));
        }
        else if(req.params.butcheryDate === undefined)
        {
            res.json(400, new Parse.Error(Parse.Error.MISSING_OBJECT_ID, 'Failed to specify butcheryDate'));
        }
        else
        {
            // We have a species & butcheryDate -- search for it; if not found, create it
            (new Parse.Query(Animal))
                .equalTo("species",req.params.species)
                .equalTo("slaughtered", req.params.butcheryDate)
                .first(handler_block);
        }
    }
    else
    {
        // We have an identifier -- search for it; if not found, create it
        (new Parse.Query(Animal))
            .equalTo("identifier", req.params.identifier)
            .first(handler_block);
    }
});



module.exports = exports = function(app)
{

};
