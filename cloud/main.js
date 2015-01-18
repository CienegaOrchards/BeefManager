// Main routing
var app = require('cloud/app.js');

require('cloud/roles.js')(app);

app.get('/'         , function(req, res) { res.render('index'); });
app.get('/inventory', function(req, res) { res.render('inventory'); });
app.get('/prices'   , function(req, res) { res.render('prices'); });
app.get('/bulkEntry', function(req, res) { res.render('bulkEntry'); });
app.get('/qrcodes'  , function(req, res) { res.render('qrcodes'); });

app.listen();
