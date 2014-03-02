var _ = require('lodash')
  , util = require('util')
  , Transform = require('stream').Transform;

util.inherits(SubStream, Transform);

function SubStream(start, end, opts){
    if (!(this instanceof SubStream))
        return new SubStream(start, end, opts);

    if ( opts === undefined && !_.isNumber(end) ) {
        opts = end;
        end  = Infinity;
    }

    opts = opts || {};

    Transform.call(this, opts);
    console.log('create stream')
    this.start = start || 0;
    this.end = end;
    this.bytesRead = 0;
}

module.exports = SubStream;

SubStream.prototype._transform = function(chunk, enc, cb){
    var len = chunk.length
      , total = this.bytesRead
      , start = this.start
      , end   = this.end || Infinity
      , data, isLast;

    this.bytesRead += chunk.length;
 
    if ( total <= start && this.bytesRead > start){ //first chunk
        if ( _.isFinite(end) ) 
            end = this.end - total;

        if ( end > len)
            end = undefined;

        data = chunk.slice(start - total, end);
        console.log('First Chunk', total, start, end)
    } else if ( this.bytesRead >= end ) {           //last chunk
        data = chunk.slice(0, this.end - this.total);
        isLast = true;
        console.log('Last Chunk')
    } else if ( total >= start) {
        data = chunk;
        console.log('n Chunk', total, len)
    }

    if ( data   ) this.push(data);
    if ( isLast ) this._finish();
    cb();
}

SubStream.prototype._finish = function(cb){
    this.push(null);
    this.emit('finish');
}

SubStream.prototype._flush = function(cb){
    this._finish()
    cb();
}