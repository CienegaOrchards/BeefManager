function adminOnlyWritePublicRead(obj)
{
    var acl = new Parse.ACL();
    acl.setPublicReadAccess(true);
    acl.setPublicWriteAccess(false);

    return (new Parse.Query(Parse.Role))
    .equalTo('name','admin')
    .first()
    .then(function(adminRole)
    {
        if(!adminRole) return Parse.Promise.error('Could not get admin role');

        acl.setRoleWriteAccess(adminRole, true);
        obj.setACL(acl);

        return obj.save();
    });
}

// Given a meat objectID, try and reserve it.  That means:
// 1. Atomic increment lock
// 2. Check if lock == 1, and if it is then success -- write timestamp for eventual expiration
// 3. If lock != 1 then decrement lock and fail
// Return a promise
function reserveMeat(meatID)
{
    return (new Parse.Query('Meat'))
    .equalTo('objectId',meatID)
    .first()
    .then(function(meat)
    {
        if(!meat) return Parse.Promise.error('Could not find meat: '+meatID);

        return meat.increment('lock').save();
    })
    .then(function(updatedMeat)
    {
        if(updatedMeat.get('lock') == 1)
        {
            // Success
            return Parse.Promise.as(updatedMeat);
        }
        else
        {
            // Someone else got it
            return Parse.Promise.error(updatedMeat);
        }
    })
    .then(function(myLockedMeat)
    {
        return myLockedMeat.set('lockTime', new Date()).save();
    })
    .fail(function(someoneElseLockedMeat)
    {
        return someoneElseLockedMeat
                .increment('lock',-1)
                .save()
                .then(function(meat)
                {
                    return Parse.Promise.error({failedMeat:meat.id});
                });
    });
}

// Params:
//
// itemList - Array of Meat objectIDs to reserve for this user
//
// Returns:
// first item that failed to be reserved, [] if success
//
Parse.Cloud.define("reserveItems",
function(req, res)
{
    // Be admin so we can write data
    Parse.Cloud.useMasterKey();

    Parse.Promise.as(req.params)
    .then(function(params)
    {
        if(!params.itemList)
        {
            return Parse.Promise.error('Missing parameter');
        }
        else
        {
            return Parse.Promise.as(params.itemList);
        }
    })
    .then(function(itemList)
    {
        var itemCheckPromises = [];
        console.log(itemList);
        for(var item in itemList)
        {
            console.log(itemList[item]);
            itemCheckPromises.push(reserveMeat(itemList[item]));
        }

        return Parse.Promise.when(itemCheckPromises);
    })
    .then(function(success)
    {
        res.success();
    })
    .fail(function(error)
    {
        res.error(error);
    });
});

function addItemToOrder(meatID, order)
{
    return (new Parse.Query('Meat'))
    .equalTo('objectId', meatID)
    .include('cut')
    .first()
    .then(function(meat)
    {
        if(!meat) return Parse.Promise.error("Could not find meat: "+meatID);

        var cut = meat.get('cut');
        var price = Math.floor(meat.get('units') * cut.get('price') * 100) / 100.0;

        return adminOnlyWritePublicRead(new (Parse.Object.extend('OrderItem'))())
        .then(function(item)
        {
            return meat
            .set('orderItem', item)
            .increment('lock', 100000) // Jack up increment count to prevent unlocking -- will not unlock anything over 10,000
            .save();
        })
        .then(function(meat)
        {
            return meat.get('orderItem')
            .save({
                order: order,
                meat: meat,
                price: price
            });
        })
        .then(function(item)
        {
            return order
                    .increment('totalPrice', price)
                    .increment('itemCount')
                    .save();
        });
    });
}

// Params:
//
// itemList - Array of reserved Meat objectIDs
//
// Returns:
// objectID of created Order with those items
Parse.Cloud.define("createOrder",
function(req,res)
{
    var theUser = req.user;
    var itemList;

    // Be admin so we can write data
    Parse.Cloud.useMasterKey();

    Parse.Promise.as(req.params)
    .then(function(params)
    {
        if(!params.itemList)
        {
            return Parse.Promise.error('Missing parameter');
        }
        else
        {
            return Parse.Promise.as(params.itemList);
        }
    })
    .then(function(theList)
    {
        itemList = theList;
        return adminOnlyWritePublicRead(new (Parse.Object.extend('Order'))())
        .then(function(order)
        {
            return order.save({
                customer: theUser,
                paid: 0,
                itemCount: 0,
                totalPrice: 0,
                completed: false
            });
        });
    })
    .then(function(order)
    {
        var orderItemPromises = [];
        for(var item in itemList)
        {
            orderItemPromises.push(addItemToOrder(itemList[item], order));
        }

        return Parse.Promise.when(orderItemPromises)
        .then(function()
        {
            return Parse.Promise.as(order);
        });
    })
    .then(function(order)
    {
        res.success({
            orderID: order.id,
            itemCount: order.get('itemCount'),
            amountCents: Math.floor((order.get('totalPrice')-order.get('paid'))*100)
        });
    })
    .fail(function(error)
    {
        res.error(error);
    });

});

module.exports = exports = function(app)
{
};
