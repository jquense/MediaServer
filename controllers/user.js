
var Controller = require("../lib/routing/controller")
  , fs = require("fs");


module.exports = new Controller("Audio", {

	"get:Stream": function(hi, arg){
		this.res.writeHead(200,{
        	"Content-Type": "audio/mpeg",
        	'Transfer-Encoding': 'chunked'
    	});

		var str = fs
			.createReadStream("./Pompeii.mp3")
			.pipe(this.res);

	}
});