var _ = require('lodash')
  , ObjectID = require("mongoose").Types.ObjectId


exports.queryBuilder = function queryBuilder(obj, query){
    query = query || {};
    
    for (var key in obj )
        query[key] = exports.matchArray( obj[key], key === "_id")   
    
    return query; 
}

exports.matchArray = function matchArray(val, isId){
    val = _.unsplat(val);

    var empty   =  _.isNullOrEmpty(val)
      , isArray = _.isArray(val);

    if ( isId && !empty ) 
        val = isArray 
            ? _map(val, function(i){ return new ObjectID(i) }) 
            : new ObjectID(val)

    return isArray && !empty 
        ? { $in: val } 
        :  val
}

// recursively we need to match against the 'Parents' array, but if we only want immediate children 'Parent' is fine
exports.matchRoots = function matchRoots(rootId, recurse){
    if ( !rootId ) return

    return recurse 
        ? { parents: exports.matchArray(rootId, true) } 
        : { parent:  exports.matchArray(rootId, true) };
}


exports.toTree = function toTree(nodes){
    var map = {}
      , roots = []
      , rootDepth = nodes[0].depth
      , node, parent;

    for (var i = 0; i < nodes.length; i++) {
        node = nodes[i];
        
        map[node._id] = i; // use map to look-up the parents

        if ( node.depth > rootDepth ) {
            parent = nodes[map[node.parent]];

            if( !parent.children ) 
                parent.children = [ node ];
            else
                parent.children.push(node);

        } else {
            roots.push(node);
        }
    }
    return roots;
}