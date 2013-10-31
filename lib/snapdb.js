var mongo = require('mongodb')
  ;

var db = null
  , bson = mongo.BSONPure
  , stores = 'stores'
  ;


exports.client = db;
exports.connect = connect;
exports.saveStore = saveStore;
exports.findStoresByZip = findStoresByZip;
exports.findStoresWithinRange = findStoresWithinRange;


function connect(uri, callback) {
  console.log('connecting to database (' + uri + ')');
  mongo.MongoClient.connect(uri, {safe: true}, function (err, client) {
    if (err) return callback(err);

    // save db for module scope
    db = client;
    db.addListener("error", function (error) {
      console.log("mongo client error: " + error);
    });

    // the import script will ensure indexes are generated now
    // db.stores.ensureIndex { "latitude": 1, "longitude": 1 } );

    callback(null, db);
  });
}

/**
 * Get the name of the current store collection in use
 * @param callback a function that expects (err, name)
 */
function getCurrentStoreCollectionName(callback) {
  // metadata is a collection of string key:value pairs
  db.collection('metadata', function(err, collection) {
    if (err) {
      callback(err);
      return;
    }

    collection.findOne({key: 'stores'}, function(err, entry) {
      if (err) {
        callback(err);
        return;
      }

      // if an entry exists, use it
      if (entry) {
        stores = entry.value;
        callback(null, stores);
        return;
      }

      // otherwise, create a new entry
      stores = createStoreCollectionName();
      collection.save({key: 'stores', value: stores}, function(err, result) {
        if (err) {
          callback(err);
          return;
        }

        console.log('created stores: ' + result.value);
        callback(null, result);
      });
    });
  });
}

function createStoreCollectionName() {
  return 'store-' + (new Date()).getTime();
}

function dropStoresCollection(storeCollection, callback) {
  db.collection(storeCollection, function(err, collection) {
    if (err) {
      callback(err);
      return;
    }

    collection.drop(function(ignoreError, dropped) {
      // safe to ignore errors at this point
      // (means the collection doesn't actually exist anyway)
      callback(null, dropped || true);
    });
  });
}

function updateCurrentStoreCollection(storeCollection, callback) {
  var prevStoreCollection = stores;

  db.collection('metadata', function(err, collection) {
    if (err) {
      callback(err);
      return;
    }

    collection.update({key: 'stores'}, {key: 'stores', value: storeCollection}, {upsert: true}, function(err, result) {
      if (err) {
        callback(err);
        return;
      }

      stores = storeCollection;

      dropStoresCollection(prevStoreCollection, function(err, result) {
        callback(null, result);
      });
    });
  });
}

function saveStore(storeCollection, store, callback) {
  db.collection(storeCollection, function(err, collection) {
    if (err) {
      callback(err);
      return;
    }

    collection.save(store, {safe: true}, function(err, result) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, result);
    });
  });
}

function findStoresByZip(zip, callback) {
  var zip5 = typeof(zip) == 'string' ? parseInt(zip, 10) : zip;

  db.collection(stores, function(err, collection) {
    if (err) return callback(err);

    collection.find({zip5:zip5}).limit(20).toArray(function(err, docs) {
      if (err) return callback(err);
      callback(null, docs);
    })
  })
}

/**
 * Return all stores within a certain distance (miles)
 */
function findStoresWithinRange(location, range, callback) {
  var r = range / 60
    , lat0 = location.lat - r
    , lat1 = location.lat + r
    , lng0 = location.lng - r
    , lng1 = location.lng + r
    ;

  db.collection(stores, function(err, collection) {
    if(err) return callback(err);

    var query = {
        latitude: { $gt: lat0, $lt: lat1 }
      , longitude: { $gt: lng0, $lt: lng1}
    };

    collection.find(query).toArray(function(err, docs) {
      if (err) return callback(err);
      callback(null, docs);
    });
  });
}
