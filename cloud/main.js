require('cloud/app.js');

var Prices = Parse.Object.extend('Prices')
var Meat = Parse.Object.extend('Meat')
var Animal = Parse.Object.extend('Animal')
var Freezer = Parse.Object.extend('Freezer')

Parse.Cloud.define('addMeat',function(req, res)
{
    var freezer = new Freezer()
    freezer.id = 'jUUUx5dgRn'

    var animal = new Animal()
    animal.id = 'djQr2snFz7'

    var newMeat = new Meat();
    newMeat.save({
        cut:        req.params.cut,
        weight:     req.params.weight,
        location:   req.params.location,
        freezer:    freezer,
        animal:     animal,
    })
    .then(function()
    {
        res.success('OK')
    },
    function(err)
    {
        res.error(err)
    })
})

/*
Parse.Cloud.beforeSave('Meat', function(req, res)
{
    console.log('Starting beforeSave')
    if(!req.object.isNew())
    {
        // Remove the old weight from the old price
        new Parse.Query(Meat)
        .include('animal.species')
        .get(req.object.id)
        .then(function(oldMeat)
        {
            new Parse.Query(Prices)
            .equalTo('species', oldMeat.get('animal').get('species'))
            .equalTo('cut', oldMeat.get('cut'))
            .first()
            .then(function(price)
            {
                price.decrement('available', oldMeat.get('weight'))
                .save()
                .then(function(){console.log("Saved old price")});
            },
            function(noprice) {console.log("There was no price for old meat")}  // If there was no price, ignore
            )
        },
        function(err)
        {
            console.error('Very very odd: could not locate existing Meat with id: ' + req.object.id + ' : ' + err.message);
            res.error('Very very odd: could not locate existing Meat with id: ' + req.object.id + ' : ' + err.message);
        });
    }

    req.object.get('animal').fetch()
    .then(function()
    {
        // Now add the new weight to the
        new Parse.Query(Prices)
        .equalTo('species', req.object.get('animal').get('species'))
        .equalTo('cut', req.object.get('cut'))
        .first()
        .then(function(price)
            {
                return price;
            },
            function(error)
            {
                return new Prices();
            }
        )
        .then(function(price)
        {
            price.increment('available', req.object.weight)
            .save()
            .then(function(){console.log('Saved new price');});
        })
        .then(function()
        {
            res.success()
        })
    })

    console.error('Reached end of beforeSave')
})
*/

Parse.Cloud.beforeDelete('Meat', function(req, res)
{
    req.object.get('animal')[0].fetch()
    .then(function(animal)
    {
        console.log('Species is ' + animal.get('species'))

        new Parse.Query(Prices)
        .equalTo('species', animal.get('species'))
        .equalTo('cut', req.object.get('cut'))
        .first()
        .then(function(price)
        {
            price.increment('available', -req.object.get('weight')).save()
            .then(function()
            {
                console.log('Price saved OK')
                res.success()
            })
        })
    },
    function(err)
    {
        console.error('We got an error saving price??!?' + err.code + ' : ' + err.message)
        res.error(err.message)
    })
})
