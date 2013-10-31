var nconf = require('nconf')
  , express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , util = require('util')
  , logging = require('./lib/logging')
  , snapdb = require('./lib/snapdb')
  , snapcsv = require('./lib/snapcsv')
  , geo = require('./lib/geo')
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
app.use(express.json());
app.use(express.urlencoded());
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

/**
 * Start a harvest job
 * The request returns right away with HTTP 202 Accepted
 */
app.post('/v1/jobs/harvest', function (req, res) {
  var spawn = require('child_process').spawn;
  // var importer = spawn('./bin/importsnap', [mongodbUri, logLevel]);
  var importer = spawn('./bin/import');

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

app.get('/v1/stores/nearby', function(req, res) {
  console.log('QUERY: ' + JSON.stringify(req.query));

  res.header('Content-Type', 'application/json');
  var address = req.query.address;
  if (!address) {
    return res.json(400, { reason: "missing address" });
  }

  findStoresByAddress(address, function(err, result) {
    res.json(result);
  });
})


// ==================================================================
// Implementation
// ==================================================================

function findStoresByAddress(address, callback) {
  geo.geocode(address, function(err, georesult) {
    if (err) return callback(err);

    snapdb.findStoresByZip(georesult.zip5, function(err, stores) {
      if (err) return callback(err);

      georesult.stores = sortStoresByDistance(georesult.location, stores);
      return callback(null, georesult);
    });
  });
}

function sortStoresByDistance(location, stores) {
  var i, s;

  for (i = 0; i < stores.length; i++) {
    s = stores[i];
    s.distance = geo.getDistanceInMiles(location, { lat:s.latitude, lng:s.longitude });
  }

  stores.sort(function(a,b) {
    return a.distance - b.distance;
  });

  return stores;
}

