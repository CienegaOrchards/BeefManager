
Parse.Cloud.define("makeUserAdmin",
function(req, res)
{
    (new Parse.Query(Parse.Role))
    .equalTo("name", 'admin')
    .first()
    .then(
    function(role)
    {
        var theUser = new Parse.User();
        theUser.id = req.params.user;
        if(req.params.shouldadd === true)
        {
            role.getUsers().add(theUser);
        }
        else
        {
            role.getUsers().remove(theUser);
        }

        return role.save();
    })
    .then(
    function()
    {
        res.success();
        return Parse.Promise.as('ok');
    },
    function(err)
    {
        res.error(err.message);
        return Parse.Promise.as('error');
    });
});

module.exports = exports = function(app)
{
    app.get('/users'  , function(req, res) { res.render('users'); });
};
