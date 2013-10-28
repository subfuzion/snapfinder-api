var fs = require('fs')
  , http = require('http')
  , events = require('events')
  , util = require('util')
  , csv = require('csv')
  , unzip = require('unzip')
  , path = require('path')
  ;


exports.parser = function () {
  return new Parser();
}

exports.importer = function () {
  return new Importer();
}


var Parser = function () {
  var self = this;
  var rowsToDiscard = 1; // don't save or count the csv header row

  this.parseFile = function (pathname) {
    this.parseStream(fs.createReadStream(pathname));
  };

  /**
   * Parses a CSV stream containing SNAP records.
   * @param stream
   */
  this.parseStream = function (stream) {
    csv()
      .from.stream(stream)
      .on('record', function (row, index) {
        //console.log('CSV=>  #' + index + ' ' + JSON.stringify(row));

        // discard the first row with the field names
        if (index < rowsToDiscard) return;

        var data = {};
        data.storeName = row[0];
        data.longitude = row[1];
        data.latitude = row[2];
        data.address1 = row[3];
        data.address2 = row[4];
        data.city = row[5];
        data.state = row[6];
        data.zip5 = row[7];
        data.zip4 = row[8];

        self.emit('data', data, index);
      })
      .on('end', function (count) {
        //console.log('CSV=> end count: ' + count);
        self.emit('end', { status: 'success', count: count - rowsToDiscard});
      })
      .on('error', function (error) {
        //console.log('CSV=> error: ' + error);
        self.emit('error', error);
      });
  };
};

util.inherits(Parser, events.EventEmitter);

var Importer = function () {
  var self = this;

  /**
   * All-in-one function to retrieve, unzip, and parse CSV data.
   * Emits data, end, and error events.
   * @param sentinel If provided, the sentinel and total records
   * processed will be supplied as the arguments for the last data event.
   */
  this.import = function (sentinel) {
    var options = {
      host: 'www.snapretailerlocator.com',
      path: '/export/Nationwide.zip'
    };

    http.request(options, function (res) {

      res.pipe(unzip.Parse())
        .on('entry', function (entry) {
          var fileName = entry.path;
          var type = entry.type; // 'Directory' or 'File'
          var size = entry.size;

          if (path.extname(fileName) === '.csv') {

            var parser = new Parser()
              .on('data', function (data, index) {
                // console.log('#' + index + ' ' + JSON.stringify(data));
                self.emit('data', data, index);
              })
              .on('end', function (result) {
                console.log('result.status: ' + result.status);
                console.log('result.count: ' + result.count);
                if (sentinel) {
                  self.emit('data', sentinel, result.count);
                }
                self.emit('end', result);
              })
              .on('error', function (error) {
                self.emit('error', error);
              });

            parser.parseStream(entry);

          } else {
            entry.autodrain();
          }
        })
        .on('close', function () {
          console.log('closed archive');
        })
        .on('error', function (error) {
          self.emit('error', error);
        });
    }).end();
  };
};

util.inherits(Importer, events.EventEmitter);
