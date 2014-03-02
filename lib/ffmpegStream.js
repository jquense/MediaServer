"use strict;"

var _ = require("lodash")
  , fs = require("fs")
  , util = require("util")
  , spawn = require("child_process").spawn;


var Transform = require("stream").Transform
  , defaults = {};

function argsToArray(obj){
	var result = [];

	_.extend(obj, defaults);

	if( obj["-i"] ) delete obj["-i"]

	_.each(obj, function(val, key){
		val = _.splat(val)

		_.each(val, function(i){
			result.push(key);
			
			if ( i != null && i != "" ) result.push(i);
		})
	})

	result.unshift("-i", "pipe:0");
	result.push("-");

	return result;
}

function FfmpegStream(opts){
	var self = this
	  , onError = _.bind(self.emit,"error", self)
	  , onClose = _.bind(self.emit,"close", self)
	  , ffmpeg;

	Transform.call(this);

	opts = optsToOptionArray(opts);

	ffmpeg = self._ffmpeg = spawn('ffmpeg', opts);

	ffmpeg.stdout
		.on('data', function(data) {
			if ( data != null )
	  			self.push(data);
		});

	ffmpeg.on('error', onError);

	ffmpeg.on('close', onClose);
}


util.inherits(FfmpegStream, Transform);


FfmpegStream.prototype._transform = function(data, encoding, callback) {
	this._ffmpeg.stdin.write(data, encoding, callback);
};

FfmpegStream.prototype._flush = function(callback) {
	var ffmpeg = this._ffmpeg;

  	ffmpeg.stdout.on('end', callback);
	ffmpeg.stdin.end();
  	ffmpeg = null;
};

module.exports = FfmpegStream;