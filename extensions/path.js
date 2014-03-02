
var path = require("path")
  , isWindows = process.platform === 'win32';

if ( isWindows ) {
    var splitDeviceRe =
        /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;

  // Regex to split the tail part of the above into [*, dir, basename, ext]
    var splitTailRe =
        /^([\s\S]*?)((?:\.{1,2}|[^\\\/]+?|)(\.[^.\/\\]*|))(?:[\\\/]*)$/;

    exports.isAbsolute = function(path) {
        var result = splitDeviceRe.exec(path),
            device = result[1] || '',
            isUnc = device && device.charAt(1) !== ':';
        // UNC paths are always absolute
        return !!result[2] || isUnc;
    };

    var splitPath = function(filename) {

        var result = splitDeviceRe.exec(filename),
            device = (result[1] || '') + (result[2] || ''),
            tail = result[3] || '';
          
        // Split the tail into dir, basename and extension
        var result2 = splitTailRe.exec(tail),
            dir = result2[1],
            basename = result2[2],
            ext = result2[3];

        return [device, dir, basename, ext];
    };

    exports.parse = function(filepath){
        var result = splitPath(filepath),
            device = result[0];

        var ext = result[3]
          , isUnc = device && device.charAt(1) !== ':'
          , isAbsolute = exports.isAbsolute(filepath)
          , basename = result[2].split('.')[0]
          , directories = result[1].split(/[\\\/]/).filter(function(p) {
                return !!p;
            });
            
        return {"device": device,            //outputs "C:"
            "directories": directories,        //outputs [test1,test2]
            "baseName": basename,               //outputs "test3"
            "filename" : basename + ext,       //outputs "test3.ext"
            "extension": ext,                   //outputs ".ext"
            "isUnc": isUnc,                     //outputs false
            "isAbsolute": isAbsolute,           //outputs true
            "filepath": filepath                //outputs C:/test1/test2/test3.ext
        };
        
        
    };


} else {
    var splitPathRe = /^(\/?)([\s\S]+\/(?!$)|\/)?((?:\.{1,2}$|[\s\S]+?)?(\.[^.\/]*)?)$/;

    var splitPath = function(filename) {
        var result = splitPathRe.exec(filename);

        return [result[1] || '', result[2] || '', result[3] || '', result[4] || ''];
    };
    
    exports.format = function(obj){
        var dir = obj.directories.join(path.sep)
          , file = obj.filename || (obj.basename + obj.ext)

          return ( obj.isAbsolute ? "/" : "") + dir + path.sep + file;
    }

    exports.parse = function(filepath){
            
        var result = splitPathRe.exec(filepath),
            isAbsolute = filepath.charAt(0) === '/',
            dir = result[2] || '',
            basename = result[3] || '',
            ext = result[4] || '',
            directories = dir.split(/[\/]/);
        
        return {
              "directories": directories,
              "baseName": basename,
              "filename" : basename + ext,
              "extension": ext,
              "isUnc": false,
              "isAbsolute": isAbsolute,
              "filepath": filepath
        };
    };
}