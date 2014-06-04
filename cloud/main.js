// Main routing
var app = require('cloud/app.js');

// Login and logout
require('cloud/login.js')(app);

// Functions related to Prices
require('cloud/prices.js')(app);

// Functions related to Freezers
require('cloud/freezer.js')(app);

// Functions related to Animals
require('cloud/animal.js')(app);

// Functions related to Meat
require('cloud/meat.js')(app);

// Functions related to Orders
require('cloud/order.js')(app);

app.get('/', function(req, res) { res.render('index', { user: Parse.User.current() }); });

app.listen();
