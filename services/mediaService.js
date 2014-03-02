"use strict";

var fs = require('fs')
  , path = require('path')
  , _ = require("lodash")
  , Q = require("bluebird")
  , Guid = require('guid');

var Transcoder = require("../lib/transcoder")
  , FileCache = require('../lib/FileCache')
  , types = require("../lib/constants").mediaTypes
  , exts  = require("../lib/constants").extensions
  , Media = require("../dal/models/media")
  , mdata = require("../indexing/metadata")
  , mm = require('minimatch')
  , MediaGroup = require("../dal/models/mediaGroup")
  , ObjectID = require("mongoose").Types.ObjectId
  , readdir = Q.promisify(fs.readdir)
  , qHelpers = require('../lib/queryHelpers')
  ;

 var imgPattern = "*.{" + exts.IMAGE.join(",") + "}"
   , transCache  = new FileCache()
   , MIME_MAP = [
         [ 'png' ]
       , [ 'jpeg', 'jpg', 'jpe' ]
       , [ 'tiff', 'tif' ]
       , [ 'bmp' ]   
       , [ 'targa' ]  
       , [ 'mpeg', 'mp3' ]
       , [ 'mp4', 'mpa' ]
       , [ 'ogg' ]  
    ];

//@module mediaServer
//@description handle media operations	
var service = module.exports = {

	//@method stream
	//@description read the media file from the disk
	//@returns {Promise} promise fulfills a read { Stream } 
	stream: function(mediaId, start, end) {

		return getModel(mediaId, Media, 'location')
		  	.then(function(media){
		  		return fs.createReadStream(media.location, { start: start || 0, end: end || undefined });   
		  	});
	},

	//@method transcode
	//@description read the media file from the disk and transcode to format
	//@returns {Promise} promise fulfills a read { Stream } 
	transcode:  function( mediaId, start, end ){

	  	return getModel(mediaId, Media, 'ext stat path mediaGroup')
		  	.then(function(media){
		  		var transcoder = new Transcoder(media.ext)
                  , cached = transCache.get(mediaId)
                  , file;
                    
                media.incPlayCount();

                if ( cached ){
                    file = fs.createReadStream(cached.file, { 
                        start: start || 0, 
                        end:   end   || undefined 
                    }) 
                    
                    transCache.incRef(mediaId)
                    handleStreamEnd(file, mediaId)

                    return new TranscodeValue(file, 'audio/' + mapMime(media.ext), cached.length)
                } else {     
                    var cache = _.partial(cacheTranscoding, media, start, end);
                      
                    file = fs.createReadStream(media.location);    
                                                                                         
                    return transcoder
                        .transcode(file)
                        .then(cache);  
                }

                function deref(){
                    transCache.decrRef(media.id)
                }
		  	});
	},

    getImages: function(field, value, total, rootIds, recurse ){
        var self = this
          , opts = total ? { limit: total } : {};

        opts.query = qHelpers.matchRoots(rootIds, recurse) || {};
        opts.query[field] = qHelpers.matchArray(value);


        opts.map = function(doc){
            var id = this._id.str;

            if ( this.image ) emit( this[groupBy], '/media/' + id + '/coverart' ); 
        }

        opts.reduce = function(key, value){ return value[0]; }

        opts.scope = { groupBy: field == 'artist' ? 'album' : 'image' }

        return Media.mapReduce(opts)
            .then(function(data){
                return _.pluck(data, 'value');
            })
    },


    coverArt:  function( mediaId ){
        var self = this;

	  	return getModel(mediaId, Media)
		  	.then(function(media){
		  		var img  = media.image
                  , file = path.resolve(path.dirname(media.location), img);

                return {
                    mime: "image/" + mapMime(path.extname(img).substring(1)),
                    stream: img ? fs.createReadStream(file) : null
                }
		  	});
	},

	parseFromFile: function( file, root, stat ){
  		var media   = new Media({path: file, mediaGroup: root, stat: { ctime: stat.ctime, mtime: stat.mtime, size: stat.size, isDir: stat.isDirectory()} })
          , dir     = path.dirname(media.location)
          , addMeta = service.addMetadata(media)
          //, group   = MediaGroup.findOne({ path: root }).exec();
        
        //return Q(media)
        var queue = [ addMeta ];

        //if ( media.depth === 0 )
        //    queue.push(group)

        return addMeta
            //.spread(function(media, group){
            //    if ( group ) 
            //        media.set("name",   group.name)

            //    return media;    
            //})

	},

	addMetadata: function(mediaId){

		return getModel(mediaId, Media)
            .then(function( media){

                if ( media.type === types.DIR ) return media;

    		    return mdata.getMetadata(media)
                    .then(function(data){
                        for ( var key in data) 
                            media.set(key, data[key], { strict: false });

                        return media;           
                    });
			});
	},

	create: function(media){
  		return Q.cast(Media.create(media));
	},

	hasMedia: function(){
		return Media.count()
            .exec()
			.then(function(count){
				return !!count;
			});
	},

	clearMedia: function(){
		return Media
            .remove()
            .exec()
            .end();
	}
}

function TranscodeValue(stream, mime, len){
    this.stream = stream;
    this.mime = mime;
    this.length = len;
}

function getModel(obj, model, fields, lean){
    var opts = lean ? { lean: true } : undefined;

	return obj instanceof model 
		? Q.cast( obj )
		: Q.cast(model.findById( new ObjectID(obj), fields, opts ).exec());
}

function mapMime(key){
    for (var i = 0; i < MIME_MAP.length; i++) {
        for (var j = 0; j < MIME_MAP[i].length; j++) {
            if (MIME_MAP[i][j].toUpperCase() === key.toUpperCase()) return MIME_MAP[i][0];
        }
    }
    return key;
}

function cacheTranscoding( media, start, end, stream){
    var mime = 'audio/' + mapMime(media.ext)
      , path = './tmp/' + Guid.raw() + '.tmp'
      , tmp = fs.createWriteStream(path);

    return new Q(function(resolve, reject){
        tmp = stream.pipe(tmp)
            .on('finish', function(){
                console.log('------------cached!----------------')
                var file = fs.createReadStream(path, { start: start || 0, end: end || undefined })
                  , item = {
                        mime: mime,
                        length: tmp.bytesWritten,
                        file: path,   
                    }

                transCache.set(media.id, item)
                transCache.incRef(media.id)

                handleStreamEnd(file, media.id);

                resolve(new TranscodeValue(file, mime, tmp.bytesWritten))
            })
            .on('error', reject)
    }) 
}

function handleStreamEnd(stream, id){
    stream
        .on('close', function deref(){
            transCache.decrRef(media.id)
        })
        .on('error', function(err){
            stream.destroy();    
        })
}