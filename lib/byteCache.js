var _ = require('lodash')
  , fs = require('fs')
  , util = require('util')
  , Buffers = require('buffers')
  , Guid = require('guid')
  , Writable = require('stream').Writable;

var State = {
    WRITING : 0,
    CACHED: 1,
    HYDRATING: 2
}

function RangeRequest(start, end, cb){

    if ( _.isFinite(end) )
        this.end = end;

    this.start = start;
    this.cb = cb;
}

util.inherits(ByteCache, Writable);

function ByteCache(opts){
    if (!(this instanceof ByteCache))
        return new ByteCache(options);

    opts = opts || {};

    Writable.call(this, opts);
    
    this.state = State.WRITING;
    this.path = './' + Guid.raw() + '.tmp';
    this.fileStream = fs.createWriteStream(this.path);

    this._requests= {};
    this._buffers = Buffers();

    this.once('finish', this._flush.bind(this))
}

module.exports = ByteCache;

ByteCache.prototype.slice = function(start, end, cb){
    var reqs = this._requests;

    if ( !_.isNumber(end) ){
        cb  = end;
        end = 'end';
    }

    //if ( this.state === State.CLOSED )
    //    return cb(this._buffers.slice(start, end === 'end' ? undefined : end))

    reqs[end] = reqs[end] || [];
    reqs[end].push(new RangeRequest(start, end, cb))

    this._flushQueue()
    this.state === State.CLOSED 
        ? this.hydrate()
        : this._flushQueue();
}


ByteCache.prototype._write = function(data, enc, cb){
    var self = this
      , buf = this._buffers
      , end = this.end;

    buf.push(data);

    this.fileStream.write(data, enc, function(err, rslt){
        if (err) {
            self.emit('error', err);
        }
    });

    this._flushQueue();
    cb();
}

ByteCache.prototype._flushQueue = function(finished){
    var bufs = this._buffers
      , len  = bufs.length
      , realStart = this.min || 0
      , requests = this._requests
      , toDo = finished ? values(requests) : [];

    if ( !finished ) {
        keys = Object.keys(requests)
            .filter(function(key){
                var take = key <= len;

                if ( take ) req = req.concat(request[key]);

                return !take;
            });
        keys.unshift(requests)
        this._requests = _.pick.apply(_, keys);
    }

    toDo.forEach(function(req){
        req.cb( bufs.slice(realStart - req.start, req.end) );
    });
}

ByteCache.prototype.hydrate = function(){
    var self = this
      , start = _.min(values(this._requests), 'start')
      , end   = _.max(_.keys(this._requests), 'end')
      , stream;

    if ( this.state !== State.CLOSED) return;

    if ( start ) 
        start = start.start || 0;

    if ( !_.isFinite(end) )
        end = undefined;

    this.min = start;

    stream = fs.createReadStream(this.path, { start: start, end: end });

    stream.on('data', function(data){
        self._buffers.push(data);
        self._flushQueue();
    });

    stream.on('end', self._flush.bind(self));

    this.state = State.HYDRATING;
}

ByteCache.prototype._flush = function(){
    this.state = State.CLOSED;
    this.fileStream.end();
    this._flushQueue(true);
    this._requests = {}; //if they were statisfied by now....
    this._buffers = new Buffers();
}

function values(requests){
    return _.flatten(_.values(requests))
}