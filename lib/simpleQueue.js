var _ = require('lodash')
  , emitter = require('events').EventEmitter
  , util = require("util")
  ;

  
function QueueItem(nested, cb, args){
    this.nested = !!nested;
    this.cb     = cb;
    this.args   = args  
}

function SimpleQueue(){
    this.pending = 0;
    this.queue   = [];  
    this._currentQueue  = [];  
}

util.inherits(SimpleQueue, emitter)

_.extend(SimpleQueue.prototype, {
    _error: function(err){
        this.emit('error', err);    
    },

    _process: function(){
        var item
          , queue = this.queue;

        this._paused = false;
            
        while( !this._paused && (item = queue.shift())) {
            this.pending += 1;
            
            item.cb.apply(this, item.args);
        }      
    },

    nested: function(fn, args){
        this.queue.push(new QueueItem(true, fn, _.rest(arguments) ));
    },

    unshift: function(fn){
        this.pending -= 1;
        this.queue.unshift(new QueueItem(false, fn, _.rest(arguments) ));
    },

    wait: function(){
        this._paused = true;
    },

    enqueue: function(fn, args){
        this.queue.push(new QueueItem(false, fn, _.rest(arguments) ));
    },

    next: function() {
        this.pending -= 1;
  
        if( this.queue.length )  this._process();
        if( this.pending === 0 ) this.emit('empty');
    }
})

module.exports = SimpleQueue;