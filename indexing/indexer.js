'use strict';

var _ = require('lodash')
  , path = require('path')
  , Promise  = require('bluebird')
  , support = require('../config').support
  , Gaze = require('gaze').Gaze
  , FileWalker = require('../lib/fileWalker')
  , mediaService = require('../services/mediaService')
  , MediaGroups = require('../dal/models/mediaGroup')
  , exts  = require('../lib/constants').extensions
  , mm = require('minimatch')
  ;

var CHUNK_SIZE = 200;

function filterImages(files){
    var rslt = []
      , imgPattern = '*.{' + exts.IMAGE.join(',') + '}'    

    rslt = mm.match(files || [], imgPattern,      { nonull: false })
    rslt = mm.match(rslt, '!AlbumArt{Small,Large,_}*', { nonull: false })
    rslt = mm.match(rslt, '!cover_art_*', { nonull: false })

    return rslt;
}
function MediaIndexBuilder(){
    var self = this;

    self.pattern = '/**/*.{' + support.AUDIO.join(',') + '}'
    _.bindAll(self)
}

var readTime  = process.hrtime();

MediaIndexBuilder.prototype = {

    watch: function(){
        var self = this;

         MediaGroups
            .find({}).exec()
            .then(function(groups){
                var groups = _(groups)
                    .pluck('path')
                    .map(function( grp ){
                        return grp + self.pattern;
                    })
                    .value()

                self.gaze = new Gaze(groups);

                self.gaze.on('all', function(event, filepath) {
                    console.log(event, filepath)
                 });
            })
    },

    build: function(){
        var self = this
          , groups = MediaGroups.find({}).exec()
          , pattern = self.pattern

        self.media = []

        return groups
            .then(function(groups){
                var walker = new FileWalker( pattern, _.pluck(groups, 'path'));

                readTime = process.hrtime();

                walker
                    .on('file', function(i){
                        self._eachFile(i)
                    })
                    .on('done', _.bind(self._commit,   self))
                    .walk()
                
                return walker
            });
    },

    _eachFile: function(info){
        var self = this
          , media, file;


        file = !info.file
              ? '.'
              : '.' + path.sep + info.file

        media = mediaService
            .parseFromFile(info.file, info.root, info.stat)
            .then(function(m){
                if ( !m.image )
                    m.set('image', filterImages(info.siblings)[0])

                return m
            })

        self.media.push(media)
    },

    _commit: function(){
        var self = this;
        
        //console.log('----------Read All files in %d seconds', process.hrtime(readTime)[0])
        //var parseTime = process.hrtime()

        Promise.all(self.media)
            .then(function(media){
                var i = 0;
                
                console.log('----------Parse in %d seconds', process.hrtime(readTime)[0])

                while ( i < media.length) {
                    var end = i + CHUNK_SIZE

                    if ( end > media.length )
                        mediaService.create(media.slice(i))
                    else
                        mediaService.create(media.slice(i, end))

                    i += CHUNK_SIZE
                }

                self.media = []
            })
    }
}

module.exports = MediaIndexBuilder