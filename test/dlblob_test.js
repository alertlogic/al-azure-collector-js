/* -----------------------------------------------------------------------------
 * @copyright (C) 2019, Alert Logic, Inc
 * @doc
 * 
 * Unit tests for DLBlob functions
 * 
 * @end
 * -----------------------------------------------------------------------------
 */
 
const assert = require('assert');
const sinon = require('sinon');
const nock = require('nock');

const mock = require('./mock');
const { fake } = require('sinon');
const AlAzureDlBlob = require('../dlblob').AlAzureDlBlob;

describe('Dead letter blob processing unit tests.', function() {
    
    before(function() {
        if (!nock.isActive()) {
            nock.activate();
        }
        
        // Expected Alert Logic parameters
        process.env.WEBSITE_HOSTNAME = 'app-name';
        process.env.WEBSITE_SITE_NAME = 'test-site';
        process.env.CUSTOMCONNSTR_APP_AL_ACCESS_KEY_ID = mock.AL_KEY_ID;
        process.env.CUSTOMCONNSTR_APP_AL_SECRET_KEY = mock.AL_SECRET;
        process.env.CUSTOMCONNSTR_APP_AL_API_ENDPOINT = mock.AL_API_ENDPOINT;
        process.env.CUSTOMCONNSTR_APP_AL_RESIDENCY = 'default';
        process.env.APP_INGEST_ENDPOINT = 'existing-ingest-endpoint';
        process.env.APP_AZCOLLECT_ENDPOINT = 'existing-azcollect-endpoint';
        process.env.COLLECTOR_HOST_ID = 'existing-host-id';
        process.env.COLLECTOR_SOURCE_ID = 'existing-source-id';
        process.env.APP_DL_CONTAINER_NAME = 'alertlogic-dl';
        process.env.DL_BLOB_PAGE_SIZE = '100';
        
        // Expected Azure parameters
        process.env.APP_SUBSCRIPTION_ID = 'subscription-id';
        process.env.APP_RESOURCE_GROUP = 'kktest11-rg';
        process.env.APP_TENANT_ID = 'tenant-id';
        process.env.CUSTOMCONNSTR_APP_CLIENT_ID = 'client-id';
        process.env.CUSTOMCONNSTR_APP_CLIENT_SECRET = 'client-secret';
        process.env.AzureWebJobsStorage = 'DefaultEndpointsProtocol=https;AccountName=kktestdl;AccountKey=S0meKey+';
    });
    
    after(function() {
        nock.restore();
    });

    beforeEach(function() {
        if (!nock.isActive()) {
            nock.activate();
        }
    });
    
    afterEach(function() {
        nock.cleanAll();
    });
    
    it('Simple OK check', function(done) {
        process.env.DL_BLOB_PAGE_SIZE = '10';
        // Mock Azure HTTP calls
        // List blobs
        nock('https://kktestdl.blob.core.windows.net:443', {'encodedQueryParams':true})
        .get('/alertlogic-dl')
        .query({'restype':'container','comp':'list','maxresults':process.env.DL_BLOB_PAGE_SIZE,'prefix':process.env.WEBSITE_SITE_NAME})
        .times(5)
        .reply(200, mock.LIST_CONTAINER_BLOBS());
        
        // Get blob content
        nock('https://kktestdl.blob.core.windows.net:443', {'encodedQueryParams':true})
        .get(/alertlogic-dl.*/)
        .times(6)
        .reply(200, JSON.stringify(mock.GET_BLOB_CONTENT_TEXT));
        
        // Delete blob
        var deleteBlobStub = sinon.fake();
        nock('https://kktestdl.blob.core.windows.net:443', {'encodedQueryParams':true})
        .delete(/alertlogic-dl.*/)
        .times(6)
        .reply(202, function() {deleteBlobStub();});
        
        var testProcessingStub = sinon.stub().callsFake(
            function(context, dlblob, dlblobPayload, callback) {
                sinon.assert.match(dlblob.name, 'kktestdl/ehubgeneral/2019-01-23T15');
                assert.equal(context.executionContext.invocationId, 'invocation-id');
                return callback(null);
            });
        var dlblob = new AlAzureDlBlob(mock.DEFAULT_FUNCTION_CONTEXT, testProcessingStub);
        dlblob.processDlBlobs({}, function(err) {
            assert.equal(err, null);
            sinon.assert.callCount(deleteBlobStub, 6);
            sinon.assert.callCount(testProcessingStub, 6);
            done();
        });
    });
    
    it('Stats OK', function(done) {
        process.env.DL_BLOB_PAGE_SIZE = '10';
        // Mock Azure HTTP calls
        // List blobs
        nock('https://kktestdl.blob.core.windows.net:443', {'encodedQueryParams':true})
        .get('/alertlogic-dl')
        .query({'restype':'container','comp':'list','prefix':process.env.WEBSITE_SITE_NAME})
        .times(5)
        .reply(200, (uri) => {
            return mock.LIST_CONTAINER_BLOBS()
        });
        
        // Get blob content
        var getBlobTextStub = sinon.fake();
        nock('https://kktestdl.blob.core.windows.net:443', {'encodedQueryParams':true})
        .get(/alertlogic-dl.*/)
        .times(6)
        .reply(200, () => {
            getBlobTextStub();
            return JSON.stringify(mock.GET_BLOB_CONTENT_TEXT)
        });
        
        // Delete blob
        var deleteBlobStub = sinon.fake();
        nock('https://kktestdl.blob.core.windows.net:443', {'encodedQueryParams':true})
        .delete(/alertlogic-dl.*/)
        .times(6)
        .reply(202, function() {deleteBlobStub();});
        
        var testProcessingStub = sinon.fake();
        var dlblob = new AlAzureDlBlob(mock.DEFAULT_FUNCTION_CONTEXT, testProcessingStub);
        dlblob.getDlBlobStats(function(err, {dl_stats: {dl_count, max_dl_size, dl_sample}}) {
            assert.equal(err, null);
            assert.equal(dl_count, 6);
            assert.equal(max_dl_size, 4257);
            assert.equal(JSON.parse(dl_sample).length, 2);
            sinon.assert.callCount(getBlobTextStub, 2);
            done();
        });
    });
    
    it('Stats Empty Array', function(done) {
        process.env.DL_BLOB_PAGE_SIZE = '10';
        // Mock Azure HTTP calls
        // List blobs
        nock('https://kktestdl.blob.core.windows.net:443', {'encodedQueryParams':true})
        .get('/alertlogic-dl')
        .query({'restype':'container','comp':'list','prefix':process.env.WEBSITE_SITE_NAME})
        .times(5)
        .reply(200, (uri) => {
            return mock.LIST_CONTAINER_BLOBS_EMPTY()
        });
        
        var testProcessingStub = sinon.fake();
        var dlblob = new AlAzureDlBlob(mock.DEFAULT_FUNCTION_CONTEXT, testProcessingStub);
        dlblob.getDlBlobStats(function(err, {dl_stats: {dl_count, max_dl_size, dl_sample}}) {
            assert.equal(err, null);
            assert.equal(dl_count, 0);
            assert.equal(max_dl_size, 0);
            assert.equal(JSON.parse(dl_sample).length, 0);
            done();
        });
    });
    
    it('Stats error', function(done) {
        process.env.DL_BLOB_PAGE_SIZE = '10';
        // Mock Azure HTTP calls
        // List blobs
        nock('https://kktestdl.blob.core.windows.net:443', {'encodedQueryParams':true})
        .get('/alertlogic-dl')
        .query({'restype':'container','comp':'list','prefix':process.env.WEBSITE_SITE_NAME})
        .times(5)
        .reply(200, (uri) => {
            return mock.LIST_CONTAINER_BLOBS()
        });
        
        // Get blob content
        var getBlobTextStub = sinon.fake();
        nock('https://kktestdl.blob.core.windows.net:443', {'encodedQueryParams':true})
        .get(/alertlogic-dl.*/)
        .times(2)
        .reply(200, () => {
            getBlobTextStub();
            return JSON.stringify(mock.GET_BLOB_CONTENT_TEXT)
        });
        
        let errorCallback = () => {
            getBlobTextStub();
            return {
                message: 'something is broke',
                code: 400
            };
        }

        // error
        nock('https://kktestdl.blob.core.windows.net:443', {'encodedQueryParams':true})
        .get(/alertlogic-dl.*/)
        .times(3)
        .reply(400, errorCallback);
        
        // Delete blob
        var deleteBlobStub = sinon.fake();
        nock('https://kktestdl.blob.core.windows.net:443', {'encodedQueryParams':true})
        .delete(/alertlogic-dl.*/)
        .times(6)
        .reply(202, function() {deleteBlobStub();});
        
        var testProcessingStub = sinon.fake();
        var dlblob = new AlAzureDlBlob(mock.DEFAULT_FUNCTION_CONTEXT, testProcessingStub);
        dlblob.getDlBlobStats(function(err, {dl_stats: {dl_count, max_dl_size, dl_sample}}) {
            assert.equal(err, null);
            assert.equal(dl_count, 6);
            assert.equal(max_dl_size, 4257);
            assert.equal(JSON.parse(dl_sample).length, 2);
            sinon.assert.callCount(getBlobTextStub, 2);
            done();
        });
    });
    
    it('Blob list error', function(done) {
        // Mock Azure HTTP calls
        // List blobs
        nock('https://kktestdl.blob.core.windows.net:443', {'encodedQueryParams':true})
        .get('/alertlogic-dl')
        .query({'restype':'container','comp':'list','maxresults':process.env.DL_BLOB_PAGE_SIZE,'prefix':process.env.WEBSITE_SITE_NAME})
        .reply(404, mock.CONTAINER_NOT_FOUND);
        
        var testProcessingStub = sinon.stub().callsFake(
                function(context, dlblob, dlblobPayload, callback) {
                    return callback(null);
                });
        var dlblob = new AlAzureDlBlob(mock.DEFAULT_FUNCTION_CONTEXT, testProcessingStub);
        dlblob.processDlBlobs({}, function(err) {
            assert.equal(err.code, 'ContainerNotFound');
            assert.equal(err.statusCode, 404);
            sinon.assert.callCount(testProcessingStub, 0);
            done();
        });
    });
    
    it('Get blob content error', function(done) {
        // Mock Azure HTTP calls
        // List blobs
        nock('https://kktestdl.blob.core.windows.net:443', {'encodedQueryParams':true})
        .get('/alertlogic-dl')
        .query({'restype':'container','comp':'list','maxresults':process.env.DL_BLOB_PAGE_SIZE,'prefix':process.env.WEBSITE_SITE_NAME})
        .reply(200, mock.LIST_CONTAINER_BLOBS());
        
        // Get blob content 2019-01-23T15-53-06Z
        nock('https://kktestdl.blob.core.windows.net:443', {'encodedQueryParams':true})
        .get(/alertlogic-dl\/kktestdl\/ehubgeneral\/2019-01-23T15-53-06Z/)
        .times(1)
        .reply(200, mock.GET_BLOB_CONTENT_TEXT);
        
        nock('https://kktestdl.blob.core.windows.net:443', {'encodedQueryParams':true})
        .get(/alertlogic-dl\/kktestdl\/ehubgeneral.*/)
        .times(5)
        .reply(404, mock.CONTAINER_NOT_FOUND);
        
        // Delete blob
        nock('https://kktestdl.blob.core.windows.net:443', {'encodedQueryParams':true})
        .delete(/alertlogic-dl.*/)
        .times(1)
        .reply(202);
        
        var testProcessingStub = sinon.stub().callsFake(
                function(context, dlblob, dlblobPayload, callback) {
                    return callback(null);
                });
        var dlblob = new AlAzureDlBlob(mock.DEFAULT_FUNCTION_CONTEXT, testProcessingStub);
        dlblob.processDlBlobs({}, function(err, result) {
            assert.equal(err, null);
            assert.equal(result[0].value.isSuccessful, true);
            var errors = result.slice(1);
            errors.every(function(res) {
                assert.equal(res.error.code, 'ContainerNotFound');
                assert.equal(res.error.statusCode, 404);
            });
            sinon.assert.callCount(testProcessingStub, 1);
            done();
        });
    });
    
    it('Delete blob error', function(done) {
        // Mock Azure HTTP calls
        // List blobs
        nock('https://kktestdl.blob.core.windows.net:443', {'encodedQueryParams':true})
        .get('/alertlogic-dl')
        .query({'restype':'container','comp':'list','maxresults':process.env.DL_BLOB_PAGE_SIZE,'prefix':process.env.WEBSITE_SITE_NAME})
        .reply(200, mock.LIST_CONTAINER_BLOBS());
        
        // Get blob content
        nock('https://kktestdl.blob.core.windows.net:443', {'encodedQueryParams':true})
        .get(/alertlogic-dl.*/)
        .times(6)
        .reply(200, mock.GET_BLOB_CONTENT_TEXT);
        
        // Delete blob
        nock('https://kktestdl.blob.core.windows.net:443', {'encodedQueryParams':true})
        .delete(/alertlogic-dl\/kktestdl\/ehubgeneral.*/)
        .times(6)
        .reply(404, mock.CONTAINER_NOT_FOUND);
        
        var testProcessingStub = sinon.stub().callsFake(
                function(context, dlblob, dlblobPayload, callback) {
                    return callback(null);
                });
        var dlblob = new AlAzureDlBlob(mock.DEFAULT_FUNCTION_CONTEXT, testProcessingStub);
        dlblob.processDlBlobs({}, function(err, result) {
            assert.equal(err, null);
            result.every(function(res) {
                assert.equal(res.error.code, 'ContainerNotFound');
                assert.equal(res.error.statusCode, 404);
            });
            sinon.assert.callCount(testProcessingStub, 6);
            done();
        });
    });
});

