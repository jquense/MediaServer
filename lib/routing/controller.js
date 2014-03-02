
var Action  = require("./action")
  , _       = require("lodash")
  , methods = require("../constants").httpMethod;

function Controller(name, area, actions){
	if ( actions == null && _.isObject(area) ){
		actions = area;
		area = "";
	}

	this.name    = name;
	this.area    = area;
	this.actions = [];

	if ( actions)
		_.each(actions, this.addAction, this);
}

Controller.prototype = {
	addAction: function(fn, def){
		var split = splitDef( def)
		  , action = new Action(split[1], split[0], fn);

		this.actions.push(action);
	},

	path: function(){
		return "/" + (this.area ? this.area + "/" : "") + this.name;
	}
} 

module.exports = Controller;
// -- Static -----------

function splitDef(str){
	var idx = str.indexOf(":")
	  , action = str
	  , method;

	if ( idx > -1) {
		method = str.substring(0, idx)
			.toUpperCase()
			.trim();

		action = str.substring(idx + 1).trim();
	}

	if ( !action )
		throw new Error("Invalid action: " + str);

	return [ methods[method] || methods.GET, action]
}