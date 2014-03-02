var Q = require('q')
  , _ = require("lodash")
  , mongoose = require("mongoose");

Q.longStackSupport = true;

var MONGOOSE_MODEL_STATICS = [
		'remove', 'ensureIndexes', 'find', 'findById', 'findOne', 'count', 'distinct',
		'findOneAndUpdate', 'findByIdAndUpdate', 'findOneAndRemove', 'findByIdAndRemove',
		'create', 'update', 'mapReduce', 'aggregate', 'populate',
	],
	MONGOOSE_MODEL_METHODS = [
		'save', 'remove',
		// mongoose.Document instance
		'populate'
	],
	MONGOOSE_QUERY_METHODS = [
		'find', 'exec', 'findOne', 'count', 'distinct', 'update', 'remove',
		'findOneAndUpdate', 'findOneAndRemove'
	];

function add(obj, methods){
	_.each(methods, function(method){
		var fn = obj[method]
		  , newMethod = 'q' + method.charAt(0).toUpperCase() + method.substring(1);

		obj[newMethod] = function(){
			return Q.nfapply( fn.bind(this), arguments);
		} 
	})
}
		
add(mongoose.Model, MONGOOSE_MODEL_STATICS);
add(mongoose.Model.prototype, MONGOOSE_MODEL_METHODS);
add(mongoose.Query.prototype, MONGOOSE_QUERY_METHODS);

