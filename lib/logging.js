var util = require('util')
  , events = require('events')
  ;

var LOG_LEVEL = {
  TRACE: 0,
  DEBUG: 1,
  INFORMATION: 2,
  WARNING: 3,
  ERROR: 4,
  FATAL: 5,
  SILENT: 6
};


exports.logger = logger;
exports.LOG_LEVEL = LOG_LEVEL;

function logger(client, logLevel) {
  return new Logger(client, logLevel);
}

function Logger(client, logLevel) {
  var self = this;
  var db = client;

  this.logLevel = (typeof logLevel === 'undefined') ? 5 : logLevel;

  /*
   No events emitted and nothing logged if level < logLevel
   0 - trace
   1 - debug
   2 - information
   3 - warning
   4 - error
   5 - fatal
   */
  this.log = function log(message, level, category, data) {
    if (typeof level === 'undefined') level = 6;
    if (level < logLevel) return;

    if (typeof category == 'undefined') category = '';

    var entry = {
      timestamp: Date(),
      message: message,
      level: level,
      category: category,
      data: data
    };

    // console.log(entry);

    db.collection('log', function (err, collection) {
      if (err) {
        console.log(err);
        self.emit('error', err);
      } else {
        collection.save(entry, function (err, result) {
          if (err) {
            console.log(err);
            self.emit('error', err);
          } else {
            self.emit('data', result);
          }
        });
      }
    });
  };

  this.trace = function (message, category, data) {
    this.log(message, LOG_LEVEL.TRACE, category, data);
  };

  this.debug = function (message, category, data) {
    this.log(message, LOG_LEVEL.DEBUG, category, data);
  };

  this.information = function (message, category, data) {
    this.log(message, LOG_LEVEL.INFORMATION, category, data);
  };

  this.warning = function (message, category, data) {
    this.log(message, LOG_LEVEL.WARNING, category, data);
  };

  this.error = function (message, category, data) {
    this.log(message, LOG_LEVEL.ERROR, category, data);
  };

  this.fatal = function (message, category, data) {
    this.log(message, LOG_LEVEL.FATAL, category, data);
  };
}

util.inherits(Logger, events.EventEmitter);
