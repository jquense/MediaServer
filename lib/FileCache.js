"use strict";

var fs = require('fs')
  , _ = require("lodash")
  , emitter = require('events').EventEmitter
  , util = require('util')
  , LRU = require('lru-cache')
  , defaults = {
        max: 10485760,
        length: function(i){ return i.length },
        dispose: function(key, item){
            console.log('DISPOSE: (able: %s )', this.canDispose(key)  )

            this.canDispose(key) 
                ? fs.unlink(item.file)
                : this._awaitingDelete[key] = item.file
        } 
    }

util.inherits(FileCache, LRU)

module.exports = FileCache

function FileCache(options){
    if (!(this instanceof FileCache))
        return new FileCache(options)

    options = _.extend({}, defaults, options)

    LRU.call(this, options)

    this._refs = {}
    this._awaitingDelete = {}
}

FileCache.prototype.incRef = function(key){
    var self = this;

    if ( this._refs[key] === undefined ) {
        Object.defineProperty(this._refs, key, {
            set: function(val){ 
                this['_' + key ] = val;

                if ( val === 0 && _.has(self._awaitingDelete, key) ) {
                    console.log('deleting file' )
                    fs.unlink(self._awaitingDelete[key]);
                    delete self._awaitingDelete[key]
                }
            },
            get:function(val){ return this['_' + key ]; }, 
            enumerable: true 
        })
    }

    this._refs[key] = this._refs[key] || 0
    this._refs[key] += 1
}

FileCache.prototype.decrRef = function(key){
    if ( this._refs[ key] !== undefined ) {
        this._refs[key] -= 1;
        console.log('de-referencing',  this._refs[key] )
    }
}

FileCache.prototype.canDispose = function(key){
    return !this._refs[key];
}
