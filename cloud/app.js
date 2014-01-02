
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
app.use(parseExpressCookieSession({ cookie: { maxAge: 3600000 } }));

// You could have a "Log In" link on your website pointing to this.
app.get('/login', function(req, res) {
    // Renders the login form asking for username and password.
    res.render('login.ejs');
});

// Clicking submit on the login form triggers this.
app.post('/login', function(req, res) {
    Parse.User.logIn(req.body.username, req.body.password).then(function() {
        // Login succeeded, redirect to homepage.
        // parseExpressCookieSession will automatically set cookie.
        res.redirect('/inventory');
    },
    function(error) {
        // Login failed, redirect back to login form.
        res.redirect('/login');
    });
});

// You could have a "Log Out" link on your website pointing to this.
app.get('/logout', function(req, res) {
    Parse.User.logOut();
    res.redirect('/');
});

// The homepage renders differently depending on whether user is logged in.
app.get('/', function(req, res) {
    if(Parse.User.current())
    {
        res.redirect('/inventory');
    }
    else
    {
        res.redirect('/login');
    }
});

app.get('/inventory', function(req, res) {
    // Display the user profile if user is logged in.
    if (Parse.User.current()) {
        var query = new Parse.Query('Prices');
        query.ascending('species,category,cut');

        query.find({
            success: function(prices) {
                res.render('inventory', { prices: prices });
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

app.listen();
