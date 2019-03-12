'use strict';

const _ = require('lodash');
const breezeMongo = require('breeze-mongodb');
const cmp = require('comparejs');

const odataMongo = function () {
  return function (req, res, next) {
    let invalidKeys;
    let mongo;

    req.mongo = {
      query: {},
      queryOptions: {}
    };

    if (!req.query || cmp.eq(req.query, {})) {
      return next();
    }

    try {
      invalidKeys = _.difference(Object.keys(req.query), ['$filter', '$top', '$skip', '$select', '$inlinecount', '$orderby']);
      invalidKeys = _.filter(invalidKeys, function (key) {
        return key.startsWith('$');
      })
      if (invalidKeys.length > 0) {
        throw new Error(`Invalid key '${invalidKeys[0]}' provided.`);
      }

      mongo = new breezeMongo.MongoQuery(req.query);
    } catch (e) {
      return res.sendStatus(400);
    }

    req.mongo.query = mongo.filter;
    req.mongo.queryOptions = mongo.options;
    req.mongo.inlineCount = mongo.inlineCount;

    if (!cmp.eq(mongo.select, {})) {
      req.mongo.queryOptions.fields = mongo.select;
    }

    next();
  };
};

module.exports = odataMongo;
