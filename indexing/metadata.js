"use strict";

var fs = require('fs')
  , meta = require('../lib/AudioInfo/audioInfo')
  , exec = require("child_process").exec
  , mcleaner = require('../lib/AudioInfo/metadataCleaner')
  , path = require('path')
  , _ = require("lodash")
  , Q = require("bluebird")
  , support = require("../config").support
  , parser = {};

var open = []
  , t;

function fin(file, err){
    var idx = open.indexOf(file)
    open.splice(idx, 1)

    clearTimeout(t);
    if (!~idx)
        console.log('dup!: %s', file )
    else
        console.log('remaining: %d - %s %s', open.length, (err ? 'rejected' : 'good'), file )

    //t = setTimeout(function(){
    //    open.forEach(console.log)
    //}, 5000)
}

exports.getMetadata = function(media){

    //if ( path.extname(file).toLowerCase() === '.ogg' )
    //    return exports.ffmpegInfo(file);

    return exports.getAudioInfo(media);
}

exports.getAudioInfo = function(media){
    var deferred = Q.defer()
      , file = media.location
      , stream   = fs.createReadStream(file)
      , parser   = new meta(stream, media.stat.size, { defaultToId3v1: false });

    open.push(file);

    stream.on('error', function (err) {
        deferred.resolve({})
        //fin(file, err)
    });

    parser.on('info', function (tags) {
        if ( tags.picture && tags.picture.data ) {
            var img = exports.createCoverArt(media, tags.picture.data, tags.picture.mime )
            
            if ( img ) media.set('image', img);

            delete tags.picture
        }

        deferred.resolve(tags);
        stream.close();
        //fin(file)
    });
    parser.on('error', function (err) {
        if ( err.type === 'AudioInfoNotFoundError' )
            deferred.resolve({})
        else
            deferred.reject(err);
        
        //fin(file, err.type === 'AudioInfoNotFoundError' ? null : err)
    });

    return deferred.promise;
}

exports.ffmpegInfo = function(file){
    var deferred = Q.defer();

    exec("ffmpeg -i \"" + file + "\" 2>&1", function(err, stdout){
        var info = {};

        if ( !stdout.length && err) deferred.reject(err)
        if (!stdout.length)         deferred.reject(new Error("no things"))

        info.aspect        = /DAR ([0-9\:]+)/.exec(stdout) || ""
        info.videoBitrate  = /bitrate: ([0-9]+) kb\/s/.exec(stdout) || ""
        info.duration      = /Duration: (([0-9]+):([0-9]{2}):([0-9]{2}).([0-9]+))/.exec(stdout) || ""
        info.resolution    = /(([0-9]{2,5})x([0-9]{2,5}))/.exec(stdout) || ""
        info.audioBitrate  = /Audio:(.)*, ([0-9]+) kb\/s/.exec(stdout) || ""
        info.channels      = /Audio: [\w]+, [0-9]+ Hz, ([a-z0-9:]+)[a-z0-9\/,]*/.exec(stdout) || ""

        if( info.aspect )       info.aspect        = info.aspect[1]
        if( info.channels )     info.channels      = info.channels[1]
        if( info.videoBitrate ) info.videoBitrate  = ~~info.videoBitrate[1]
        if( info.audioBitrate ) info.audioBitrate  = ~~info.audioBitrate[2]
        if( info.duration )     info.duration      = parseDuration(info.duration[1])

        if( info.resolution )   info.resolution    = {
            w: info.resolution.length > 2 ? ~~info.resolution[2] : 0 ,
            h: info.resolution.length > 3 ? ~~info.resolution[3] : 0
        }
        
        _.extend(info, parseTags(stdout));
        deferred.resolve(info);     
    })
    

    return deferred.promise;
}

exports.createCoverArt = function(media, data, mime){
    if ( !data.length ) return 
    if ( !mime ) return

    var ext = mime.substring(6)
      , dir = path.dirname(media.location)
      , writeFile = Q.promisify(fs.writeFile)
      , name;

    if (!ext || ext == '(null)')
        return;

    name = path.join(dir, "cover_art_" + media.id + "." + ext);

    fs.writeFile(name, data);

    return name;
}

function parseDuration(raw){
    if( raw === undefined) 
        return 0;

    var parts = raw.split(':');

    return  ( ~~parts[0] * 3600 ) + ( ~~parts[1] * 60 ) + ~~parts[2];

}

function parseTags(raw) {
    var mIdx = raw.indexOf("Metadata:") 
      , dIdx = raw.indexOf("Duration")
      , str = "", tags ={};

    if (!~mIdx) return;

    str = raw.substring(mIdx + 9, dIdx);
    str = str.split(/(\r\n|\n|\r)/gm)

    _.each(str, function(keyValue){
        var key, value;

        keyValue = keyValue.split(":");

        if ( keyValue.length == 2 ){
            key   = mcleaner.camelize(keyValue.shift().trim())

            key   = mcleaner.getAlias(key);
            value = keyValue.join(":").trim();

            if ( key ) tags[key] = mcleaner.parseValue(key, value);

        }
    })
    return tags
}

