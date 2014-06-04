var Prices = Parse.Object.extend('Prices');
var Meat = Parse.Object.extend('Meat');
var Animal = Parse.Object.extend('Animal');
var Freezer = Parse.Object.extend('Freezer');

module.exports = exports = function(app)
{

    app.get('/prices', function(req, res) {
        // Display the user profile if user is logged in.
        if (Parse.User.current()) {
            (new Parse.Query('Prices'))
                .ascending('-species,category,cut')

            .find({
                success: function(prices) {
                    Parse.User.current().fetch();
                    res.render('prices', { user:Parse.User.current(), prices: prices });
                },
                error: function(err) {
                  res.json(500, err);
                }
            });
        } else {
            // User not logged in, redirect to login form.
            req.session.postLoginPage = '/prices';
            res.redirect('/login');
        }
    });
};
