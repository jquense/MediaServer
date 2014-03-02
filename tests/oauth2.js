
require('./_setup')()

var Promise  = require('bluebird')
  , chaiAsPromised = require('chai-as-promised')
  , authCode = require('../lib/oauth/code.js')
  , common   = require('../lib/oauth/common.js')
  , Assertion = require("chai").Assertion
  ;

function req(client, uri, code){
    return {
        body:{
            client_id: client,
            redirect_uri: uri,
            code: code    
        }      
    }
}


describe('Authorization code grant_type', function(){
    var validate = authCode.validateRequest
      , client = 'the_porch', uri = 'my.example.com', code = 'secret!'

    describe('validate Request', function(){

        it('should fail when missing parameters', function(done){
            Promise.all([
                validate(req(undefined, uri, code))
                    .should.be.an.oauthError(common.InvalidRequestError, 'client_id'),

                validate(req(client, undefined, code))
                    .should.be.an.oauthError(common.InvalidRequestError, 'redirect_uri'),

                validate(req(client, uri, undefined))
                    .should.be.an.oauthError(common.InvalidRequestError, 'code'),

            ]).should.notify(done)

        });

    describe('Authorization request Code validation', function(){
        var request = req(client, uri, code)
          , result = { client_id: client, redirect_uri: uri, code: code, resourceOwner: 'bob' }

        beforeEach(function(){
            authCode._codes = {}        
        })

        it('should fail when the code is not in the cache', function(done){
            authCode._codes['another code'] = {}
            validate(request).should.be.an.oauthError(common.InvalidRequestError, 'code')
                .and.notify(done)
        });

        it('should fail when request uri doesn\'t match cache', function(done){
            authCode._codes[code] = { 
                uri: 'not a match',
                clientID: client 
            }

            validate(request).should.be.an.oauthError(common.InvalidRequestError, 'request_uri do not match')
                .and.notify(done)
        });
            
        it('should fail when client_id doesn\'t match cache', function(done){
            authCode._codes[code] = { 
                uri: uri,
                clientId: 'not a match' 
            }

            validate(request).should.be.an.oauthError(common.InvalidRequestError, 'invalid client_id')
                .and.notify(done)
        });

        it('should return the right params', function(done){
            authCode._codes[code] = { 
                uri: uri,
                clientId: client,
                resourceOwner: 'bob' 
            }

            validate(request).should.become(result).and.notify(done)
        });

    })

    

    })
})



Assertion.addMethod("oauthError", function(Err, testBody){
    var obj = this._obj
      , assertion = this
      , isCtor = typeof Err === 'function'
      , name = isCtor ? (new Err()).name : 'undefined'
      , promise =  typeof this.then === "function" ? assertion : obj
      , derived;

    if (!isCtor ) throw new TypeError("you didn't provide a valid Ouath Error")

    derived = promise.then(function(value){
            assertion._obj = value;
            assertion.assert(false, "expected promise to be rejected with #{exp} but it was fulfilled with #{act}"
                , null, name, value)

        }, function(reason){

            assertion.assert(
                  reason instanceof Err
                , "expected promise to be rejected with #{exp} but it was rejected with #{act}"
                , "expected promise not to be rejected with #{exp} but it was rejected with #{act}"
                , name
                , reason)

            assertion.assert(reason.message.indexOf(testBody) !== -1,
                "expected promise to be rejected with an error including #{exp} but got #{act}",
                "expected promise not to be rejected with an error including #{exp}",
                testBody,
                reason.message);
        })

    chaiAsPromised.transferPromiseness(this, derived)
})