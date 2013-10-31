// Credit: adapts code for Haversine formula and degrees-to-radian conversion found at:
// http://www.movable-type.co.uk/scripts/latlong.html

var util = require('util')
  , request = require('request')
  , qs = require('qs')
  ;


exports.getDistanceInMiles = getDistanceInMiles;
exports.getDistanceInKilometers = getDistanceInKilometers;
exports.kilometersToMiles = kilometersToMiles;
exports.degreesToRadians = degreesToRadians;
exports.geocode = geocode;


/**
 * Convert degrees to radians
 * @param degrees a Number in degrees
 */
function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * Convert kilometers to miles
 * @param distance a Number in kilometers
 */
function kilometersToMiles(distance) {
  return distance * 0.62;
}

/**
 * Calculate great circle distance and return result in kilometers
 * @param p1 the origin with lat (latitude) and lng (longitude) properties
 * @param p2 the destination with lat (latitude) and lng (longitude) properties
 */
function getDistanceInKilometers(p1, p2) {
  var R = 6371; // earth's radius in kilometers
  var dLat = degreesToRadians(p2.lat - p1.lat);
  var dLon = degreesToRadians(p2.lng - p1.lng); 
  var lat1 = degreesToRadians(p1.lat);
  var lat2 = degreesToRadians(p2.lat);

  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2)
    + Math.sin(dLon/2) * Math.sin(dLon/2)
    * Math.cos(lat1) * Math.cos(lat2);

  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var distance = R * c; // kilomter
  return distance;
}

/**
 * Calculate great circle distance and return result in miles
 * @param p1 the origin with lat (latitude) and lng (longitude) properties
 * @param p2 the destination with lat (latitude) and lng (longitude) properties
 */
function getDistanceInMiles(p1, p2) {
  return kilometersToMiles(getDistanceInKilometers(p1, p2));
}

/**
 * Geocode an address and callback with zip5, address (formatted address),
 * and location (lat, lng) properties, or null if not a valid address
 */
function geocode(address, callback) {
  var query = qs.stringify({ address: address })
    , reqtmpl = "http://maps.googleapis.com/maps/api/geocode/json?sensor=false&components=country:US&%s"
    , req = util.format(reqtmpl, query)
    , geo
    ;
  
  request(req, function(err, res, body) {
    if (err) {
      console.log('ERROR: ' + err);
      return callback(err);
    }

    console.log(body);

    geo = parseGoogleGeocodes(JSON.parse(body));

    if (!geo) {
      return callback("can't determine address");
    } else {
      return callback(null, geo);
    }
  });
}

/**
 * Parse the JSON result that Google returned
 * @param response an object with results parsed from the body of Google's API response
 * @return an object with zip5, address (formatted address),
 * and location (lat, lng) properties, or null if not a valid address
 */
function parseGoogleGeocodes(response) {
  // the result has a results property that is an array
  // there may be more than one result when the address is ambiguous
  // for pragmatic reasons, only use the first result
  // if the result does not have a zip code, then assume the user
  // did not provide a valid address

  var result = response.results[0]
    , zipComponent = findAddressComponent(result.address_components, 'postal_code')
    , simple = {}
    ;

  if (!zipComponent) return null;

  simple.zip5 = zipComponent.short_name;
  simple.address = result.formatted_address;
  simple.location = result.geometry.location;
  return simple;
}

/**
 * Return the address component that matches the specified type
 * @param components an array of address components
 * @type specifies the component to return
 * @return the component or null if no components matched
 */
function findAddressComponent(components, type) {
  for (var i = 0; i < components.length; i++) {
    if (components[i].types.indexOf(type) > -1) {
      return components[i];
    }
  }

  return null;
}

