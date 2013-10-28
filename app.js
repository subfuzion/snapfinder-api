var nconf = require('nconf')
  , express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , logging = require('./lib/logging')
  , snapdb = require('./lib/snapdb')
  , snapcsv = require('./lib/snapcsv')
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

  logHarvestStatus({status: 'started'});

  importData(function (err, result) {
    if (err) {
      logHarvestStatus({status: 'error', error: err});
    } else {
      logHarvestStatus({status: 'success', count: result.processedCount});
    }
  });

  res.send(202);
});


// ==================================================================
// Implementation
// ==================================================================

function importData(callback) {

//  snapdb.dropStoresCollection(function (err, result) {
//    if (err) {
//      callback(err);
//      return;
//    }

//    console.log('dropped stores collection: ' + result);

  var storeCollection = snapdb.createStoreCollectionName();
  var importer = snapcsv.importer();
  var sentinel = -1;
  var harvestResult = {
    importCount: 0,
    processedCount: 0
  };

  importer.on('error', function (error) {
    callback(error);
  });

  importer.on('end', function (result) {
    harvestResult.importCount = result.count;
  });

  importer.on('data', function (store, index) {
    if (store === sentinel) {
      // no more data coming
      console.log('sentinel received, no more data');
      callback(null, harvestResult);
      return;
    }

    harvestResult.processedCount++;

    snapdb.saveStore(storeCollection, store, function (err, result) {
      if (err) {
        console.log('error saving store: ' + JSON.stringify(store));
        logHarvestStatus({status: 'error', error: err});
      } else {
        // console.log('#' + index + '(processedCount: ' + harvestResult.processedCount + ', importCount: ' + harvestResult.importCount); // + ' ' + JSON.stringify(result));
      }
    });
  });

  importer.import(sentinel);
//  });
}

function logHarvestStatus(harvestStatus) {
  harvestStatus = harvestStatus || {};
  harvestStatus.timestamp = Date();
  harvestStatus.status = harvestStatus.status || null;
  harvestStatus.error = harvestStatus.error || null;
  harvestStatus.count = harvestStatus.count || 0;

  log.information('harvest status', 'harvest', harvestStatus);
}


