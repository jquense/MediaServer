'use strict';
var _ = require('lodash')
  , User = require('../dal/models/user')
  , crypto = require('crypto')
  , createServer = require('oauthenticity').createOauthProvider

var codes = {};

module.exports = function(server){
    var hooks = {
        generateUserToken:    generateUserToken,
        generateRefreshToken: generateRefreshToken,
        validateToken:        validateToken,
        authenticateClient:   authenticateClient,

        generateCode:         generateCode,
        validateAuthCode:     getCode,
        userAuthorization:    userAuthorization
    }

    createServer(server, { 
        grants: [ 'authorization_code'],
        allowImplicit: true,
        tokenEndpoint: '/oauth/token',
        authorizeEndpoint: '/oauth/authorize',
        hooks: hooks 
    })
}


function authenticateClient( client, clientSecret, cb){

    //if (implicit)
        cb(null, true)   
}

function exchangeRefreshToken(refreshToken, cb){
    User.findOne({ refreshToken: refreshToken }, function(err, user){
        if (err) return cb(err)

        if ( !user ) return cb(null, null)

        user.token = generateToken(user.username + ':' + user.password),
        user.refreshToken = generateToken( user.username + (new Date()).getTime());

        cb(null, {
            accessToken: user.token,
            refreshToken: user.refreshToken
        });
    });
}

function userAuthorization(req, res, clientId, uri, cb){
    var userId = req.session.user;

    if ( !userId) {
        res.writeHead(302, { 'Location': '/login?next=' + new Buffer(req.url).toString('hex') })
        res.end()
    } else {
        User.findById(userId, function(err, user){
            if (err) return cb(err)

            if ( _.contains(user.clients, clientId) )
                return cb(null, userId)

            res.writeHead(302, { 'Location': '/requestAccess?client_id='+ clientId + '&next=' + new Buffer(req.url).toString('hex') })
            res.end()

            //return cb(null, false);
        });         
    }      
}

function getCode(code, cb){
    var obj = codes[code]

    if ( obj ){
        delete codes[code];

        cb(null, true, obj.client, obj.uri, obj.user)
    }

    cb(null, false);
}

function generateCode(user, clientId, uri, next){
    var code = generateToken(user + ':' + clientId)

    codes[code] = {
        user: user,
        client: clientId,
        uri: uri,
        timeout: clearCode(code)
    }

    next(null,  code) 
}

function generateRefreshToken(user, password, next){

    return User.findById(user, function(err, user){
        if (err) return next(err)
        if ( password && !user.authenticate(user, password) )
            return next(null, false)

        user.refreshToken = generateToken( user.username + (new Date()).getTime())

        user.save(function(err){
            if ( err ) next (err)
            next(null, user.refreshToken);
        })
    });      
}


function generateUserToken(user, password, next){

    return User.findById(user, function(err, user){
        if (err) return next(err)

        if ( password && !user.authenticate(user, password) )
            return next(null, false)

        var token = generateToken(user.username + ':' + user.password)

        user.token = token
        user.save(function(err){
            if ( err ) next (err)
            next(null, token);
        })
    });      
}
	
function validateToken(token, next){
    User.findOne({ token: token })
        .exec()
        .then(function (user) {
            next( null, !!user)

        }, next); 
}

function generateToken(data) {
    var random = Math.floor(Math.random() * 100001)
      , timestamp = (new Date()).getTime()
      , sha256 = crypto.createHmac('sha256', random + timestamp + 'porchrat')

    return sha256.update(data).digest('hex');
}




function clearCode(key, ttl){
    return setTimeout(function(){
        delete codes[key];
    }, ttl || 30000)
}