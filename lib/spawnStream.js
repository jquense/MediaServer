"use strict;"

var _ = require("lodash")
  , fs = require("fs")
  , util = require("util")
  , spawn = require("child_process").spawn
  , Transform = require("stream").Transform;

function objToArgsArray(obj){
	var result = [];

	if ( Array.isArray(obj) ) return obj;

	_.each(obj, function(val, key){
		val = _.splat(val)

		_.each(val, function(i){
			result.push(key);
			
			if ( i != null && i != "" ) result.push(i);
		})
	})

	return result;
}

function SpawnStream(command, args, opts){
	var self = this
	  , onError = _.bind(self.emit,"error", self)
	  , onClose = _.bind(self.emit,"close", self)
	  , cmd;

	Transform.call(this);

	args = objToArgsArray(args || {});

	cmd = self._cmd = spawn(command, args, opts);

	cmd.stderr
		.on('data', function(data) {
			console.log(data.toString())
		});

	cmd.stdout
		.on('data', function(data) {
			if ( data != null )
	  			self.push(data);
		});

	cmd.on('error', onError);

	cmd.on('close', onClose);
}


util.inherits(SpawnStream, Transform);


SpawnStream.prototype._transform = function(data, encoding, callback) {
	this._cmd.stdin.write(data, encoding, callback);
};

SpawnStream.prototype._flush = function(callback) {
	var cmd = this._cmd;

  	cmd.stdout.on('end', callback);
	cmd.stdin.end();
  	cmd = null;
};

module.exports = SpawnStream;