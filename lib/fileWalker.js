"use strict";

var _       = require("lodash")
  , util    = require("util")
  , match   = require("minimatch")
  , fs      = require("fs")
  , path    = require("path")
  , emitter = require('events').EventEmitter
  , Q       = require("q")
  , _Q      = require("../extensions/_q");

var qReaddir = Q.denodeify(fs.readdir)
  , qStat    = Q.denodeify(fs.stat)
  , prtl     = _.partial
  ;

require("../extensions/lodash");


function getRoot(file, roots){ 
    return _.find(roots, function(root){
        return ~file.indexOf(root);
    })
}

function enoent(err){
    if ( err.code !== 'ENOENT' )
        console.warn(err);
    else
        throw err;
}

function FileInfo(stat, absPath, root, siblings){
    this.stat = stat
    this.file = path.relative(root, absPath)
    this.root = root
    this.siblings = siblings;
}

function FileWalker(pattern, rootDirs){
    emitter.call(this);

    this.globstar = !!~pattern.indexOf('**')
    this.roots    = _.splat(rootDirs);
    this.pattern  = pattern;

    this.queue    = [];
    this.pending  = 0;
    this.rootLeft = 0;
}

util.inherits(FileWalker, emitter);

_.extend(FileWalker.prototype, {
    walk: function(){
        var self = this;

        _.each(self.roots, function(root){
            self.rootLeft++;

            self.add(self._stat, root );
        });

        self._process();
    },

    _error: function(err){
        this.emit('error', err);    
    },

    _process: function(){
        var item;
            
        while( item = this.queue.shift()) {
            this.pending += 1;

            item[0].apply(this, item[1]);
        }      
    },

    add: function(fn, args){
        this.queue.push([ fn, _.rest(arguments) ]);
    },

    next: function() {
        this.pending -= 1;
  
        if( this.queue.length )  this._process();
        if( this.pending === 0 ) this.emit('done');
    },

    _readDir: function(dir, stat, siblings){
        var self = this;

        fs.readdir(dir, function(err, files){
            if ( err ) return self._error(err);

            _.each(files, function(file){
                self.add(self._stat, path.join(dir, file), files );
            });

            self.next();
        })

    },

    _stat: function(file, siblings){
        var self = this;

        fs.stat(file, function(err, stat){
            if ( err ) return self._error(err);

            var isDir = stat.isDirectory()
              , isMatch = self.match(file)
              , info;

            if ( isDir || isMatch )
                self.emit("file", new FileInfo(stat, file, getRoot(file, self.roots), siblings) )
            
            if ( isDir && ( self.globstar || self.rootLeft-- > 0 ) ) 
                self.add(self._readDir, file, stat, siblings);

            self.next();
        })
    },

    match: function(file){
        var root = getRoot(file, this.roots);

        return match(file, root + this.pattern, { 
            matchBase: true 
        });
    },

});


module.exports = FileWalker;