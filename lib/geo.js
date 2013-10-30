// Credit: adapts code for Haversine formula and degrees-to-radian conversion found at:
// http://www.movable-type.co.uk/scripts/latlong.html

exports.getDistance = getDistance;
exports.getDistanceInKilometers = getDistanceInKilometers;
exports.kilometersToMiles = kilometersToMiles;
exports.degreesToRadians = degreesToRadians;


/**
 * Convert degrees to radians
 * @param degrees a Number in degrees
 */
function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
  }
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
 * @param p1 the origin with latitude and longitude properties
 * @param p2 the destination with latitude and longitude properties
 */
function getDistanceInKilometers(p1, p2) {
  var R = 6371; // earth's radius in kilometers
  var dLat = degreesToRadians(p2.latitude - p1.latitude);
  var dLon = degreesToRadians(p2.longitude - p1.longitude); 
  var lat1 = degreesToRadians(p1.latitude);
  var lat2 = degreesToRadians(p2.latitude);

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
 * @param p1 the origin with latitude and longitude properties
 * @param p2 the destination with latitude and longitude properties
 */
function getDistanceInMiles(p1, p2) {
  return kilometersToMiles(getDistanceInKilometers(p1, p2));
}

