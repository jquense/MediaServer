"use strict";

var dm = require("../defineModel")
  , _ = require("lodash")
  , schema = new dm.Schema({ 
		  name: String 
		, from: { 
			type: Array, 
			validation: [ isEmpty, "At least one 'from' format must be provided"]
		}	
		, to: { type: String, required: true } 
		, steps: { 
			type: [ String ], 
			validation: [ isEmpty, "At least one 'step' format must be provided"]
		}
	});


schema.pre("save", function(next){
	this.to   = removeDot(this.to);
	this.from = _.map(this.from, removeDot);

	next();
})

module.exports = dm.define("Transcoding", schema);


function isEmpty(val){
	return val && !!val.length;
}

function removeDot(ext){
	ext = ext.trim().toLowerCase();

	return ext.charAt(0) === "." ? ext.substring(1) : ext;
}

