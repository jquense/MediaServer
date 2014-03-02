var Transform = require('stream').Transform
  , _ = require("lodash")
  , util = require("util");


function TapStream(opts){
    Transform.call(this);

    this.options = opts;
}

util.inherits(TapStream, Transform);


TapStream.prototype._transform = function(data, encoding, done) {
    this.push(data);
    this.emit('tap', data, encoding)
	done();
};

module.exports = TapStream;


