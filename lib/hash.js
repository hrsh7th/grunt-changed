var crypto = require('crypto');
var fs = require('fs');

exports.fetchFileHash = function(path, callback) {
  fs.readFile(path, function(err, file) {
    if (err) return callback(err);

    callback(null, exports.createHash(file));
  });
};

exports.createHash = function(str) {
  var hash = crypto.createHash('md5');
  hash.update(str);
  return hash.digest('hex');
};

