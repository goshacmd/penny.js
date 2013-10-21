var decompress = require('decompress');
var fs = require('fs');
var path = require('path');

module.exports = function(grunt) {
  grunt.registerMultiTask('browser', 'Export a module to the window', function() {
    var opts = this.options();
    this.files.forEach(function(f) {
      var output = ["(function(globals) {"];

      output.push.apply(output, f.src.map(grunt.file.read));

      output.push(grunt.template.process(
        'window.<%= pkg.global %> = require("<%= pkg.namespace %>");'
      ));
      output.push('})(window);');

      grunt.file.write(f.dest, grunt.template.process(output.join("\n")));
    });
  });

  grunt.registerMultiTask('decompress', 'Decompress files into a folder', function() {
    var done = this.async();

    var file = this.files[0];
    var dest = file.dest;
    var srcFiles = grunt.file.expand(file.src);
    var f = srcFiles[0];
    var inp = fs.createReadStream(f, 'binary');
    var out = decompress.extract({ ext: '.tar.gz', path: dest });

    inp.pipe(out);

    out.on('close', done);
  });

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: {
      build: ['tmp'],
      release: ['dist'],
    },

    transpile: {
      amd: {
        type: 'amd',
        files: [{
          expand: true,
          cwd: 'lib/',
          src: ['**/*.js'],
          dest: 'tmp/transpiled/',
          ext: '.amd.js'
        }]
      },
    },

    decompress: {
      crypto: {
        src: 'vendor/tl-crypto-js/build/crypto-js.tar.gz',
        dest: 'tmp/'
      }
    },

    replace: {
      crypto: {
        replacements: [{
          from: './crypto-js/',
          to: './'
        }, {
          from: './',
          to: 'crypto-js/'
        }],
        src: ['tmp/crypto-js/lib/**/*.js'],
        dest: 'tmp/crypto-js-fixed/'
      }
    },

    concat: {
      crypto: {
        src: 'tmp/crypto-js-fixed/**/*.js',
        dest: 'tmp/crypto-js-mod.js',
        options: {
          process: function(src, filepath) {
            // make proper AMD modules out of crypto-js files
            var name = path.basename(filepath, '.js');
            var fullName = name === 'crypto-js' ? 'crypto-js' : 'crypto-js/' + name;
            return src.replace('define([', 'define("' + fullName +'", [');
          }
        }
      },
      amd: {
        src: [
          'tmp/crypto-js-mod.js',
          'tmp/transpiled/**/*.amd.js'
        ],
        dest: 'dist/penny.amd.js'
      }
    },

    browser: {
      dist: {
        src: [
          'vendor/almond/almond.js',
          'dist/penny.amd.js'
        ],
        dest: 'dist/penny.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-es6-module-transpiler');
  grunt.loadNpmTasks('grunt-text-replace');

  grunt.registerTask('crypto', ['decompress:crypto', 'replace:crypto', 'concat:crypto']);
  grunt.registerTask('build', ['clean', 'transpile', 'crypto', 'concat:amd', 'browser']);
  grunt.registerTask('default', ['build']);
};
