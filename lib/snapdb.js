var mongo = require('mongodb');

var db = null
  , bson = mongo.BSONPure
  ;


exports.client = db;
exports.connect = connect;


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

    callback(null, db);
  });
}
