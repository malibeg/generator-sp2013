'use strict';
var util = require('util');
var path = require('path');
var spawn = require('child_process').spawn;
var yeoman = require('yeoman-generator');
var _ = require('underscore.string');

var AppGenerator = module.exports = function Appgenerator(args, options, config) {
  yeoman.generators.Base.apply(this, arguments);

  // setup the test-framework property, Gruntfile template will need this
  this.testFramework = options['test-framework'] || 'mocha';

  // for hooks to resolve on mocha by default
  if (!options['test-framework']) {
    options['test-framework'] = 'mocha';
  }

  // resolved to mocha by default (could be switched to jasmine for instance)
  this.hookFor('test-framework', { as: 'app' });

  this.mainPrecompilerFile = {
    coffee: {
      ext: 'coffee',
      content: 'console.log "\'Allo from CoffeeScript!"',
    },
    livescript: {
      ext: 'ls',
      content: 'console.log "\'Allo from LiveScript!"',
    },
    typescript: {
      ext: 'ts',
      content: 'console.log("\'Allo from TypeScript!");'
    },
    js: {
      ext: 'js',
      content: 'console.log("\'Allo from JavaScript!");'
    }
  };

  this.on('end', function () {
    this.installDependencies({
      skipInstall: options['skip-install'],
      skipMessage: options['skip-install-message']
    });
  });

  this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
};

util.inherits(AppGenerator, yeoman.generators.Base);

AppGenerator.prototype.askFor = function askFor() {
  var cb = this.async();

  // welcome message
  console.log(this.yeoman);

  var prompts = [{
    name: 'masterName',
    message: 'What is the name of your master file?'
  },
  {
    name: 'jsPrecompiler',
    type: 'list',
    message: 'What js precompiler do you want to use?',
    choices: [
      { name: "None", value: "js" },
      { name: "CoffeeScript", value: "coffee" },
      { name: "TypeScript", value: "typescript" },
      { name: "LiveScript", value: "livescript" },
    ],
    default: 0
  },
  {
    name: 'cssPrecompiler',
    type: 'list',
    message: 'What css precompiler do you want to use?',
    choices: [
      { name: "None", value: "css" },
      { name: "Compass (SCSS/SASS)", value: "compass" }
    ],
    default: 0
  },
  {
    name: 'webDav',
    message: "Where would you like to deploy to? (/path/to/WebDav or ENV_VARIABLE or nothing)"
  }
  ];

  this.prompt(prompts, function (answers) {
    // manually deal with the response, get back and store the results.
    // we change a bit this way of doing to automatically do this in the self.prompt() method.
    this.masterName = answers.masterName;
    this.masterSlug = _.slugify(this.masterName);
    this.webDav = answers.webDav ? {
      type: (/^[A-Z]+(_[A-Z]+)*$/.test(answers.webDav) ? "env" : "path"),
      value: answers.webDav
    } : null;
    this.jsPrecompiler = answers.jsPrecompiler;
    this.cssPrecompiler = answers.cssPrecompiler;

    cb();
  }.bind(this));
};

AppGenerator.prototype.gruntfile = function gruntfile() {
  this.template('Gruntfile.coffee');
};

AppGenerator.prototype.packageJSON = function packageJSON() {
  this.template('_package.json', 'package.json');
};

AppGenerator.prototype.git = function git() {
  this.copy('gitignore', '.gitignore');
  this.copy('gitattributes', '.gitattributes');
};

AppGenerator.prototype.bower = function bower() {
  this.copy('bowerrc', '.bowerrc');
  this.copy('_bower.json', 'bower.json');
};

AppGenerator.prototype.jshint = function jshint() {
  this.copy('jshintrc', '.jshintrc');
};

AppGenerator.prototype.editorConfig = function editorConfig() {
  this.copy('editorconfig', '.editorconfig');
};

AppGenerator.prototype.h5bp = function h5bp() {
  this.copy('favicon.ico', 'app/images/favicon.ico');
};

AppGenerator.prototype.mainStylesheet = function mainStylesheet() {
  if (this.cssPrecompiler === 'compass') {
    this.copy('main.scss', 'app/styles/main.scss');
  } else {
    this.copy('main.css', 'app/styles/main.css');
  }
};

AppGenerator.prototype.jadeFiles = function jadeFiles() {
  this.template('master.jade', 'app/jade/' + this.masterSlug + '.jade');
  this.template('layout.jade', 'app/jade/layout.jade');
  this.template('_s4-containers.jade', 'app/jade/includes/_s4-containers.jade');
};

AppGenerator.prototype.app = function app() {
  this.mkdir('app');
  this.mkdir('app/scripts');
  this.mkdir('app/styles');
  this.mkdir('app/images');
  this.mkdir('app/jade');
  this.mkdir('app/jade/includes');
  var precompilerFile = this.mainPrecompilerFile[this.jsPrecompiler];
  this.write('app/scripts/hello.' + precompilerFile.ext, precompilerFile.content);
};
