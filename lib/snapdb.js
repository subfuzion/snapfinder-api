var mongo = require('mongodb');

var db = null
  , bson = mongo.BSONPure
  , lastStoreCollection
  , currentStoreCollection
  ;


exports.client = db;
exports.connect = connect;
exports.createStoreCollectionName = createStoreCollectionName;
exports.getCurrentStoreCollectionName = getCurrentStoreCollectionName;
exports.dropStoresCollection = dropStoresCollection;
exports.saveStore = saveStore;
exports.getData = getData;


function connect(uri, callback) {
  console.log('connecting to database (' + uri + ')');
  mongo.MongoClient.connect(uri, null, function (err, client) {
    if (err) {
      callback(err);
      return;
    }

    // save db for module scope
    db = client;
    db.addListener("error", function (error) {
      console.log("mongo client error: " + error);
    });

    // after connecting, note the current collection
    getCurrentStoreCollectionName(function(err, result) {
      if (err) {
        callback(err);
        return;
      }

      console.log('using currentStoreCollection: ' + currentStoreCollection);
      callback(null, db);
    });
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

    collection.findOne({key: 'currentStoreCollection'}, function(err, entry) {
      if (err) {
        callback(err);
        return;
      }

      // if an entry exists, use it
      if (entry) {
        currentStoreCollection = entry.value;
        callback(null, currentStoreCollection);
        return;
      }

      // otherwise, create a new entry
      currentStoreCollection = createStoreCollectionName();
      collection.save({key: 'currentStoreCollection', value: currentStoreCollection}, function(err, result) {
        if (err) {
          callback(err);
          return;
        }

        console.log('created currentStoreCollection: ' + result.value);
        callback(null, result);
      });
    });
  });
}

function createStoreCollectionName() {
  return 'store-' + (new Date()).getTime();
}

function dropStoresCollection(callback) {
  db.collection(currentStoreCollection, function(err, collection) {
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

function saveStore(storeCollection, store, callback) {
  db.collection(storeCollection, function(err, collection) {
    if (err) {
      callback(err);
      return;
    }

    collection.save(store, function(err, result) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, result);
    });
  });
}

function getData(callback) {
  db.collection(currentStoreCollection, function(err, collection) {
    if (err) {
      callback(err);
      return;
    }

    collection.find({}).limit(10).toArray(function(err, docs) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, docs);
    })
  })
}

