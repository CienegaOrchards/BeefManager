var Prices = Parse.Object.extend('Prices');
var Meat = Parse.Object.extend('Meat');
var Animal = Parse.Object.extend('Animal');
var Freezer = Parse.Object.extend('Freezer');

module.exports = exports = function(app)
{
    app.get('/inventory', function(req, res) { res.render('inventory'); });
};
