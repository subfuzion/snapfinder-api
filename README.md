SNAPfinder (snapfinder.org)
===========================

[API][API]

Introduction
------------
SNAPfinder is a REST API for locating retailers that participate in the SNAP (formerly known as Food Stamps) program.

The API was developed as a collaboration between the GSA and the private sector, sponsored by [ITSource Technology Inc.][ITSource], as an Open Source project in support of the Federal Government's commitment to Open Data.

The API can be used to support both open source and commercial app development, as well as to support state and private websites, or any agency, organization, or enterprise that wishes to use or incorporate information regarding SNAP retailer locations.

Data is harvested daily from files published by the USDA, stored in a NoSQL cloud database, and exposed in JSON format via a REST API.

The API is programmed using Node.js and data is stored using MongoDB. The project is Open Source under the MIT License and available on GitHub.


Goals
-----
* To make a positive contribution to society by leveraging Open Data
* To demonstrate a successful model of Open Source collaboration between a Federal Agency and the private sector development community
* To provide a well-documented example of creating and hosting a REST API based on Node and MongoDB. Development, version control, testing, and hosting can be done using free, cloud-based tools and services accessible from any computer with access to a browser.


What is SNAP?
-------------
[SNAP][USDA] stands for the Supplemental Nutrition Assistance Program mandated by the Federal Government and supervised by states to help millions of individuals and families who need financial assistance to buy food. Formerly known as the Food Stamp Program, SNAP provides an economic benefit as well as well as serving to eliminate hunger.

Today, instead of food stamps, eligible recipients are issued Electronic Benefit Transfer (EBT) cards. These cards can be used to purchase food and beverage items authorized by the USDA's SNAP program at retailers that accept EBT transactions.

The [USDA Food and Nutrition Service][USDA] maintains and publishes a list of retailers (vendors) across the country that welcome SNAP EBT customers. Data is stored in files in Comma Separated Value (CSV) format, which typically can be read by spreadsheet programs, such as Microsoft Excel.


SNAP Data
---------
[SNAP Retailer Locator][SNAP] data is harvested from data published by the [USDA Food and Nutrition Service][USDA] at the following URL:

* http://www.snapretailerlocator.com/export/Nationwide.zip

### Resource Format
The URL retrieves a zip file that stores a single CSV file with a .csv extension. The name of the file represents the publish date; for example:

`store_locations_2013_07_16.csv`

The content data fields are:

| CSV Field       | JSON name |
|:----------------|:----------|
| Store_Name      | storeName |
| Longitude       | longitude |
| Latitude        | latitude  |
| Address         | address1  |
| Address Line #2 | address2  |
| City            | city      |
| State           | state     |
| Zip5            | zip5      |
| Zip4            | zip4      |

***SNAP Data***

## Harvesting SNAP Data

The SNAP data file is periodically downloaded for updates, parsed, and then stored in a MongoDB database.

This harvesting processed is triggered by a CRON job scheduled at [cron.io][CRONIO]. The job is currently configured to run once per day. When the job runs, it POSTs a request to the following URI:

`http://api.snapfinder.org/v1/jobs/harvest`

### How to test harvesting data during the Government Shutdown

(details)

<https://docs.google.com/uc?export=download&id=0B1CcNQn50OzNUmlab1FPbVJRQnc>


#### snapcsv.js
The code for retrieving and parsing the file is in `lib/snapcsv.js`. This module exports two functions:

* `parser` returns a new `Parser` instance with `parseStream` and `parseFile` methods for parsing SNAP data in CSV format. `Parser` emits `record` (for each row), `end`, and `error` events.

* `importer` returns a new `Importer` instance with an `import` method that handles retrieving the remote zip file, extracting the stored CSV file, and parsing the data. `Importer` emits `data` (for each record parsed from the input), `end`, and `error` events.

#### snapdb.js
The code for storing the parsed data is in `lib/snabdb.js`. It exports the following functions used by the harvesting job.

* `connect` connects to the database
* `saveStore` saves a store record (see above table for JSON field names)

More details are in the MongoDB section.

MongoDB
-------
The database is hosted at [MongoLab][MongoLab]. MongoLab provides cloud database services for MongoDB and offers a free plan for up to 0.5 GB of storage. Current storage requirements are less than 80 MB.

The database is named `snapdb` and contains the following collections:

| Collection | Description
|:-----------|:------------
| metadata   | Information about the data, such as active store collection
| harvestLog | Results of harvest job, including status and stores processed count
| store-###  | The latest retailer collection (pointed to by metadata/currentStoreCollection)

***Database Collections***

Each store document (row) in the store collection contains all the fields named in the ***SNAP Data*** table above, along with a standard MongoDB `_id` field.

Development
-----------
One of the goals of this project is to provide a documented example of building an API using open source tools available online.

Developers need:

* A GitHub account
* A Cloud9 account




[API]:               https://github.com/tonypujals/snapfinder/wiki/
[ITSource]:          http://www.itsourcetek.com/
[SNAP]:              http://www.snapretailerlocator.com/
[USDA]:              http://www.fns.usda.gov/snap/
[CRONIO]:            http://cronio.io/
[MongoLab]:          https://mongolab.com/
[GitHub]:            https://github.com/
[C9Chrome]:          https://chrome.google.com/webstore/detail/cloud9-button-for-github/gkddhhofgajgmgfebhaiihlahjmjkmph?hl=en-US
[Cloud9]:            https://c9.io/
