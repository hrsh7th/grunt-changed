var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var hash = require('./hash');

var cacheDir = path.join(process.cwd(), '.grunt-changed-cache');

exports.setCacheDir = function(dir) {
  cacheDir = dir;
  return exports;
};

exports.write = function(taskname, srcname, callback) {
  if (!fs.existsSync(cacheDir)) {
    mkdirp.sync(cacheDir);
  }

  if (!fs.existsSync(path.join(cacheDir, taskname))) {
    mkdirp.sync(path.join(cacheDir, taskname));
  }

  hash.fetchFileHash(srcname, function(err, hash) {
    if (err) return callback(err);

    fs.writeFile(path.join(
      cacheDir,
      taskname,
      srcname2filename(srcname)
    ), hash, callback);
  });
};

exports.fetch = function(taskname, srcname, callback) {
  var p = path.join(cacheDir, taskname, srcname2filename(srcname));
  fs.exists(p, function(exists) {
    if (!exists) return callback(null);
    fs.readFile(p, function(err, hash) {
      if (err) return callback(null);
      callback(hash.toString());
    });
  });
};

exports.isChanged = function(taskname, srcname, callback) {
  hash.fetchFileHash(srcname, function(err, currentHash) {
    if (err) return callback(true);

    exports.fetch(taskname, srcname, function(previousHash) {
      if (!previousHash) return callback(true);
      callback(currentHash !== previousHash);
    });
  });
};

function srcname2filename(srcname) {
  return hash.createHash(srcname);
}

