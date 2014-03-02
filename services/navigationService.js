"use strict";

var fs = require('fs')
  , path = require('path')
  , _ = require("lodash")
  , Q = require("bluebird")
  , crypto = require("crypto")
  , pathExt = require("../extensions/path")
  , getMetaData = require("../indexing/metadata");

var Media = require("../dal/models/media")
  , MediaGroup = require("../dal/models/mediaGroup")
  , ObjectID = require("mongoose").Types.ObjectId
  , mediaParams = [ 'root', 'r', 'type', 'mediaId', 'fields']
  , qHelpers = require('../lib/queryHelpers')
  ;



var service = module.exports = {

    getMediaGroups: function(ids){
        var filter =  {}

        if ( !_.isNullOrEmpty(ids) ) 
            filter._id = qHelpers.matchArray(ids, true)

        return MediaGroup.find(filter, "-path").exec()
    },

    getMedia: function(reqParams){
        var params = _.pick(reqParams, mediaParams)
          , meta   = _.omit(reqParams, mediaParams)
          , query  = {};
        
        if ( !params.fields ) params.fields = "-mediaGroup";
        

        if ( !_.isFalsey(params.root) )
            query = qHelpers.matchRoots(params.root, params.r)

        if ( params.mediaId) 
            query._id = new ObjectID(params.mediaId)

        query.type = _.isNullOrEmpty(params.type) 
            ? { $ne : "DIR" } 
            : qHelpers.matchArray(params.type);
        
        query = qHelpers.queryBuilder(meta, query);
        query = Media.find(query, params.fields, { lean: true })

        if ( params.sort ) query = query.sort(params.sort)

        return query.exec();
    },

    getMediaTree: function(rootIds, fields, types, recurse){
        if ( !_.isNullOrEmpty(types) && !_.contains(types, "DIR") ) {
            types = _.splat(types)
            types.push("DIR");
        }

        fields = (fields || "") + " parent"

        return service
            .getMedia(rootIds, fields, types, "depth", recurse)
            .then(qHelpers.toTree);
    },

    getArtists: function(rootIds, artists, recurse){
        var agg = []
          , opts = { query: qHelpers.matchRoots(rootIds, recurse) || {} };

        if ( artists ) _.extend(opts.query, { artist: qHelpers.matchArray(artists) })

        opts.map = function(){
            var id = this._id.str
              , image = this.image ? "/media/" + id + "/coverart" : ''
              , album = this.album ? this.album  : '';

            if ( this.artist ) 
                this.artist.forEach(function(artist){
                    emit(artist, { _id: artist, albums: [ album ], images: [ image ]})  
                }) 
        };

        opts.reduce = function(key, values){
            var rslt = { _id: key, albums: [], images: [] };

            values.forEach(function(v, k){
                if ( !~rslt.albums.indexOf(v.albums[0]) ){
                    rslt.albums.push(v.albums[0]);
                    rslt.images.push(v.images[0]);
                }
            })

            return rslt;
        }

        return Q.cast(Media.mapReduce(opts).then(function(data){
            return _.pluck(data, 'value')
        }));
    },

    getAlbums: function(rootIds, artists, album, recurse){
        var agg = []
          , opts = { query: qHelpers.matchRoots(rootIds, recurse) || {} };

        if ( artists ) _.extend(opts.query, { artist: qHelpers.matchArray(artists) })
        if ( album )   _.extend(opts.query, { album:  album })

        opts.map = function(){ 
            if ( this.album ) 
                emit(this.album, {
                    _id: this.album,
                    image: "/media/" + this._id.str + "/coverart" 
                });
        };

        opts.reduce = function(key, value){ return value[0]; }

        return Media.mapReduce(opts)
            .then(function(data){
                return _.pluck(data, 'value')
            });
    }
};
