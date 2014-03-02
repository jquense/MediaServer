
var fs     = require("fs")
  , _      = require("lodash")
  , path = require('path')
  , methods = require("../lib/constants").httpMethod
  , ROUTES = "./routes";

var optionalRegex = /\/:([^/]*?)\?/
  , optionalRegexG = /\/:([^/]*?)\?/g;

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

	if ( !action ) throw new Error("Invalid action: " + str);

	return [ methods[method] || methods.GET, action]
}

function registerRoutes(server){
	var route = path.resolve(process.cwd(), ROUTES);

	fs.readdirSync(route)
		.forEach(function(file) {
	  		registerRoute(server, require( route + "/" + file))
		});
}


function registerRoute(server, routes){

	_.each(routes, function(fn, key){
		var split = splitDef(key)
          , url = split[1]
		  , method = split[0].toLowerCase()
          , opts = {}, urls = [], add;

        if (typeof fn !== "function") {
            opts = fn;
            fn   = opts.on;
            delete opts.on;
        }

        add = function (url){
            opts.path = url
            server[method](opts, fn)
        }

        while ( optionalRegex.test(url) ) {
            var all    = url.replace(optionalRegexG, '').replace(/\?/g, "")
              , single = url.replace(optionalRegex,  '').replace(/\?/g, "");

            if ( all !== single ) add(all);

            add(single)
            url = url.replace("?", "")
        }

        add(url);
	})
}


module.exports = registerRoutes;