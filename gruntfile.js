module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({


    copy: {
      test1: {
        changed: 'test/fixtures/test1/src/**',
        files: [{
          expand: true,
          cwd: 'test/fixtures/test1/src',
          src: '**',
          dest: 'test/fixtures/test1/dest'
        }]
      },
      test2: {
        files: [{
          expand: true,
          cwd: 'test/fixtures/test2/src',
          src: '**',  
          dest: 'test/fixtures/test2/dest'
        }]
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadTasks('tasks');

};

