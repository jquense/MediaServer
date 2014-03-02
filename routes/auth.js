'use strict';
var _ = require('lodash')
  , restify = require('restify')
  , fs = require('fs')
  , path = require('path')
  , templates = require('../templates')
  , User = require('../dal/models/user');



module.exports = {

    'get:/requestAccess': function(req, res, next){
        var form = templates.code({ 
            next:   new Buffer(req.query.next, 'hex').toString('ascii'),
            error: 'uri',
            client: req.query.client_id
        });

        res.writeHead(200, {'Content-Length': Buffer.byteLength(form) ,'Content-Type': 'text/html' })
        res.end(form)
    },

    'post:/requestAccess': function(req, res, next){

        User.findById(req.session.user).exec()
            .then(function (user) {
                var decision = req.body.decision === 'true'
                  , client   = req.body.client_id
                  , redirect = req.body.next
                  , file;

                if ( decision ) {
                    user.clients.push(client)

                    return user.save(function(err){
                        if ( err ) return next(err)

                        res.writeHead(302, {'Location': redirect });
                        res.end();
                    })
                }

                sendFile(res, '../public/denied.html')
            }, next);
    },

    'get:/login': function(req, res, next){
        var form = templates.login({ 
            next: req.query.next
        });

        res.writeHead(200, {'Content-Length': Buffer.byteLength(form) , 'Content-Type': 'text/html' })
        res.end(form)
    },

    'post:/login': function(req, res, next){

        User.findOne({ username: req.body.username.toLowerCase() })
            .exec()
            .then(function (user) {
                if ( !user ) return res.send(new restify.InvalidCredentialsError({ message: 'Username not found'}))

                if ( !user.authenticate(req.body.password) ) 
                    return res.send(new restify.NotAuthorizedError());

                req.session.user = user.id;

                res.writeHead(302, {
                  'Location': new Buffer(req.body.next, 'hex').toString('ascii') 
                });

                return res.end();
            }, next);
    },

}

function sendFile(res, file){
    file = fs.readFileSync(path.resolve(__dirname, file))

    return res.end(file); 
}