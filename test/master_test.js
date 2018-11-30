/* -----------------------------------------------------------------------------
 * @copyright (C) 2018, Alert Logic, Inc
 * @doc
 *
 * Tests for Master function of a collector.
 *
 * @end
 * -----------------------------------------------------------------------------
 */
const assert = require('assert');
const rewire = require('rewire');
const sinon = require('sinon');
const nock = require('nock');
const fs = require('fs');
const alcollector = require('al-collector-js');

const AlAzureMaster = require('../master').AlAzureMaster;
const mock = require('./mock');

describe('Master tests', function() {
    var fakePost;
    var fakeAuth;
    var clock;
    
    before(function(){
        clock = sinon.useFakeTimers();
    });
    after(function(){
        clock.restore();
    });
    beforeEach(function(){
        if (!nock.isActive()) {
            nock.activate();
        }
        fakeAuth = sinon.stub(alcollector.AimsC.prototype, 'authenticate').callsFake(
            function fakeFn() {
                return new Promise(function(resolve, reject) {
                    resolve(mock.getAuthResp());
                });
        });
    });
    afterEach(function(done) {
        fakePost.restore();
        fakeAuth.restore();
        fs.unlink(mock.AL_TOKEN_CACHE_FILENAME, function(err){
            done();
        });
        nock.cleanAll();
    });

    it('Verify collector register', function(done) {
        // Mock Azure HTTP calls
        var tokenMock = nock('https://login.microsoftonline.com:443', {'encodedQueryParams':true})
        .post(/token$/, /.*/ )
        .query(true)
        .reply(200, mock.AZURE_TOKEN_MOCK);
        
        var syncMock = nock('https://management.azure.com:443', {'encodedQueryParams':true})
        .post(/sync/, /.*/ )
        .query(true)
        .reply(200, '');
        
        // Mock Alert Logic HTTP calls
        fakePost = sinon.stub(alcollector.AlServiceC.prototype, 'post').callsFake(
            function fakeFn(path, extraOptions) {
                //assert.equal(extraOptions.headers['Content-Type'], 'alertlogic.com/pass-through');
                //assert.equal(path, '/');
                //assert.equal(expectedBody, extraOptions.body.toString('base64'));
                
                return new Promise(function(resolve, reject){
                    return resolve('ok');
                });
            });

        // Expected Alert Logic parameters
        process.env.WEBSITE_HOSTNAME = 'app-name';
        process.env.COLLECTOR_HOST_ID = 'host-id';
        process.env.COLLECTOR_SOURCE_ID = 'source-id';
        process.env.CUSTOMCONNSTR_APP_AL_ACCESS_KEY_ID = mock.AL_KEY_ID;
        process.env.CUSTOMCONNSTR_APP_AL_SECRET_KEY = mock.AL_SECRET;
        process.env.CUSTOMCONNSTR_APP_AL_API_ENDPOINT = mock.AL_API_ENDPOINT;
        process.env.CUSTOMCONNSTR_APP_AL_RESIDENCY = 'default';
        process.env.APP_INGEST_ENDPOINT = mock.INGEST_API_ENDPOINT;
        
        // Expected Azure parameters
        process.env.WEBSITE_SITE_NAME = 'kktest11';
        process.env.APP_SUBSCRIPTION_ID = 'subscription-id';
        process.env.APP_RESOURCE_GROUP = 'kktest11';
        process.env.APP_TENANT_ID = 'tenant-id';
        process.env.CUSTOMCONNSTR_APP_CLIENT_ID = 'client-id';
        process.env.CUSTOMCONNSTR_APP_CLIENT_SECRET = 'client-secret';
        
        var master = new AlAzureMaster({}, 'ehub', '1.0.0', [], []);
        
        master.register(function(err){
            console.log(err);
            done();
        });
    });
    
    it('Verify register with custom parameters', function(done) {
        
     // Mock Azure HTTP calls
        var tokenMock = nock('https://login.microsoftonline.com:443', {'encodedQueryParams':true})
        .post(/token$/, /.*/ )
        .query(true)
        .reply(200, mock.AZURE_TOKEN_MOCK);
        
        var syncMock = nock('https://management.azure.com:443', {'encodedQueryParams':true})
        .post(/sync/, /.*/ )
        .query(true)
        .reply(200, '');
        
        // Mock Alert Logic HTTP calls
        fakePost = sinon.stub(alcollector.AlServiceC.prototype, 'post').callsFake(
            function fakeFn(path, extraOptions) {
                //assert.equal(extraOptions.headers['Content-Type'], 'alertlogic.com/pass-through');
                //assert.equal(path, '/');
                //assert.equal(expectedBody, extraOptions.body.toString('base64'));
                
                return new Promise(function(resolve, reject){
                    return resolve('ok');
                });
            });

        var alOpts = {
            hostId: 'hostId',
            sourceId: 'sourceId',
            aimsKeyId: 'aimsKeyId',
            aimsKeySecret: 'aimsKeySecret',
            alApiEndpoint: 'alApiEndpoint',
            alIngestEndpoint: 'alIngestEndpoint',
            alDataResidency: 'alResidency'
        };
        var azureOpts = {
            clientId: 'client-id',
            domain: 'tenant-id', 
            clientSecret: 'client-secret',
            subscriptionId: 'subscription-id',
            resourceGroup: 'rg',
            webAppName: 'app-name'
        };
        var master = new AlAzureMaster({}, 'ehub', '1.0.0', [], [], alOpts, azureOpts);
        
        master.register(function(err){
            console.log(err);
            done();
        });
    });
});


