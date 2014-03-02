'use strict';
/**
 * Module dependencies.
 */

var restify  = require('restify')
  , validation = require('restify-validator')
  , http     = require('http')
  , path     = require('path')
  , config   = require('./config')
  , sessions = require('client-sessions')
  , mongoose = require('mongoose')
  , guid     = require('guid')
  , server   = restify.createServer();


restify.CORS.ALLOW_HEADERS.push('accept');
restify.CORS.ALLOW_HEADERS.push('origin');
restify.CORS.ALLOW_HEADERS.push('authorization');


server.use(restify.CORS());
server.use(restify.fullResponse());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.authorizationParser());
server.use(restify.queryParser());
server.use(restify.bodyParser({ mapParams: false }));

server.use(validation);

server.use(sessions({
    cookieName: 'session', // cookie name dictates the key name added to the request object
    duration: 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
    secret: guid.raw() 
}));


server.pre(restify.pre.userAgentConnection());



require('./app_start/setup');
require('./app_start/oauth')(server);
require('./app_start/routes')(server);

//require('./app_start/indexing');

mongoose.connect(config.CONNECTION_STRING);



mongoose.connection.on('open', function(){
   var Indexer = require('./indexing/indexer')
     , User = require('./dal/models/user');


    //var u = new User({ username: 'admin', password: 'Virus188'})
    //u.save()

   (new Indexer()).build()
})


server.listen(3000, function() {
    console.log('%s listening at %s', server.name, server.url);
});
