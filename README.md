# honeybadger-etl
Extract, Transform and Load libraries for Node based ETL Streams

## Usage

```
var Extractor = require('honeybadger-etl/lib/extractor').Factory;
var BeanCounter = require('honeybadger-etl/lib/transform/beancounter');
var Normalizer = require('honeybadger-etl/lib/transform/normalize');
var Geocode = require('honeybadger-etl/lib/transform/geocode');
var MySQL = require('honeybadger-etl/lib/load/mysql-query');
var Filesystem = require('honeybadger-etl/lib/load/filesystem');
var FTPLoader = require('honeybadger-etl/lib/load/ftp');

var $e = Extractor({...});

var normalize = new Normalizer({...});
var geocoder = new Geocode();

var loader = {
  mysql: new MySQL({...}),
  fs: new Filesystem({...}),
  ftp: new FTPLoader({...})
};

// Map normalize the input stream and geocode each record
var in = $e.pipe(normalize).pipe(geocoder);

// Split normalized stream to three distinct outputs
in.pipe(loader.mysql);
in.pipe(loader.fs);
in.pipe(loader.ftp);

// Make sure that the extractor and any loaders have properly
// connected, logged in, and ready.
$e.ready()
.then(loader.mysql.ready)
.then(loader.fs.ready)
.then(function(){
  $e.start();
});
```

## Sample Configurations

### RETS Source

```
{
   "_id": "ab9b14c4af6220e3985bfb73ec0023ee",
   "_rev": "1-fca514790c042f79ec7cb8433b0d3f90",
   "name": "MLS",
   "status": "active",
   "source": {
       "uri": "https://rets.mls.org:443/contact/rets/login",
       "type": "RETS",
       "version": "1.7",
       "auth": {
           "username": "****",
           "password": "****",
           "userAgentHeader": "RETS-Connector/1.2",
           "userAgentPassword": "****"
       }
   },
   "type": "dsn",
   "activatedOn": 1434122985822
}
```

### FTP Source

```
{
   "_id": "2a8ba4825d2354864aa34ff9af0010b0",
   "_rev": "1-d9d07202bc9ab54cf978f1bcf81fa3ea",
   "name": "My FTP Server",
   "source": {
       "uri": "0.0.0.0",
       "type": "FTP",
       "auth": {
           "username": "****",
           "password": "****"
       }
   },
   "type": "dsn",
   "status": "active",
   "activatedOn": 1398796662244
}
```

### RETS Extractor with Media

```
{
   "_id": "2a08bfad35f1ffb1b92e109615003a03",
   "_rev": "1-94df25c7d8d6b4b08447c1a825f37251",
   "name": "Closed Listings - Yesterday to now",
   "source": "ab9b14c4af6220e3985bfb73ec0023ee",
   "target": {
       "type": "Property",
       "class": "Residential",
       "res": "(DateClosedSale={Date(yesterday)}+)",
       "format": "DMQL2",
       "options": {
           "mediaExtract": true,
           "mediaExtractStrategy": "MediaGetURL",
           "mediaExtractKey": "ListingKey",
           "mediaExtractTarget": "/tmp/images/{MLnumber}.jpg",
           "mediaExtractQuery": "(ClassKey={ListingKey}),(MediaOrder=0)",
           "mediaQueryExtractKey": "MediaURL"
       }
   },
   "status": "active",
   "type": "extractor",
   "activatedOn": 1423072202793
}
```

### FTP Extractor

```
{
   "_id": "d67d17ec375baebb948b6d7745001212",
   "_rev": "1-6ebfecbc914a61625e9bdbc991efd3e9",
   "name": "Sample Data File from FTP",
   "source": "d67d17ec375baebb948b6d7745000987",
   "target": {
       "type": "file",
       "class": "",
       "res": "Sample.csv",
       "format": "delimited-text",
       "options": {
           "delimiter": "pipe",
           "escape": "default"
       }
   },
   "type": "extractor",
   "status": "active",
   "activatedOn": 1420733036845
}
```

### Normalization Transform

```
{
   "_id": "2a08bfad35f1ffb1b92e10961500485e",
   "_rev": "1-44d950f4819f424bc6f36f641086fb84",
   "name": "My Normalizer",
   "description": "Normalize my field names and output order",
   "style": "extractor-bind",
   "extractor": "9eb3c6eb3047017b64847c534e001a08",
   "transform": {
       "input": [
           "FieldOne",
           "FieldTwo",
           "FieldFour",
           "FieldFive",
           "FieldSix",
           "FieldSeven",
           "FieldEight"
       ],
       "normalize": [
           {
               "in": "FieldOne",
               "out": "UserName"
           },
           {
               "in": "FieldThree",
               "out": "Name"
           },
           {
               "in": "FieldSeven",
               "out": "Email"
           }
       ]
   },
   "status": "active",
   "type": "transformer",
   "activatedOn": 1422277384049
}
```

### MySQL Loader

```
{
   "_id": "2a08bfad35f1ffb1b92e109615010849",
   "_rev": "1-6a50fd35d220ff93ce8b32839f6b7e97",
   "name": "My MySQL Loader",
   "transform": "2a08bfad35f1ffb1b92e1096150117ef",
   "target": {
       "type": "mysql",
       "dsn": "mysql://username:password@hostname/dbname",
       "schema": {
           "name": "mytable",
           "fields": [
               {
                   "key": "UserName",
                   "type": "string"
               },
               {
                   "key": "Name",
                   "type": "string"
               },
               {
                   "key": "Email",
                   "type": "string"
               }
           ]
       }
   },
   "status": "active",
   "type": "loader",
   "activatedOn": 1428985123756
}
```

### FTP Loader

```
{
   "_id": "2a08bfad35f1ffb1b92e109615009f36",
   "_rev": "1-cdd06814f12a0217bbdfcbeb1fdce62e",
   "name": "My FTP Loader",
   "transform": "2a08bfad35f1ffb1b92e109615007ffe",
   "target": {
       "type": "ftp",
       "dsn": "ftp://username:password@host:port",
       "basepath": "/",
       "filename": "output-{Date(today)}.csv"
   },
   "status": "active",
   "type": "loader",
   "activatedOn": 1422458808819
}
```

### Filesystem Loader

```
{
   "_id": "9eb3c6eb3047017b64847c534e003aed",
   "_rev": "1-76badd9367c6906090637d4ea495333c",
   "name": "My Filesystem Loader",
   "transform": "ab9b14c4af6220e3985bfb73ec00a703",
   "target": {
       "type": "file",
       "path": "/tmp/output-{Date(today)}.csv"
   },
   "type": "loader",
   "status": "active",
   "activatedOn": 1420813884784
}
```
