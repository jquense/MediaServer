var _ = require("lodash");
  
_.mixin(require("underscore.string").exports());

_.mixin({
    toBool: function(obj){
        return obj === "true" || obj == 1
    },
    isNullOrEmpty: function(obj){
        return _.isArray(obj) 
            ? !obj.length
            : obj == null
    },

    isFalsey: function(obj){
        return _.isArray(obj) 
            ? !obj.length
            : !obj
    },
    camelize: _.wrap(_.camelize, function(c, str){
        var camel = c.call(this, str)
        
        return camel.charAt(0).toLowerCase() + camel.substring(1);    
    }),
	splat: function(obj){
		return _.isArray(obj) ? obj : [ obj ];
	},

	unsplat: function(arr){
		return arr.length && arr.length === 1 ? arr[0] : arr; 
	}
});