var nconf = require('nconf')
  , express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , logging = require('./lib/logging')
  , snapdb = require('./lib/snapdb')
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
      console.log('app listening on ' + port);
    });
  }
});


// ==================================================================
// Routes
// ==================================================================

app.get('/', routes.index);

