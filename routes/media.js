var navigationService = require("../services/navigationService")
  , mediaService = require("../services/mediaService")
  , roles = require("../lib/constants").userRoles
  , _ = require("lodash");

function mediaNode(req, res, next){
	navigationService
		.getMediaNode(req.params.id)
		.then(function(tree){
			res.send(200, tree);
			next();
		})
}

var mediaParams = [ 'root', 'r', 'type', 'mediaId', 'fields'];

module.exports = {

	"get:/mediaGroups": function(req, res, next){
		res.send('hello ');
	},

    

	"get:/mediaNode/:id?": { 
        on: function mediaNode(req, res, next){
            var p = req.params;

	        navigationService
		        .getMediaTree(p.id, p.fields, p.type, _.toBool(p.r))
		        .then(res.send.bind(res), next)
        },
        validation: {
            id:     { isRequired: false, scope: 'path'  },
            type:   { isRequired: false, scope: 'query' },
            fields: { isRequired: false, scope: 'query', notContains: "mediaGroup"  },
            r:      { isRequired: false, scope: 'query' },
        }
    },

	"get:/artists/:artist?" : {
        on: function(req, res, next){
            var p = req.params;

            navigationService
                .getArtists(p.root, p.artist, _.toBool(p.r))
                .then(res.send.bind(res), next);
        },
        validation: { 
            artist: { isRequired: false, scope: 'path'  },
            root:   { isRequired: false, scope: 'query' },
            r:      { isRequired: false, scope: 'query' },
        }    
    },

    "get:/artists/:artist/images" : {
        on: function(req, res, next){
            var p = req.params;

            mediaService
                .getImages('artist', p.artist, parseInt(p.take, 10), p.root, _.toBool(p.r))
                .then(res.send.bind(res), next);
        },
        validation: { 
            artist: { isRequired: true,  scope: 'path'  },
            take:   { isRequired: false, scope: 'query' },
            root:   { isRequired: false, scope: 'query' },
            r:      { isRequired: false, scope: 'query' },
        }    
    },

    "get:/artists/:artist/image": {
        auth: false,
        on: function(req, res, next){
            var p = req.params;

            mediaService
                .getRandomImage('artist', p.artist, p.root, _.toBool(p.r))
                .then(function(rslt){
                    res.writeHead(200, {
                      'Content-Type' : rslt.mime,
                    })

                    rslt.stream.pipe(res);
                }, next); 
        },
        validation: {
            artist: { isRequired: false, scope: 'path'  },
            root:   { isRequired: false, scope: 'query' },
            r:      { isRequired: false, scope: 'query' },
        }    
    },

    "get:/albums/:album?": {
        on: function(req, res, next){
            var p = req.params;

            navigationService
                .getAlbums(p.root, p.artist, p.album, _.toBool(p.r))
                .then(res.send.bind(res), next)
                
        },
        validation: {
            album:  { isRequired: false, scope: 'path'  },
            artist: { isRequired: false, scope: 'query' },
            root:   { isRequired: false, scope: 'query' },
            r:      { isRequired: false, scope: 'query' },
        }    
    },

    "get:/albums/:album/images": {
        on: function(req, res, next){
            var p = req.params;

            mediaService
                .getImages('album', p.album, parseInt(p.take, 10), p.root, _.toBool(p.r))
                .then(res.send.bind(res), next); 
        },
        validation: {
            album:  { isRequired: false, scope: 'path'  },
            take:   { isRequired: false, scope: 'query' },
            root:   { isRequired: false, scope: 'query' },
            r:      { isRequired: false, scope: 'query' },
        }    
    },

    "get:/albums/:album/image": {
        auth: false,
        on: function(req, res, next){
            var p = req.params;

            mediaService
                .getRandomImage('album', p.album, p.root, _.toBool(p.r))
                .then(function(rslt){
                    res.writeHead(200, {
                      'Content-Type' : rslt.mime,
                    })

                    rslt.stream.pipe(res);
                }, next); 
        },
        validation: {
            album:  { isRequired: false, scope: 'path'  },
            root:   { isRequired: false, scope: 'query' },
            r:      { isRequired: false, scope: 'query' },
        }    
    },

    "get:/media/:mediaId?": {
        on: function(req, res){
            var params = _.clone(req.params)

            params.r = _.toBool(params.r);

            navigationService
                .getMedia(params)
                .then(res.send.bind(res))
                .end()
        },
        validation: {
            mediaId: { isRequired: false, scope: 'path'  },
            type:    { isRequired: false, scope: 'query' },
            root:    { isRequired: false, scope: 'query' },
            fields:  { isRequired: false, scope: 'query', notContains: "mediaGroup"  },
            r:       { isRequired: false, scope: 'query' },
        }    
    },
    
    "get:/media/:mediaId/stream": {
        auth: false,
        on: function(req, res){
            var p = req.params
              , range = parseRange(req);

            //if ( !req.currentUser.hasAccess(roles.STREAM) )
            //    return next(new restify.NotAuthorizedError());

            mediaService
                .transcode(p.mediaId, range.start, range.end)
                .then(function(data){
                    var validRange = !range.end || range.end < data.length - 1;

                    if ( validRange) {
                        res.writeHead(range.code, rangeHeaders(range.start, range.end, data) )   
                         
                        data.stream
                            .pipe(res)
                            .on('error', destroy)
                            .on('close', destroy);    
                    } else {
                        res.writeHead(416);
                        res.end();    
                    }

                    function destroy(){
                        data.stream.destroy();
                    }
                });
        }   
    },

    "get:/media/:mediaId/download": {
        on: function(req, res){
            var p = req.params;

            if ( !req.currentUser.hasAccess(roles.DOWNLOAD) )
                return next(new restify.NotAuthorizedError());

            mediaService
                .transcode(p.mediaId)
                .then(res.pipe.bind(res))
        }   
    },

    "get:/media/:mediaId/coverart": {
        auth: false,
        on: function(req, res){
            var p = req.params;

            mediaService
                .coverArt(p.mediaId)
                .done(function(rslt){
                    res.writeHead(200, {
                      'Content-Type' : rslt.mime,
                    })

                    rslt.stream.pipe(res);
                })
        }   
    },
}

function parseRange(req){
    var range = req.headers.range || ''
      , split = range.replace(/bytes=/, '').split('-')
      , start = parseInt(split[0], 10)
      , end   = parseInt(split[1], 10)
      , code = range && range !== 'bytes=0-'
            ? 206 
            : 200;
    
    return { 
        code: code,
        start: start, 
        end: end 
    };
}

function rangeHeaders(start, end, data){

    if ( !end ) 
        end = data.length - 1;

    return {  
        'Accept-Ranges':  'bytes',
        'Date': (new Date()).toUTCString(),
        'Content-Length': data.length,
        'Content-Type':   data.mime,
        'Connection':     'close',
        'Content-Range':  'bytes ' + start + '-'  + end + '/' + data.length,
        'Transfer-Encoding': 'chunked'
    }
}