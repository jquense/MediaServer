var userService = require("../services/userService")
  , restify  = require('restify')
  , _ = require("lodash");


module.exports = {

    "get:/Users/:userId?" : function(req, res, next){
        if ( !req.currentUser.isAdmin()) 
            return next(new restify.NotAuthorizedError());

        userService.find(req.params.userId)
            .then(function(user){
                 res.send(200,user)
            });
    },

    "put:/Users/:userId" : function(req, res, next){
        if ( !req.currentUser.isAdmin()) 
            return next(new restify.NotAuthorizedError());

         userService.update(req.params.userId, req.body)
             .then(function(b){
                 res.send(b)
            })
            .fail(function(err){
                if ( err.code === 11000 ) 
                    next(new restify.InvalidArgumentError("Username already Exists"))
            })
    },

    "post:/Users" : function(req, res, next){
        if ( !req.currentUser.isAdmin()) 
            return next(new restify.NotAuthorizedError());

        userService.create(req.body)
            .then(function(b){
                 res.send(b.id)
            })
            .fail(function(err){
                if ( err.code === 11000 ) 
                    next(new restify.InvalidArgumentError("Username already Exists"))
            });
    },
    "del:/Users/:userId" : function(req, res, next){
        if ( !req.currentUser.isAdmin()) 
            return next(new restify.NotAuthorizedError());

        userService.remove(req.params.userId)
            .then(function(b){
                 res.send(200)
            });
    },

    "get:/Users/:userId/resetPassword" : function(req, res, next){
        var p = req.params;

        if ( !req.currentUser.isAdmin()) 
            return next(new restify.NotAuthorizedError());

        //TODO
    },

    "get:/Users/checkUserName" : function(req, res, next){
        var p = req.params;

        if ( !req.currentUser.isAdmin()) 
            return next(new restify.NotAuthorizedError());

        userService.isUnique(p.username)
            .then(function(isUnique){
                 res.send(200, isUnique.toString())
            }, next)
    },

    "get:/Users/:userId/roles" : function(req, res, next){
        var p = req.params
          , curr = req.currentUser;

        if ( !curr.isMe(p.userId) && !curr.isAdmin() ) 
            return next(new restify.NotAuthorizedError());

        if ( curr.isMe(p.userId) ) 
            return res.send(200, curr.roles);

        userService.find(p.userId)
            .then(function(users){
                 res.send(200, users[0].roles)
            });
    }
}