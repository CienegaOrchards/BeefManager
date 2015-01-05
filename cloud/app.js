// Function: navItems
// Returns a list of {title,link} to build a nav menu
Parse.Cloud.define('navItems', function(req,res)
{
    var menu = [
        {title: 'Inventory', link: '/inventory'},
        {title: 'Prices', link: '/prices'},
        {title: 'QR Codes', link: '/qrcodes'},
    ];

    Parse.Promise.as(Parse.User.current())
    .then(function(isAuth)
    {
        if(isAuth)
        {
            return isAuth.fetch();
        }
        else
        {
            return Parse.Promise.as(null);
        }
    })

    .then(function(user)
    {
        if(user)
        {
            menu.push({title: 'Logout ('+user.get('realname')+')', link: '#'});
        }
        else
        {
            menu.push({title: 'Login', link: '#'});
        }

        return menu;
    })

    .then(function(theMenu)
    {
        res.success(theMenu);
    });
});



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

// Error handler
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.send(500, 'Something broke!');
});

module.exports = exports = app;

