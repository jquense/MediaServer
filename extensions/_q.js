

var Q = require('q')
  , _ = require('lodash')
  , _Q = {};

// each, eachSeries, and eachLimit are very similar to their map counterparts, only the results are ignored
// order is always preserved, regardless if done in parallel or series

function wrap(fn){
	return Q().then(fn);
}

var each =_Q.each = function(arr, iterator, thisArg) {
    var args = arguments;

	return wrap(function () {
		return _.each.apply(this, args)
	}).all()
};

var map =_Q.map = function(arr, iterator, thisArg) {
    var args = arguments;

    return wrap(function() {
		return _.map.apply(this, args)
	}).all()
};
 

_Q.filter = function() {
    var args = arguments;
  	return wrap(function () {
		return _.filter.apply(this, args)
	}).all()
}
 

_Q.reject = function() {
    var args = arguments;

  	return wrap(function () {
		return _.reject.apply(this, args)
	}).all()
}

 
// reject(files, fs_stat).then(console.log, console.error)
// rejectSeries(files, fs_stat).then(console.log, console.error)
 
_Q.reduce = function  (arr, initialVal, func) {
  var currentPromise = Q(initialVal)
  arr.map(function (el) {
    return currentPromise = currentPromise.then(function (memo) {
      return func(memo, el)
    })
  })
  return currentPromise
}
 
_Q.reduceRight = function  (arr, initialVal, func) {
  var currentPromise = Q(initialVal)
  arr.reverse().map(function (el) {
    return currentPromise = currentPromise.then(function (memo) {
      return func(memo, el)
    })
  })
  return currentPromise
}
 
// reduce([1,2,3], 0, function (memo, item) { return Q.delay(100).thenResolve(memo + item) }).then(console.log, console.error)
// reduceRight([1,2,3], 0, function (memo, item) { return Q.delay(100).thenResolve(memo + item) }).then(console.log, console.error)
 
_Q.any = function  () {
	return wrap(function(){
		return _.any.apply(this, arguments)
	})
}
 

 
// detect(files, fs_stat).then(console.log, console.error)
// detectSeries(files, fs_stat).then(console.log, console.error)
 
_Q.sortBy = function  (arr, func) {
  var promises = arr.map(function (el) { return func(el) })
  return Q.all(promises).then(function (results) {
    return arr.sort(function (a, b) {
      return results[arr.indexOf(a)] < results[arr.indexOf(b)] ? -1 : 1
    })
  })
}
 
// sortBy([2,1,3], function (item) { return Q.delay(100).thenResolve(item) }).then(console.log, console.error)
 
_Q.some = function  (arr, func) {
  var promises = arr.map(function (el) { return func(el) })
  return Q.all(promises).then(function (results) {
    return results.some(function (el) { return el })
  })
}
 
// some([2,1,3], function (item) { return Q.delay(100).thenResolve(item == 1) }).then(console.log, console.error)
 
_Q.every = function  (arr, func) {
  var promises = arr.map(function (el) { return func(el) })
  return Q.all(promises).then(function (results) {
    return results.every(function (el) { return el })
  })
}
 
// every([1,1,1], function (item) { return Q.delay(100).thenResolve(item == 1) }).then(console.log, console.error)
 
_Q.concat = function  (arr, func) {
  var promises = arr.map(function (el) { return func(el) })
  return Q.all(promises).then(function (results) {
    return Array.prototype.concat.apply([], results) // flatten results
  })
}
 
 _Q.concatSeries = function (arr, func) {
  var currentPromise = Q()
  var promises = arr.map(function (el) {
    return currentPromise = currentPromise.then(function () {
      return func(el)
    })
  })
  return Q.all(promises).then(function (results) {
    return Array.prototype.concat.apply([], results) // flatten results
  })
}
 
// concat(dirs, fs_readdir).then(console.log, console.error)
// concatSeries(dirs, fs_readdir).then(console.log, console.error)
 
function parallel (funcs) {
  var promises = funcs.map(function (func) { return func() })
  return Q.all(promises)
}
 
function series (funcs) {
  var currentPromise = Q()
  var promises = funcs.map(function (func) {
    return currentPromise = currentPromise.then(func)
  })
  return Q.all(promises)
}
 
function parallelLimit (funcs) {
  var batches = funcs.reduce(function (last, next, index) {
    if (index % limit == 0) last.push([next])
    else last[last.length-1].push(next)
    return last
  }, [])
 
  var currentPromise = Q()
  var promises = batches.map(function (batch) {
    return currentPromise = currentPromise.then(function () {
      return Q.all(batch)
    })
  })
 
  return Q.all(promises)
    .then(function (results) {
      return Array.prototype.concat.apply([], results) // flatten array
    })
}
 
function wilst (test, func) {
  if (!test()) return Q('wilst')
  return func().then(function () {
    return wilst(test, func)
  })
}
 
function doWilst (func, test) {
  return func().then(function () {
    if (!test()) return Q('dowilst')
    return doWilst(func, test)
  })
}
 
// var count = 0
// wilst(function () { return count < 5 }, function () { count++; return Q.delay(100) }).then(console.log, console.error)
// var doCount = 0
// doWilst(function () { doCount++; return Q.delay(100) }, function () { return doCount < 5 }).then(console.log, console.error)
 
function until (test, func) {
  if (test()) return Q('until')
  return func().then(function () {
    return wilst(test, func)
  })
}
 
function doUntil (func, test) {
  return func().then(function () {
    if (test()) return Q('dountil')
    return doUntil(func, test)
  })
}
 
// var acount = 0
// until(function () { return count > 5 }, function () { acount++; return Q.delay(100) }).then(console.log, console.error)
// var adoCount = 0
// doUntil(function () { adoCount++; return Q.delay(100) }, function () { return adoCount < 5 }).then(console.log, console.error)
 
function forever (func) {
  return func().then(function () { return forever(func) })
}
 
// var trigger = 0
// forever(function () {
//   if (trigger > 10000) throw "oh no"
//   return Q.delay(1)
// }).then(console.log, console.error)
 
function waterfall (funcs) {
  return funcs.reduce(Q.when, Q())
}
 
// waterfall([ function () { return fs_stat('./fixtures/file1') }, function (stat) { console.log(stat) } ]).then(console.log, console.error)
 
function compose () {
  var funcs = Array.prototype.slice.call(arguments)
  return function () {
    return funcs.reduce(Q.when, Q.apply(null, arguments))
  }
}
 
// function add1 (n) { return Q.delay(1000).thenResolve(n+1) }
// function mul3 (n) { return Q.delay(1000).thenResolve(n*3) }
// var add1mul3 = compose(add1, mul3)
// add1mul3(20).then(console.log, console.error)
 
function applyEach (funcs) {
  var args = Array.prototype.slice.call(arguments, 1)
  var promises = funcs.map(function (func) { return Q.apply(Q, args).then(func) })
  return Q.all(promises)
}
 
function applyEachSeries (funcs) {
  var args = Array.prototype.slice.call(arguments, 1)
  var currentPromise = Q()
  var promises = funcs.map(function (func) {
    return currentPromise = currentPromise.then(function () {
      return Q.apply(Q, args).then(func)
    })
  })
  return Q.all(promises)
}

module.exports = _Q;