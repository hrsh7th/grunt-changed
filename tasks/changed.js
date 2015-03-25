var _ = require('lodash');
var fs = require('fs');
var path = require('path');

var async = require('async');
var rimraf = require('rimraf');

var util = require('../lib/util');

var counter = 0;
var configCache = {};

function cacheConfig(config) {
  ++counter;
  configCache[counter] = config;
  return counter;
}

function pluckConfig(id) {
  if (!configCache.hasOwnProperty(id)) {
    throw new Error('Failed to find id in cache');
  }
  var config = configCache[id];
  delete configCache[id];
  return config;
}

function createTask(grunt) {
  return function() {
    var done = this.async();

    if (!(grunt.task.current && grunt.task.current.nameArgs)) {
      return done(new Error('nameArgs is not found.'));
    }

    var name = grunt.task.current.nameArgs;
    var taskName = name.replace(/:.*$/, '');
    var targetName = name.replace(/^.*?:/, '');
    var options = this.options({
      cache: path.join(__dirname, '..', '.cache')
    });

    var config = grunt.config.get(targetName.split(':'));
    var changed = [].concat(config.changed || []);
    var files = grunt.file.expand(changed);

    util.filterFilesByHash(
        files,
        options.cache,
        taskName,
        targetName,
        function(changedFiles) {
          changedFiles = changedFiles || [];

          if (changedFiles.length === 0) {
            grunt.log.writeln('No changed files to process.');
            return done();
          }

          grunt.log.writeln('Changed files: ' + changedFiles.join(', '));
          grunt.task.run(targetName);
          done();
        }
    );

  };
}


/** @param {Object} grunt Grunt. */
module.exports = function(grunt) {

  grunt.registerTask(
      'changed', 'Run a task with only those source files that have been ' +
      'modified since the last successful run.', createTask(grunt));

};

