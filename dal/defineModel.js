"use strict";

var mongoose = require("mongoose")
  , Schema = mongoose.Schema;

exports.Schema = Schema;

exports.define = function define(name, collection, schema){
	if ( typeof collection !== "string") {
		schema = collection;
		collection = name.charAt(0).toLowerCase() + name.substring(1);
	}

   	schema = schema instanceof Schema 
   		? schema 
   		: new Schema(schema);

	return mongoose.model(name, schema, collection);
};
