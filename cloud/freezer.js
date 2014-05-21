var Prices = Parse.Object.extend('Prices');
var Meat = Parse.Object.extend('Meat');
var Animal = Parse.Object.extend('Animal');
var Freezer = Parse.Object.extend('Freezer');

module.exports = exports = function(app)
{

    // INVENTORY
    // =========
    app.get('/inventory', function(req, res) {
        // If user exists, fetch their info for display
        if(Parse.User.current()) { Parse.User.current().fetch(); }

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
        meats.fetch({
            success: function(meats)
            {
                res.render('inventory', { user: Parse.User.current(), meats: meats });
            },
            error: function(err)
            {
                res.json(500, err);
            }
        });
    });

}
