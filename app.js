var nconf = require('nconf')
  , express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , logging = require('./lib/logging')
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

var port = app.get('port');
http.createServer(app).listen(port, function () {
  console.log('app listening on ' + port);
});


// ==================================================================
// Routes
// ==================================================================

app.get('/', routes.index);

