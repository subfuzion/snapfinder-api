var nconf = require('nconf')
  , express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , logging = require('./lib/logging')
  , snapdb = require('./lib/snapdb')
  , snapcsv = require('./lib/snapcsv')
  , util = require('util');
  ;

var app
  , log
  , logLevel
  , db
  , mongodbUri
  ;


// ==================================================================
// Load settings (priority args, then env, then settings file)
// ==================================================================

nconf.argv().env().file('./config.json');

logLevel = nconf.get('LOG_LEVEL');

// WARNING! Defaults to local mongo
// Ensure MONGODB_URI env var set correctly in production
mongodbUri = nconf.get('MONGODB_URI');


// ==================================================================
// Configure Express
// ==================================================================

app = express();
app.set('port', process.env.PORT || 8080);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

if (app.get('env') == 'development') {
  app.use(express.errorHandler());
}


// ==================================================================
// Start listening for requests after connecting to database
// ==================================================================

// on successful connection to database, start listening for requests
snapdb.connect(mongodbUri, function (err, client) {
  if (err) {
    console.error('database connection failed, exiting now: ' + err);
    process.exit(1);
  } else {
    console.log('connected');

    // save db instance for use by route handlers
    db = client;
    app.set('db', db);

    log = logging.logger(db, logLevel);
    app.set('log', log);

    var port = app.get('port');
    http.createServer(app).listen(port, function () {
      console.log('server listening on ' + port);
      log.information('server started', 'server');
    });
  }
});


// ==================================================================
// View routes
// ==================================================================

app.get('/', routes.index);


// ==================================================================
// API routes
// ==================================================================

app.get('/data', function(req, res) {
 snapdb.getData(function(err, docs) {
   res.end(JSON.stringify(docs));
 })
})


/**
 * Start a harvest job
 * The request returns right away with HTTP 202 Accepted
 */
app.post('/jobs/harvest', function (req, res) {
  var print = function(err, result) {
    if (err) {
      console.log('error saving harvest status: ' + err);
    } else {
      console.log('saved harvest status: ' + JSON.stringify(result));
    }
  };

  var spawn = require('child_process').spawn;
  var importer = spawn('./importsnap', [mongodbUri, logLevel]);

  importer.stdout.on('data', function (data) {
    util.print(data.toString());
  });

  importer.stderr.on('data', function (data) {
    util.print(data.toString());
  });

  importer.on('close', function (code) {
    console.log('import process exited with code ' + code);
  });

  res.send(202);
});


// ==================================================================
// Implementation
// ==================================================================


