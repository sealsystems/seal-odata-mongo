# @sealsystems/odata-mongo

[![CircleCI](https://circleci.com/gh/sealsystems/node-odata-mongo.svg?style=svg)](https://circleci.com/gh/sealsystems/node-odata-mongo)
[![AppVeyor](https://ci.appveyor.com/api/projects/status/nwcgm2r4t9tcv01m?svg=true)](https://ci.appveyor.com/project/Plossys/node-odata-mongo)

@sealsystems/odata-mongo is a middleware that translates [OData](http://www.odata.org/) to MongoDB queries. [OData Version 2.0](http://www.odata.org/documentation/odata-version-2-0/uri-conventions/) URI conventions are supported.


## Installation

```bash
$ npm install @sealsystems/odata-mongo
```

## Quick start

First you need to add a reference to @sealsystems/odata-mongo within your application.

```javascript
const odataMongo = require('@sealsystems/odata-mongo');
```

Then you can enable Express routes to handle incoming OData queries. For that, add the middleware to the appropriate route. Within the route you then can access the `req.mongo.query` and `req.mongo.queryOptions` objects that contain the query and the query options for MongoDB.

```javascript
app.get('/data', odataMongo(), (req, res) => {
  db.collection('...').find(req.mongo.query, req.mongo.queryOptions).toArray((err, docs) => {
    // ...
  });
});
```

In case the client sends an invalid OData expression, the middleware responds with a `400` status code.

### supported OData keys

* `$filter`
* `$top` - limit the result to N elements
* `$skip` - skip N elements of the query
* `$select` - list of result properties
* `$top` - limit the result list to N
* `$select` - list of result properties
* `$inlinecount` - if missing or set to `none` the response is the result array. If set to `allpages` the response is an object with `results` as the result array and `totalCount` with the total count of entries found for this query
* `$orderby` - sort by a field

## Running the build

To build this module use [roboter](https://www.npmjs.com/package/roboter).

```bash
$ bot
```
