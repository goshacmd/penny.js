module SHA256 from 'crypto-js/sha256';
module RMD160 from 'crypto-js/ripemd160';
module Hex from 'crypto-js/enc-hex';

var chain = function(functions) {
  return functions.reduceRight(function(next, curr) {
    return function() {
      var result = curr.apply(null, arguments);
      return next.call(null, result);
    };
  });
};

var pipeline = function(val) {
  return function() {
    var functions = Array.prototype.slice.call(arguments);
    return chain(functions)(val);
  };
};

var x = function(meth) { return function(x) { return x[meth](); } };
var toString = x('toString');
var slice = function(a, b) { return function(x) { return x.slice(a, b); } };

var sha256 = function(hex) {
  return pipeline(hex)(Hex.parse, SHA256. toString);
};

var hash160 = function(hex) {
  return pipeline(hex)(Hex.parse, SHA256, RMD160, toString);
};

var checksum = function(hex) {
  return pipeline(hex)(
    Hex.parse,
    SHA256,
    SHA256,
    toString,
    slice(0, 8)
  );
};

export { sha256, hash160, checksum };
