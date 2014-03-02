var _ = require('lodash')
  , path = require('path');

module.exports = function(grunt) {

    grunt.initConfig({
        handlebars: {
            options: {
                namespace: 'templates',
                node: true,
                processName: function(filePath) { // input:  templates/_header.hbs               
                    return path.basename(filePath, '.hbs')
                }
            },

              "templates.js": "./public/*.hbs",
        }

    });

    grunt.loadNpmTasks('grunt-contrib-handlebars');
    grunt.registerTask('default', ['handlebars']);
};