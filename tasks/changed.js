var path = require('path');
var _ = require('lodash');
var async = require('async');
var cache = require('../lib/cache');

module.exports = function(grunt) {

  grunt.registerTask(
    'changed',
    'Run a task with only those source files that have been ' + 'modified since the last successful run.',
    function() {
      var tasks = getNormalizedTasks(grunt.task.current.args.join(':'));
      var cache = require('../lib/cache').setCacheDir(this.options({
        cache: path.join(process.cwd(), '.grunt-changed-cache')
      }).cache);
      addTaskQueue(tasks, cache, this.async());
    }
  );

  grunt.registerMultiTask(
    'changed-clean',
    'This is internal task. Clean changed file hashes.',
    function() {
      var done = this.async();
      var options = this.options();

      var cache = require('../lib/cache');
      cache.clean(options.task, function() {
        done();
      });
    }
  );

  grunt.registerMultiTask(
    'changed-save',
    'This is internal task. Save changed file hashes.',
    function() {
      var cache = require('../lib/cache');
      var options = this.options();

      async.each(options.changed || [], function(change, done) {
        cache.write(options.task, change, function(err) {
          done(); // ignore write hash error.
        });
      }, this.async());
    }
  );

  function getNormalizedTasks(taskname) {
    var config = grunt.config(taskname.split(':'));

    // multi task.
    var tasks = [];
    for (var name in config) {
      tasks.push({
        name: [taskname, name].join(':'),
        changed: config[name].changed,
        isTarget: !!config[name].changed
      });
    }

    // return tasks if target in multi tasks.
    var targets = _.filter(tasks, function(task) { return !!task.changed });
    if (targets.length) {
      return tasks;
    }

    // single task.
    if (config.changed) {
      return [{
        name: taskname,
        changed: config.changed,
        isTarget: true
      }];
    }

    // no changed settings task.
    // this return value is wrong format.
    // but no problem. because isTarget is false.
    return [{
      name: taskname,
      changed: [],
      isTarget: false
    }];
  }

  function addTaskQueue(tasks, cache, callback) {
    var queue = [];
    async.each(tasks, function(task, done) {
      if (!task.isTarget) {
        queue.push(task.name);
        return done();
      }

      var targets = grunt.file.expand({filter: grunt.file.isFile}, task.changed);
      async.filter(targets, function(srcname, done) {
        cache.isChanged(task.name, srcname, function(isChanged) {
          done(isChanged);
        });
      }, function(changed) {
        // not changed.
        if (!changed.length && !cache.isTreeChanged(task.name, targets)) {
          grunt.log.writeln('>> Skip task: ' + task.name);
          return done();

        // changed.
        } else {
          // original task.
          queue.push(task.name);

          // clean hashes task.
          var cleanTaskname = ['changed-clean', task.name.replace(':', '-')];
          grunt.config.set(cleanTaskname, {
            options: {
              task: task.name
            }
          });
          queue.push(cleanTaskname.join(':'));

          // save hashes task.
          var saveTaskname = ['changed-save', task.name.replace(':', '-')];
          grunt.config.set(saveTaskname, {
            options: {
              task: task.name,
              changed: targets
            }
          });
          queue.push(saveTaskname.join(':'));

          done();
        }
      });
    }, function() {
      grunt.task.run(queue);
      callback();
    });
  }
};

