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

    it('Verify processLog with default hostmeta', function(done) {
        var expectedBody = 'eJzj+sPIxVmcX1qUnKqbmSIUzcWekV9cAmKKpMbKFDl5T3HY89FO6uPVwq39lUFqEgxKFlwSXJwgRfEllQWpQtxSnIlVpUWp8WmleVwyXHw5+cmJOfEg+bzE3FQhLimOxIICXRBbykPwqMbraAYgkOUGEkrc+cZmpuWpSRn5+dlGLLnF6YZW/FnF+Xn6YAP1QLJOIo4gtmNySWZZqktmUWpySX5RJWGTjIg0CQAIXFBc';
        
        fakePost = sinon.stub(alcollector.AlServiceC.prototype, 'post').callsFake(
            function fakeFn(path, extraOptions) {
                assert.equal(extraOptions.headers['Content-Type'], 'alertlogic.com/lm3-protobuf');
                assert.equal(path, '/data/logmsgs');
                assert.equal(expectedBody, extraOptions.body.toString('base64'));
                
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
        collector.processLog(['msg1', 'msg2'], formatFun, function(err){
            assert.equal(err, null);
            done();
        });
    });
    
    it('Verify processLog with custom hostmeta', function(done) {
        var expectedBody = 'eJzjusPIxVGcX1qUnOqZImTDxZaRX1wCZIncNfXuXqI/Mzv2hcvLgFqnsAfqleckGJSkuCS4OEFq4ksqC1KFuKU4E6tKi1Lj00rzpDwEj2q8jmYAAlluIKHEnW9sZlqempSRn59txJJbnG5oxZ9VnJ+nD9aiB5J1EnEEsR2TSzLLUl0yi1KTS/KLKgmbZESkSQDXwUbR';
        
        fakePost = sinon.stub(alcollector.AlServiceC.prototype, 'post').callsFake(
            function fakeFn(path, extraOptions) {
                assert.equal(extraOptions.headers['Content-Type'], 'alertlogic.com/lm3-protobuf');
                assert.equal(path, '/data/logmsgs');
                assert.equal(expectedBody, extraOptions.body.toString('base64'));
                
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
            alDataResidency: 'alResidency'
        };
        var collector = new AlAzureCollector(mock.DEFAULT_FUNCTION_CONTEXT, 'ehub', '1.0.0', alOpts);
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
        var hm = [{
                key: 'host_type',
                value: {str: 'azure_fun'}
              }];
        collector.processLog(['msg1', 'msg2'], formatFun, hm, function(err){
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


