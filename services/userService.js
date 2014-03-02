"use strict";

var fs = require('fs')
  , path = require('path')
  , _ = require("lodash")
  , Q = require("q");

var User = require("../dal/models/user");


var service = module.exports = {

    find: function(id, fields){
        var query = id ? { _id: id } : {}

        return User.qFind(query, fields || "username email roles");
    },

    create: function(body){
        //var usr = body instanceof User 
        //    ? body 
        //    : new User(body);

        return User.qCreate(body);
    },

    update: function(id, body){

        return User.qFindById(id)
            .then(function(user){
                if (!user) throw new Error("User not found")

                _.each(body, function(val, key){
                    if ( user[key] != val) user.set(key, val);    
                })

                return user.qSave();
            })

    },

    remove: function(id){
        return User.remove({ _id: id }).exec();
    },

    isUnique: function(username){
        username = username.trim().toLowerCase();
        
        return User.qCount({ username: username })
            .then(function(cnt){
                return !cnt
            })
    }
}


