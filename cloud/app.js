
// These two lines are required to initialize Express in Cloud Code.
var express = require('express');
var parseExpressHttpsRedirect = require('parse-express-https-redirect');
var parseExpressCookieSession = require('parse-express-cookie-session');

var app = express();

// Global app configuration section
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine


app.use(parseExpressHttpsRedirect());  // Require user to be on HTTPS.
app.use(express.bodyParser());
app.use(express.cookieParser('Beef is good'));
app.use(express.cookieSession( {secret:'OMG so good'} ));
app.use(parseExpressCookieSession({ cookie: { maxAge: 3600000 }, fetchUser: true }));

// Renders the login form asking for username and password.
app.get('/login', function(req, res) { res.render('login'); });

// Clicking submit on the login form triggers this.
app.post('/login', function(req, res) {
    Parse.User.logIn(req.body.username, req.body.password).then(function() {
        // Check if we have somewhere to go; if so, go there
        var redirect_to = req.session.postLoginPage ? req.session.postLoginPage : '/prices';
        delete req.session.postLoginPage;
        res.redirect(redirect_to);
    },
    function(error) {
        // Login failed, redirect back to login form.
        res.redirect('/login');
    });
});

app.get('/logout', function(req, res) { Parse.User.logOut(); res.redirect('/'); });

function IsAuthenticated(req,res,next)
{
    // Check that user is logged in, and redirect to login if not
    if(Parse.User.current())
    {
        next();
    } else {
        req.session.postLoginPage = req.url;
        res.redirect('/login');
    }
}

// The homepage renders differently depending on whether user is logged in.
app.get('/', IsAuthenticated, function(req, res) { res.redirect('/prices'); });

app.get('/prices', IsAuthenticated, function(req, res) {
    // Display the user profile if user is logged in.
    if (Parse.User.current()) {
        var query = new Parse.Query('Prices')
            .ascending('-species,category,cut')

        .find({
            success: function(prices) {
                Parse.User.current().fetch();
                res.render('prices', { user:Parse.User.current(), prices: prices });
            },
            error: function() {
              response.error("Prices lookup failed");
            }
        });
    } else {
        // User not logged in, redirect to login form.
        res.redirect('/login');
    }
});

// Error handler
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.send(500, 'Something broke!');
});

app.listen();
