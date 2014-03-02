
var dm = require("../defineModel")
    , crypto = require("crypto")
    , path = require("path")
    , check = require('validator').check
    , roles = require("../../lib/constants").userRoles
    , _ = require('lodash');


var schema = new dm.Schema({
      username: { type: String, lowercase: true, trim: true, unique: true }
    , password: { type: String, set: encryptPassword }
    , salt: String
    , token: String
    , clients: []
    , roles: [
        Number    
    ]
})


schema.method('isAdmin', function (role) {
    return this.hasRole(roles.ADMIN);
})

schema.method('isMe', function (id) {
    return this.id === id;
})

schema.method('hasAccess', function (role) {
    return this.isAdmin() || this.hasRole(role);
})


schema.method('hasRole', function (role) {
    return _.contains(this.roles, role);
})

schema.method('authenticate', function (pw) {
    return md5(this.salt + pw) === this.password
})

module.exports = dm.define("User", "users", schema);


function encryptPassword(pw){
    check(pw)
    .len(8)
    .is(/[A-Z]/, "g")
    .is(/[a-z]/, "g")
    .is(/[0-9]/, "g")

    this.salt = crypto.randomBytes(128).toString("base64");

    return md5(this.salt + pw)
}

function md5(string) {
    return crypto.createHash('md5').update(string).digest('hex');
}