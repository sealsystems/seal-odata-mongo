'use strict';

const assert = require('assertthat');
const express = require('express');
const request = require('supertest');

const odataMongo = require('../lib/odataMongo');

suite('odataMongo', () => {
  test('is a function.', (done) => {
    assert.that(odataMongo).is.ofType('function');
    done();
  });

  test('returns a function.', (done) => {
    assert.that(odataMongo()).is.ofType('function');
    done();
  });

  suite('middleware', () => {
    let app;

    suiteSetup(() => {
      app = express();

      app.get('/foo', odataMongo(), (req, res) => {
        if (req.mongo.query.User instanceof RegExp) {
          req.mongo.query.User = req.mongo.query.User.toString();
        }

        res.send(req.mongo);
      });
    });

    test('provides req.mongo.', (done) => {
      request(app).get('/foo').end((err, res) => {
        assert.that(err).is.null();
        assert.that(res.status).is.equalTo(200);
        assert.that(res.body).is.equalTo({
          query: {},
          queryOptions: {}
        });
        done();
      });
    });

    test('parses $top.', (done) => {
      request(app).get('/foo?$top=5').end((err, res) => {
        assert.that(err).is.null();
        assert.that(res.status).is.equalTo(200);
        assert.that(res.body).is.equalTo({
          query: {},
          queryOptions: {
            limit: 5
          },
          inlineCount: false
        });
        done();
      });
    });

    test('parses $skip.', (done) => {
      request(app).get('/foo?$skip=100').end((err, res) => {
        assert.that(err).is.null();
        assert.that(res.status).is.equalTo(200);
        assert.that(res.body).is.equalTo({
          query: {},
          queryOptions: {
            skip: 100
          },
          inlineCount: false
        });
        done();
      });
    });

    test('parses $orderby.', (done) => {
      request(app).get('/foo?$orderby=bar').end((err, res) => {
        assert.that(err).is.null();
        assert.that(res.status).is.equalTo(200);
        assert.that(res.body).is.equalTo({
          query: {},
          queryOptions: {
            sort: [
              [
                'bar',
                'asc'
              ]
            ]
          },
          inlineCount: false
        });
        done();
      });
    });

    test('parses $inlinecount=none.', (done) => {
      request(app).get('/foo?$inlinecount=none').end((err, res) => {
        assert.that(err).is.null();
        assert.that(res.status).is.equalTo(200);
        assert.that(res.body).is.equalTo({
          query: {},
          queryOptions: {},
          inlineCount: false
        });
        done();
      });
    });

    test('parses $inlinecount=allpages.', (done) => {
      request(app).get('/foo?$inlinecount=allpages').end((err, res) => {
        assert.that(err).is.null();
        assert.that(res.status).is.equalTo(200);
        assert.that(res.body).is.equalTo({
          query: {},
          queryOptions: {},
          inlineCount: true
        });
        done();
      });
    });

    test('returns a 400 on an unknown keyword.', (done) => {
      request(app).get('/foo?$bar=baz').end((err, res) => {
        assert.that(err).is.null();
        assert.that(res.status).is.equalTo(400);
        done();
      });
    });

    test('returns a 400 on an unknown key.', (done) => {
      request(app).get('/foo?bar=baz').end((err, res) => {
        assert.that(err).is.null();
        assert.that(res.status).is.equalTo(400);
        done();
      });
    });

    suite('parses $select', () => {
      test('does not set queryOptions.select if no fields are given.', (done) => {
        request(app).get('/foo').end((err, res) => {
          assert.that(err).is.null();
          assert.that(res.status).is.equalTo(200);
          assert.that(res.body).is.equalTo({
            query: {},
            queryOptions: {}
          });
          done();
        });
      });

      test('sets queryOptions.select with the given fields.', (done) => {
        request(app).get('/foo?$select=firstName, lastName').end((err, res) => {
          assert.that(err).is.null();
          assert.that(res.status).is.equalTo(200);
          assert.that(res.body).is.equalTo({
            query: {},
            queryOptions: {
              fields: {
                firstName: 1,
                lastName: 1
              }
            },
            inlineCount: false
          });
          done();
        });
      });
    });

    suite('parses $filter', () => {
      test('with an equal expression.', (done) => {
        request(app).get('/foo?$filter=User eq \'Jane Doe\'').end((err, res) => {
          assert.that(err).is.null();
          assert.that(res.status).is.equalTo(200);
          assert.that(res.body).is.equalTo({
            query: {
              User: 'Jane Doe'
            },
            queryOptions: {},
            inlineCount: false
          });
          done();
        });
      });

      test('with support for unicode.', (done) => {
        request(app).get(encodeURI('/foo?$filter=User eq \'라인에ᄅ\'')).end((err, res) => {
          assert.that(err).is.null();
          assert.that(res.status).is.equalTo(200);
          assert.that(res.body).is.equalTo({
            query: {

              // Korean for R-a-in-e-r :-)
              User: '라인에ᄅ'
            },
            queryOptions: {},
            inlineCount: false
          });
          done();
        });
      });

      test('with multiple expressions and parentheses.', (done) => {
        request(app).get('/foo?$filter=(User eq \'Jane Doe\' and Id eq 23) or Id gt 42').end((err, res) => {
          assert.that(err).is.null();
          assert.that(res.status).is.equalTo(200);
          assert.that(res.body).is.equalTo({
            query: {
              $or: [
                { $and: [{ User: 'Jane Doe' }, { Id: 23 }] },
                { Id: { $gt: 42 } }
              ]
            },
            queryOptions: {},
            inlineCount: false
          });
          done();
        });
      });

      test('with nested properties.', (done) => {
        request(app).get('/foo?$filter=User/FirstName eq \'Jane\'').end((err, res) => {
          assert.that(err).is.null();
          assert.that(res.status).is.equalTo(200);
          assert.that(res.body).is.equalTo({
            query: {
              'User.FirstName': 'Jane'
            },
            queryOptions: {},
            inlineCount: false
          });
          done();
        });
      });

      test('with multiply nested properties.', (done) => {
        request(app).get('/foo?$filter=User/Name/First eq \'Jane\'').end((err, res) => {
          assert.that(err).is.null();
          assert.that(res.status).is.equalTo(200);
          assert.that(res.body).is.equalTo({
            query: {
              'User.Name.First': 'Jane'
            },
            queryOptions: {},
            inlineCount: false
          });
          done();
        });
      });

      test('with functions.', (done) => {
        request(app).get('/foo?$filter=startswith(User, \'Jane\') eq true').end((err, res) => {
          assert.that(err).is.null();
          assert.that(res.status).is.equalTo(200);
          assert.that(res.body).is.equalTo({
            query: { User: /^Jane/i.toString() },
            queryOptions: {},
            inlineCount: false
          });
          done();
        });
      });

      test('returns a 400 on an invalid filter expression.', (done) => {
        request(app).get('/foo?$filter=User xx').end((err, res) => {
          assert.that(err).is.null();
          assert.that(res.status).is.equalTo(400);
          done();
        });
      });
    });
  });
});
