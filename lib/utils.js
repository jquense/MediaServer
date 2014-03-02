var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

module.exports = {

	getFuncArgNames: function getParamNames(func) {
	  var fnStr = func.toString().replace(STRIP_COMMENTS, '')
	    , result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(/([^\s,]+)/g)

	  if(result === null)
	     result = [];

	  return result
	}
}