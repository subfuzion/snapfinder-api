## Platform

SNAPfinder is developed using [Node.js][Node] (generally referred to as just "Node"), a fast, scalable network platform based on Google high performance V8 JavaScript engine.  Node's event-driven, non-blocking I/O model makes it lightweight, efficient, and ideal for serving I/O-oriented web APIs that provide a relatively thin layer over other web and data services.

For data storage, SNAPfinder uses [MongoDB][MongoDB], a high-performance, scalable, document-oriented NoSQL database that among many strengths is particularly well-suited for development with Node.


## Application Start Up

### Configuration

SNAPfinder applies settings in the following highest-to-lowest priority order
1. Application arguments
2. Environment
3. Settings file (config.json)

This facilitates development with various setting defaults specified in a configuration file that can be overridden via startup arguments or environment variables in different (e.g., production) environments, such as the database login credentials that should not be stored in a file and checked into version control.

The application uses [nconf][nconf] for configuration management. The following lines in app.js are responsible for loading settings in the desired priority order:

    var nconf = require('nconf');
    ...
    nconf.argv().env().file('./config.json');






[Node]:     http://nodejs.org
[MongoDB]:  http://mongodb.com
[nconf]:    https://npmjs.org/package/nconf

