"use strict;"

var _ = require("lodash")
  , fs = require("fs")
  , Transcoding = require("../dal/models/transcoding")
  , SpawnStream = require("./spawnStream");
  




//took a hint from the node source on this one
function exec(command){
	var stepStream, cmd, args
	  , opts = {};

	if (process.platform === 'win32') {
	    cmd = 'cmd.exe';
	    args = ['/s', '/c', '"' + command + '"'];

	    opts.windowsVerbatimArguments = true;
  	} else {
	    cmd = '/bin/sh';
	    args = ['-c', command];
  	}

  	return new SpawnStream(cmd, args, opts)
}

function Transcoder(fromExt){

	this.transcoding = Transcoding.qFindOne({ 
		from: fromExt 
	});
}

Transcoder.prototype = {
	transcode: function(inStream, outStream, callback){
		if( _.isFunction(outStream) ){
			callback = outStream;
			outStream = null;
		}

		return this.transcoding
			.then(function(trans){
				var current = inStream

				if( trans && trans.steps ){
					_.each(trans.steps, function(step){
						current = current.pipe( exec(step) );
					})
				}

				return outStream 
					? current.pipe(outstream) 
					: current;
			})
			.nodeify(callback)
	},


};

module.exports = Transcoder;