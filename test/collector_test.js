/* -----------------------------------------------------------------------------
 * @copyright (C) 2018, Alert Logic, Inc
 * @doc
 *
 * Tests for data collector.
 *
 * @end
 * -----------------------------------------------------------------------------
 */
const assert = require('assert');
const sinon = require('sinon');
const fs = require('fs');
const nock = require('nock');
const alcollector = require('@alertlogic/al-collector-js');

const AlAzureCollector = require('../collector').AlAzureCollector;
const mock = require('./mock');

describe('Collector tests', function() {
    var fakePost;
    var fakeAuth;
    var clock;
    var filteredMsg = { PartitionKey: { '$': 'Edm.String', _: 'I' },
    RowKey: { '$': 'Edm.String', _: '1bcef7c9-e0c3-4728-a704-b2b4c6e0f375' },
    Timestamp: { '$': 'Edm.DateTime', _: '2017-12-22T10:05:30.666Z' },
    ArgumentsJson: { _: '{"req":"Method: POST, Uri: https://test.azurewebsites.net/api/o365/webhook","_log":null,"_binder":null,"_context":"1bcef7c9-e0c3-4728-a704-b2b4c6e0f375","_logger":null,"$return":"response"}' },
    EndTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:47.760Z' },
    FunctionInstanceHeartbeatExpiry: { '$': 'Edm.DateTime', _: '2017-12-22T10:07:45.676Z' },
    FunctionName: { _: 'O365WebHook' },
    Filter: 'test1',
    LogOutput: { _: '' },
    StartTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:47.760Z' },
    TriggerReason: { _: 'This function was programmatically called via the host APIs.' },
    '.metadata': { etag: 'W/"datetime\'2017-12-22T10%3A05%3A30.6667953Z\'"' } };
    
    before(function(){
        clock = sinon.useFakeTimers();
        if (!nock.isActive()) {
            nock.activate();
        }
        process.env.AzureWebJobsStorage = 'DefaultEndpointsProtocol=https;AccountName=testappo365;AccountKey=S0meKey+';
    });
    after(function(){
        clock.restore();
    });
    beforeEach(function(){
        fakeAuth = sinon.stub(alcollector.AimsC.prototype, 'authenticate').callsFake(
            function fakeFn() {
                return new Promise(function(resolve, reject) {
                    resolve(mock.getAuthResp());
                });
        });
        // Collection stats Azure mocks
        nock(/queue.core.windows.net:443/, {'encodedQueryParams':true})
        .head('/alertlogic-stats')
        .query({'comp':'metadata'})
        .reply(200, '', mock.statsQueueMetadataHeaders());
        
        nock(/queue.core.windows.net:443/, {'encodedQueryParams':true})
        .post('/alertlogic-stats/messages' )
        .query(true)
        .times(100)
        .reply(201, '');
        
    });
    afterEach(function(done) {
        fakePost.restore();
        fakeAuth.restore();
        fs.unlink(mock.AL_TOKEN_CACHE_FILENAME, function(err){
            done();
        });
    });

    it('Verify processLog with default hostmeta with filterJson', function(done) {
        let expectedLogMsgsBody = 'eJzjyuDiLM4vLUpO1c1MEYrmYs/ILy4BMUVSY2WKnLynOOz5aCf18Wrh1v7KIDUJBiULLgkuTpCi+JLKglQhbinOxKrSotT4tNI8Lhkuvpz85MSceJB8XmJuqhCXFEdiQYEuiA0ALCMieA==';
        let expectedLMSStatsBody = '[{"inst_type":"collector","appliance_id":"","source_type":"ehub","source_id":"source-id","host_id":"host-id","event_count":0,"byte_count":0,"application_id":"","timestamp":0}]';
        fakePost = sinon.stub(alcollector.AlServiceC.prototype, 'post').callsFake(
            function fakeFn(path, extraOptions) {
                if (path === '/data/lmcstats') {
                    assert.equal(extraOptions.headers['Content-Type'], 'alertlogic.com/json');
                    assert.equal(expectedLMSStatsBody, extraOptions.body.toString('base64'));
                } else {
                    assert.equal(extraOptions.headers['Content-Type'], 'alertlogic.com/lm3-protobuf');
                    assert.equal(path, '/data/logmsgs');
                    assert.equal(expectedLogMsgsBody, extraOptions.body.toString('base64'));
                }

                return new Promise(function(resolve, reject){
                    return resolve('ok');
                });
            });

        process.env.WEBSITE_HOSTNAME = 'app-name';
        process.env.COLLECTOR_HOST_ID = 'host-id';
        process.env.COLLECTOR_SOURCE_ID = 'source-id';
        process.env.CUSTOMCONNSTR_APP_AL_ACCESS_KEY_ID = mock.AL_KEY_ID;
        process.env.CUSTOMCONNSTR_APP_AL_SECRET_KEY = mock.AL_SECRET;
        process.env.CUSTOMCONNSTR_APP_AL_API_ENDPOINT = mock.AL_API_ENDPOINT;
        process.env.CUSTOMCONNSTR_APP_AL_RESIDENCY = 'default';
        process.env.APP_INGEST_ENDPOINT = mock.INGEST_API_ENDPOINT;
        process.env.COLLECTOR_FILTER_JSON = mock.AL_FILTERJSON;
        process.env.COLLECTOR_FILTER_REGEX = mock.AL_FILTERREGEX;
        var collector = new AlAzureCollector(mock.DEFAULT_FUNCTION_CONTEXT, 'ehub', '1.0.0');
        var formatFun = function(msg) {
            sinon.assert.match(msg, filteredMsg);
            return {
                messageTs: 1542138053,
                priority: 11,
                progName: 'o365webhook',
                pid: undefined,
                message: msg,
                messageType: 'json/azure.o365',
                messageTypeId: 'AzureActiveDirectory',
                messageTsUs: undefined
            };
        };
        collector.processLog(mock.COLLECTOR_INVOCATION_FILTERJSON_LOGS, formatFun, function(err){
            assert.equal(err, null);
            done();
        });
    });

    it('Verify processLog with default hostmeta with filterRegex', function(done) {
        let expectedLogMsgsBody = 'eJzjyuDiLM4vLUpO1c1MEYrmYs/ILy4BMUVSY2WKnLynOOz5aCf18Wrh1v7KIDUJBiULLgkuTpCi+JLKglQhbinOxKrSotT4tNI8Lhkuvpz85MSceJB8XmJuqhCXFEdiQYEuiA0ALCMieA==';
        let expectedLMSStatsBody = '[{"inst_type":"collector","appliance_id":"","source_type":"ehub","source_id":"source-id","host_id":"host-id","event_count":0,"byte_count":0,"application_id":"","timestamp":0}]';
        fakePost = sinon.stub(alcollector.AlServiceC.prototype, 'post').callsFake(
            function fakeFn(path, extraOptions) {
                if (path === '/data/lmcstats') {
                    assert.equal(extraOptions.headers['Content-Type'], 'alertlogic.com/json');
                    assert.equal(expectedLMSStatsBody, extraOptions.body.toString('base64'));
                } else {
                    assert.equal(extraOptions.headers['Content-Type'], 'alertlogic.com/lm3-protobuf');
                    assert.equal(path, '/data/logmsgs');
                    assert.equal(expectedLogMsgsBody, extraOptions.body.toString('base64'));
                }
                
                return new Promise(function(resolve, reject){
                    return resolve('ok');
                });
            });

        process.env.WEBSITE_HOSTNAME = 'app-name';
        process.env.COLLECTOR_HOST_ID = 'host-id';
        process.env.COLLECTOR_SOURCE_ID = 'source-id';
        process.env.CUSTOMCONNSTR_APP_AL_ACCESS_KEY_ID = mock.AL_KEY_ID;
        process.env.CUSTOMCONNSTR_APP_AL_SECRET_KEY = mock.AL_SECRET;
        process.env.CUSTOMCONNSTR_APP_AL_API_ENDPOINT = mock.AL_API_ENDPOINT;
        process.env.CUSTOMCONNSTR_APP_AL_RESIDENCY = 'default';
        process.env.APP_INGEST_ENDPOINT = mock.INGEST_API_ENDPOINT;
        process.env.CUSTOMCONNSTR_APP_AL_FILTERREGEX = mock.AL_FILTERREGEX;
        var collector = new AlAzureCollector(mock.DEFAULT_FUNCTION_CONTEXT, 'ehub', '1.0.0');
        var formatFun = function(msg) {
            sinon.assert.match(msg, filteredMsg);
            return {
                messageTs: 1542138053,
                priority: 11,
                progName: 'o365webhook',
                pid: undefined,
                message: msg,
                messageType: 'json/azure.o365',
                messageTypeId: 'AzureActiveDirectory',
                messageTsUs: undefined
            };
        };
        collector.processLog(mock.COLLECTOR_INVOCATION_FILTERJSON_LOGS, formatFun, function(err){
            assert.equal(err, null);
            done();
        });
    });
    
    it('Verify processLog with custom hostmeta with filterJson', function(done) {
        let expectedLogMsgsBody = 'eJzj8uDiKM4vLUpO9UwRsuFiy8gvLgGyRO6aencv0Z+ZHfvC5WVArVPYA/XKcxIMSlJcElycIDXxJZUFqULcUpyJVaVFqfFppXkAkv4Y7Q==';
        let expectedLMSStatsBody = '[{"inst_type":"collector","appliance_id":"","source_type":"ehub","source_id":"sourceId","host_id":"hostId","event_count":0,"byte_count":0,"application_id":"","timestamp":0}]';
        fakePost = sinon.stub(alcollector.AlServiceC.prototype, 'post').callsFake(
            function fakeFn(path, extraOptions) {
                if (path === '/data/lmcstats') {
                    assert.equal(extraOptions.headers['Content-Type'], 'alertlogic.com/json');
                    assert.equal(expectedLMSStatsBody, extraOptions.body);
                } else {
                    assert.equal(extraOptions.headers['Content-Type'], 'alertlogic.com/lm3-protobuf');
                    assert.equal(path, '/data/logmsgs');
                    assert.equal(expectedLogMsgsBody, extraOptions.body.toString('base64'));
                } 
                
                return new Promise(function(resolve, reject){
                    return resolve('ok');
                });
            });

        process.env.WEBSITE_HOSTNAME = 'app-name';
        var alOpts = {
            hostId: 'hostId',
            sourceId: 'sourceId',
            aimsKeyId: 'aimsKeyId',
            aimsKeySecret: 'aimsKeySecret',
            alApiEndpoint: 'alApiEndpoint',
            alIngestEndpoint: 'alIngestEndpoint',
            alDataResidency: 'alResidency',
            filterJSON: mock.AL_FILTERJSON,
            filterREGEX: 'filterRegex'
        };
        var collector = new AlAzureCollector(mock.DEFAULT_FUNCTION_CONTEXT, 'ehub', '1.0.0', alOpts);
        var formatFun = function(msg) {
            sinon.assert.match(msg, filteredMsg);
            return {
                messageTs: 1542138053,
                priority: 11,
                progName: 'o365webhook',
                pid: undefined,
                message: msg,
                messageType: 'json/azure.o365',
                messageTypeId: 'AzureActiveDirectory',
                messageTsUs: undefined
            };
        };
        var hm = [{
                key: 'host_type',
                value: {str: 'azure_fun'}
              }];
        collector.processLog(mock.COLLECTOR_INVOCATION_FILTERJSON_LOGS, formatFun, hm, function(err){
            assert.equal(err, null);
            done();
        });
    });

    it('Verify processLog with custom hostmeta with filterRegex', function(done) {
        let expectedLogMsgsBody = 'eJzj8uDiKM4vLUpO9UwRsuFiy8gvLgGyRO6aencv0Z+ZHfvC5WVArVPYA/XKcxIMSlJcElycIDXxJZUFqULcUpyJVaVFqfFppXkAkv4Y7Q==';
        let expectedLMSStatsBody = '[{"inst_type":"collector","appliance_id":"","source_type":"ehub","source_id":"sourceId","host_id":"hostId","event_count":0,"byte_count":0,"application_id":"","timestamp":0}]';
        fakePost = sinon.stub(alcollector.AlServiceC.prototype, 'post').callsFake(
            function fakeFn(path, extraOptions) {
                if (path === '/data/lmcstats') {
                    assert.equal(extraOptions.headers['Content-Type'], 'alertlogic.com/json');
                    assert.equal(expectedLMSStatsBody, extraOptions.body);
                } else {
                    assert.equal(extraOptions.headers['Content-Type'], 'alertlogic.com/lm3-protobuf');
                    assert.equal(path, '/data/logmsgs');
                    assert.equal(expectedLogMsgsBody, extraOptions.body.toString('base64'));
                }
                
                return new Promise(function(resolve, reject){
                    return resolve('ok');
                });
            });

        process.env.WEBSITE_HOSTNAME = 'app-name';
        var alOpts = {
            hostId: 'hostId',
            sourceId: 'sourceId',
            aimsKeyId: 'aimsKeyId',
            aimsKeySecret: 'aimsKeySecret',
            alApiEndpoint: 'alApiEndpoint',
            alIngestEndpoint: 'alIngestEndpoint',
            alDataResidency: 'alResidency',
            filterREGEX: mock.filterREGEX
        };
        var collector = new AlAzureCollector(mock.DEFAULT_FUNCTION_CONTEXT, 'ehub', '1.0.0', alOpts);
        var formatFun = function(msg) {
            sinon.assert.match(msg, filteredMsg);
            return {
                messageTs: 1542138053,
                priority: 11,
                progName: 'o365webhook',
                pid: undefined,
                message: msg,
                messageType: 'json/azure.o365',
                messageTypeId: 'AzureActiveDirectory',
                messageTsUs: undefined
            };
        };
        var hm = [{
                key: 'host_type',
                value: {str: 'azure_fun'}
              }];
        collector.processLog(mock.COLLECTOR_INVOCATION_FILTERJSON_LOGS, formatFun, hm, function(err){
            assert.equal(err, null);
            done();
        });
    });
    
    it('Verify empty messages input', function(done) {
        
        var noPost = sinon.stub(alcollector.AlServiceC.prototype, 'post').callsFake(
            function fakeFn(path, extraOptions) {
                return new Promise(function(resolve, reject){
                    return resolve('ok');
                });
            });

        process.env.WEBSITE_HOSTNAME = 'app-name';
        process.env.COLLECTOR_HOST_ID = 'host-id';
        process.env.COLLECTOR_SOURCE_ID = 'source-id';
        process.env.CUSTOMCONNSTR_APP_AL_ACCESS_KEY_ID = mock.AL_KEY_ID;
        process.env.CUSTOMCONNSTR_APP_AL_SECRET_KEY = mock.AL_SECRET;
        process.env.CUSTOMCONNSTR_APP_AL_API_ENDPOINT = mock.AL_API_ENDPOINT;
        process.env.CUSTOMCONNSTR_APP_AL_RESIDENCY = 'default';
        process.env.APP_INGEST_ENDPOINT = mock.INGEST_API_ENDPOINT;
        var collector = new AlAzureCollector(mock.DEFAULT_FUNCTION_CONTEXT, 'ehub', '1.0.0');
        var formatFun = function(msg) {
            sinon.assert.match(msg, 'msg');
            return {
                messageTs: 1542138053,
                priority: 11,
                progName: 'o365webhook',
                pid: undefined,
                message: msg,
                messageType: 'json/azure.o365',
                messageTypeId: 'AzureActiveDirectory',
                messageTsUs: undefined
            };
        };
        collector.processLog([], formatFun, function(err, resp){
            noPost.restore();
            assert.equal(err, null);
            assert.deepEqual(resp, {});
            sinon.assert.notCalled(noPost);
            done();
        });
    });
});


