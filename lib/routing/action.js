
var utils = require("../utils")
  , _     = require("lodash");

function Action(name, method, action){
	this.action = action;
	this.method = method;
	this.name   = this.sanitizeName(name);
	
	this.args   = utils.getFuncArgNames(action);


}

Action.prototype = {
	sanitizeName : function(action){
		action = action.trim();

		action = _.trim(action, "/");

		return action; 
	},
	route: function(){
		return this.name + "/" + (this.args.length 
			? ":" + this.args.join("?/:") + "?"
			: "" );
	},


}

module.exports = Action;