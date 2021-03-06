'use strict';
const Test = require('tape');
const Express = require('express');
const BodyParser = require('body-parser');
const Swaggerize = require('swaggerize-express');
const Path = require('path');
const Request = require('supertest');
const Mockgen = require('../../data/mockgen.js');
const Parser = require('swagger-parser');
/**
 * Test for /user/login
 */
Test('/user/login', function (t) {
    const apiPath = Path.resolve(__dirname, '../../config/swagger.json');
    let App = Express();
    App.use(BodyParser.json());
    App.use(BodyParser.urlencoded({
        extended: true
    }));
    App.use(Swaggerize({
        api: apiPath,
        handlers: Path.resolve(__dirname, '../../handlers'),
        security: Path.resolve(__dirname, '../../security')
    }));
    Parser.validate(apiPath, function (err, api) {
        t.error(err, 'No parse error');
        t.ok(api, 'Valid swagger api');
        /**
         * summary: Logs user into the system
         * description: 
         * parameters: username, password
         * produces: application/xml, application/json
         * responses: 200, 400
         */
        t.test('test loginUser get operation', function (t) {
            Mockgen().requests({
                path: '/user/login',
                operation: 'get'
            }, function (err, mock) {
                let request;
                t.error(err);
                t.ok(mock);
                t.ok(mock.request);
                //Get the resolved path from mock request
                //Mock request Path templates({}) are resolved using path parameters
                request = Request(App)
                    .get('/v2' + mock.request.path);
                if (mock.request.body) {
                    //Send the request body
                    request = request.send(mock.request.body);
                } else if (mock.request.formData){
                    //Send the request form data
                    request = request.send(mock.request.formData);
                    //Set the Content-Type as application/x-www-form-urlencoded
                    request = request.set('Content-Type', 'application/x-www-form-urlencoded');
                }
                // If headers are present, set the headers.
                if (mock.request.headers && mock.request.headers.length > 0) {
                    Object.keys(mock.request.headers).forEach(function (headerName) {
                        request = request.set(headerName, mock.request.headers[headerName]);
                    });
                }
                request.end(function (err, res) {
                    t.error(err, 'No error');
                    t.ok(res.statusCode === 200, 'Ok response status');
                    let Validator = require('is-my-json-valid');
                    let validate = Validator(api.paths['/user/login']['get']['responses']['200']['schema']);
                    let response = res.body;
                    if (Object.keys(response).length <= 0) {
                        response = res.text;
                    }
                    t.ok(validate(response), 'Valid response');
                    t.error(validate.errors, 'No validation errors');
                    t.end();
                });
            });
        });
    });
});
