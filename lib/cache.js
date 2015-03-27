var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
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

exports.clean = function(taskname, callback) {
  rimraf(path.join(cacheDir, taskname), callback);
};

exports.isTreeChanged = function(taskname, srcnames) {
  var tree = [];
  try {
    tree = fs.readdirSync(path.join(cacheDir, taskname));
  } catch (e) {}
  for (var i = tree.length - 1; i >= 0; i--) {
    for (var j = srcnames.length - 1; j >= 0; j--) {
      if (tree[i] === srcname2filename(srcnames[j])) {
        tree.splice(i, 1);
        break;
      }
    }
  }
  return !!tree.length;
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

