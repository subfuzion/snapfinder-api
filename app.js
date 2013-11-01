var nconf = require('nconf')
  , http = require('http')
  , util = require('util')
  , express = require('express')
  , logging = require('./lib/logging')
  , snapfinder = require('snapfinder-lib');
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

// all environments
app = express();
app.set('port', process.env.PORT || 8080);
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);

// development only
if (app.get('env') == 'development') {
  app.use(express.errorHandler());
}


// ==================================================================
// Start listening for requests after connecting to database
// ==================================================================

// on successful connection to database, start listening for requests
snapfinder.connect(mongodbUri, function (err, client) {
  if (err) {
    console.error('database connection failed, exiting now: ' + err);
    process.exit(1);
  } else {
    console.log('connected');

    // save client instance in global app
    db = client;
    app.set('db', db);

    // save logger instance in global app
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
// API routes
// ==================================================================

/**
 * Start a harvest job
 * The request returns right away with HTTP 202 Accepted
 */
app.post('/v1/jobs/harvest', function (req, res) {
  var spawn = require('child_process').spawn
    , importer = spawn('./node_modules/snapfinder/bin/import');

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

/**
 * Search for nearby stores by providing either an address or a
 * latlng and optional range query parameters.
 * Query parameters:
 *   address - can be any valid address (or portion of an address)
 *   latlng - a coordinate pair, for ex: latlng=40.714224,-73.961452
 *     Note: Ensure that no space exists between the latitude and
 *     longitude values when passed in the latlng parameter
 *   range - specifies a distance in miles, defaults to 3
 */
app.get('/v1/stores/nearby', function(req, res) {
  var address = req.query.address
    , latlng = req.query.latlng
    , range = req.query.range || 3;
    ;

  function sendError(err) {
    console.log('ERROR: ' + err);
    res.json(400, { reason: err});
  }

  function sendResponse(err, result) {
    if (err) {
      sendError(err);
    } else {
      res.json(result);
    }
  }

  if (!address && !latlng) {
    return sendError("request must specify either address or latlng query parameter");
  }

  if (latlng) {
    return snapfinder.findStoresInRangeLocation(parselatlng(latlng), range, sendResponse);
  } else {
    return snapfinder.findStoresInRangeAddress(address, range, sendResponse);
  }
});

function parselatlng(latlng) {
  try {
    var coords = latlng.split(',');
    return { lat: parseFloat(coords[0]), lng: parseFloat(coords[1]) };
  } catch (err) {
    return null;
  }
}

