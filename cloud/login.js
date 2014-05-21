module.exports = exports = function(app)
{

    // Renders the login form asking for username and password.
    app.get('/login', function(req, res) { res.render('login'); });

    // Clicking submit on the login form triggers this.
    app.post('/login', function(req, res) {
        Parse.User.logIn(req.body.username, req.body.password).then(function() {
            // Check if we have somewhere to go; if so, go there
            var redirect_to = req.session.postLoginPage ? req.session.postLoginPage : '/';
            delete req.session.postLoginPage;
            res.redirect(redirect_to);
        },
        function(error) {
            // Login failed, redirect back to login form.
            res.redirect('/login');
        });
    });

    app.get('/logout', function(req, res) { Parse.User.logOut(); res.redirect('/'); });

};
