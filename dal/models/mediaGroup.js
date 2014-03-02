"use strict";

var path = require("path")
  , dm = require("../defineModel")
  , schema =  new dm.Schema({
  		  name: { type: String, required: true } 
	  	, path: { type: String, required: true }
	});

schema.pre("save", function (next) {
	this.path = path.normalize(this.path);

  	next();
});

module.exports = dm.define("MediaGroup", "mediaGroups", schema);
