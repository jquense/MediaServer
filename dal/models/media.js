
    var dm = require("../defineModel")
      , Blue = require('bluebird')
      , crypto = require("crypto")
      , path = require("path")
      , _ = require('lodash')
      , c = require("../../lib/constants")
      , pathExt = require("../../extensions/path")

      , ObjectID = require("mongoose").Types.ObjectId
      , id_cache = []
      , statFields = ['atime', 'mtime', 'ctime'];

    var schema = new dm.Schema({ 
	    path: { type: String, set: function(file){
                var ext = path.extname(file).substring(1)

	  		    this.ext  = ext;
                this.type = parseType(ext);

                whenBothDone(this, file, this.mediaGroup);
                return file;
            }
        }
        , mediaGroup: { type: String, set: function(root){
                whenBothDone(this, this.file, root);
                return root;
            }
        }
	    , parent: dm.Schema.ObjectId
	    , parents: { 
            type: [ dm.Schema.ObjectId ], 
            set: function(parents){
                this.parent = parents[0] || null;
                this.depth = parents.length;
                return parents;
            }
        }
	    , depth: Number
	    , ext: String
	    , name: String
	    , type: String
        , image: String
        , embeddedArt: Boolean
        , lastStream: Date
        , playCount:  Number
        , downloadCount: Number
        , stat: {}
    }, {strict:false});

    schema.virtual('location').get(function () {
        return path.resolve(this.mediaGroup, this.path);
    });

    //schema.virtual('embeddedImage').get(function () {
    //    return _.find(this.images, function(img){ 
    //        return !!~img.indexOf("cover_art_" + this.id);
    //    }, this);
    //});

    
    schema.methods.incPlayCount = function () {
        return Blue.cast(this.update({ 
            lastStream: new Date(),
            $inc: { playCount: 1 } 
        }).exec())
    };

    
    schema.methods.isMedia = function () {
        return this.type === c.mediaTypes.AUDIO 
            || this.type === c.mediaTypes.IMAGE 
            || this.type === c.mediaTypes.VIDEO
    };

    module.exports = dm.define("Media", schema);

    function whenBothDone(doc, file, root){
        if( arguments.length !== 3 || !file || !root) return;
    
        var abs = path.resolve(root, file);
    
        doc._id = getID(abs);
        doc.name = path.basename(abs, path.extname(file) );
        doc.parents = getParents(file, root)
    }

    function parseType(ext){
        var opts = c.extensions;
    
        if ( !ext ) return c.mediaTypes.DIR;

        if ( _.contains(opts.AUDIO, ext ) )      return c.mediaTypes.AUDIO
        else if ( _.contains(opts.IMAGE, ext ) ) return c.mediaTypes.IMAGE
        else if ( _.contains(opts.VIDEO, ext ) ) return c.mediaTypes.VIDEO

        return c.mediaTypes.AUDIO;
    }

    function getID(file){
	    var hash = crypto.createHash('md5').update(file).digest("hex").substring(0, 24)
	      , id = id_cache[hash];

	    if(!id){
		    id = new ObjectID(hash);
		    id_cache[hash] = id;
	    }

	    return id;
    }

    function getParents(file, root ){
	    var dirs = pathExt.parse(file).directories
	      , result = []
	      , dir, str;

  	    while ( dirs.length ){
  		    dir = dirs.pop()

  		    str = dirs.length ? dirs.join(path.sep) + path.sep + dir : dir;
  		    str = path.resolve(root, str);

            result.push( getID(str) );
  	    }
    
        return result;
    }