module.exports = function(grunt) {
  var options = {
    livereload: true,
    port: grunt.option('port') || 8888,
    hostname:  grunt.option('server') || "localhost",
  };

  // Project configuration.
  grunt.initConfig({
    watch: {
      livereload: {
        // Here we watch any files changed
        options: {
          livereload: true
        },
        files: [
          'dist/**/*.js',
          'dist/**/*.css',
          'dist/**/*.html'
        ]
      }
    },
    connect: {
      app: {
        options: options
      }
    },
    concat : {
      dist : {
        src  : ['dist/js/**/*.js'],
        dest : 'dist/main.js'
      }
    },
    uglify : {
      dist : {
        src  : 'dist/main.js',
        dest : 'dist/main.min.js'
      }
    },
    htmlmin: {
      dist: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        files: {
          'index.html': 'dist/index.html'
        }
      }
    },
    copy: {
      dist: {
        files: [
          {
            expand: true,
            src: ['src/**/*.css'],
            dest: 'dist/'
          }
        ]
      }
    },
    comments: {
      dist: {
        options: {
          singleline: true,
          multiline: true
        },
        src: [ 'dist/*.html' ]
      }
    },
    includeSource: {
      options: {
        basePath: 'dist'
      },
      dist: {
        files: {
          'dist/index.html': './index.html'
        }
      }
    },
    run: {
      tscDist: {
        cmd: 'npx',
        args: [
          'tsc',
          '--outFile',
          'dist/main.min.js'
        ]
      }
    }
  });

  // dist
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-stripcomments');
  grunt.loadNpmTasks('grunt-include-source');
  grunt.loadNpmTasks('grunt-run');


  // Load grunt plugins
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');


  // Register tasks
  grunt.registerTask("default", ["connect", "watch"]);
  grunt.registerTask("dist", ["run:tscDist", "includeSource:dist", "copy:dist", "uglify:dist", "htmlmin:dist", "comments:dist"]);
};
