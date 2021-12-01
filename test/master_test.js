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
const sinon = require('sinon');
const nock = require('nock');
const fs = require('fs');
const alcollector = require('@alertlogic/al-collector-js');

const AlAzureMaster = require('../master').AlAzureMaster;
const AzureWebAppStats = require('../appstats').AzureWebAppStats;
const CollectionStatRecord = require('../appstats').CollectionStatRecord;
const mock = require('./mock');

describe('Master tests', function() {
    var fakePost;
    var fakeGet;
    var fakeAuth;
    var clock;
    
    before(function(){
        clock = sinon.useFakeTimers();
        if (!nock.isActive()) {
            nock.activate();
        }
        // Useful for capturing HTTP calls for new tests.
        //nock.recorder.rec();
    });
    after(function(){
        clock.restore();
        nock.restore();
    });
    beforeEach(function(){
        nock('http://127.0.0.1:41963', {'encodedQueryParams':true})
        .get(/MSI/, /.*/ )
        .query(true)
        .times(5)
        .reply(200, mock.AZURE_TOKEN_MOCK);

        fakeAuth = sinon.stub(alcollector.AimsC.prototype, 'authenticate').callsFake(
            function fakeFn() {
                return new Promise(function(resolve, reject) {
                    resolve(mock.getAuthResp());
                });
        });
    });
    afterEach(function(done) {
        fakePost.restore();
        fakeGet.restore();
        fakeAuth.restore();
        fs.unlink(mock.AL_TOKEN_CACHE_FILENAME, function(err){
            done();
        });
        nock.cleanAll();
    });
    
    describe('Register tests', function() {
        it('Verify collector register with endpoints update', function(done) {
            // Mock Azure HTTP calls
            nock('https://login.microsoftonline.com:443', {'encodedQueryParams':true})
            .post(/token$/, /.*/)
            .query(true)
            .times(10)
            .reply(200, mock.AZURE_TOKEN_MOCK);
            
            nock('https://management.azure.com:443', {'encodedQueryParams':true})
            .post(/appsettings/, /.*/ )
            .query(true)
            .times(2)
            .reply(200, {});

            nock('https://management.azure.com:443', {'encodedQueryParams':true})
            .get(/appsettings/, /.*/ )
            .query(true)
            .times(2)
            .reply(200, {});

            nock('https://management.azure.com:443', {'encodedQueryParams':true})
            .put(/appsettings/, /.*/ )
            .query(true)
            .times(2)
            .reply(200, {});

            // Mock Alert Logic HTTP calls
            fakePost = sinon.stub(alcollector.AlServiceC.prototype, 'post');
            fakePost.withArgs('/azure/ehub/subscription-id/kktest11-rg/kktest11-name')
                .resolves({
                    source: {
                        host: {
                            id: 'new-host-id'
                        },
                        id: 'new-source-id'
                    }
            });
            
            fakeGet = sinon.stub(alcollector.AlServiceC.prototype, 'get');
            fakeGet.withArgs('/residency/default/services/azcollect/endpoint')
                .resolves({
                    azcollect : 'new-azcollect-endpoint'
            });
            fakeGet.withArgs('/residency/default/services/ingest/endpoint')
                .resolves({
                    ingest : 'new-ingest-endpoint'
            });
    
            // Expected Alert Logic parameters
            process.env.WEBSITE_HOSTNAME = 'app-name';
            process.env.CUSTOMCONNSTR_APP_AL_ACCESS_KEY_ID = mock.AL_KEY_ID;
            process.env.CUSTOMCONNSTR_APP_AL_SECRET_KEY = mock.AL_SECRET;
            process.env.CUSTOMCONNSTR_APP_AL_API_ENDPOINT = mock.AL_API_ENDPOINT;
            process.env.CUSTOMCONNSTR_APP_AL_RESIDENCY = 'default';
            delete process.env.APP_INGEST_ENDPOINT;
            delete process.env.COLLECTOR_HOST_ID;
            delete process.env.COLLECTOR_SOURCE_ID;
            
            // Expected Azure parameters
            process.env.WEBSITE_SITE_NAME = 'kktest11-name';
            process.env.APP_SUBSCRIPTION_ID = 'subscription-id';
            process.env.APP_RESOURCE_GROUP = 'kktest11-rg';
            process.env.APP_TENANT_ID = 'tenant-id';
            process.env.CUSTOMCONNSTR_APP_CLIENT_ID = 'client-id';
            process.env.CUSTOMCONNSTR_APP_CLIENT_SECRET = 'client-secret';
            process.env.AzureWebJobsStorage = 'DefaultEndpointsProtocol=https;AccountName=testappo365;AccountKey=S0meKey+';
            
            var master = new AlAzureMaster(mock.DEFAULT_FUNCTION_CONTEXT, 'ehub', '1.0.0');
            master.register({}, function(err, collectorHostId, collectorSourceId){
                if (err) console.log(err);
                assert.equal(process.env.APP_INGEST_ENDPOINT, 'new-ingest-endpoint');
                assert.equal(process.env.APP_AZCOLLECT_ENDPOINT, 'new-azcollect-endpoint');
                assert.equal(collectorHostId, 'new-host-id');
                assert.equal(collectorSourceId, 'new-source-id');
                const expectedRegisterBody = {
                    body: {
                        app_filter_json: "",
                        app_filter_regex: "",
                        app_tenant_id: "tenant-id",
                        client_id: "client-id",
                        client_secret: "client-secret",
                        version: "1.0.0"
                    }
                };
                sinon.assert.calledWith(fakePost, '/azure/ehub/subscription-id/kktest11-rg/kktest11-name', expectedRegisterBody);
                done();
            });
        });
        
        it('Verify register with custom parameters, no endpoints updates', function(done) {
            // Mock Azure HTTP calls
            nock('https://login.microsoftonline.com:443', {'encodedQueryParams':true})
            .post(/token/, /.*/ )
            .query(true)
            .times(5)
            .reply(200, mock.AZURE_TOKEN_MOCK);
            
            nock('https://management.azure.com:443', {'encodedQueryParams':true})
            .put(/appsettings/, /.*/ )
            .query(true)
            .times(2)
            .reply(200, {});
            
            nock('https://management.azure.com:443', {'encodedQueryParams':true})
            .post(/appsettings/, /.*/ )
            .query(true)
            .times(2)
            .reply(200, {});
            
            // Mock Alert Logic HTTP calls
            fakePost = sinon.stub(alcollector.AlServiceC.prototype, 'post');
            fakePost.withArgs('/azure/ehub/subscription-id/rg/app-name')
                .resolves({
                    source: {
                        host: {
                            id: 'new-host-id1'
                        },
                        id: 'new-source-id1'
                    }
            });
            
            var alOpts = {
                aimsKeyId: 'aimsKeyId',
                aimsKeySecret: 'aimsKeySecret',
                alApiEndpoint: 'alApiEndpoint',
                alAzcollectEndpoint: 'alAzcollectEndpoint',
                alDataResidency: 'default'
            };
            var azureOpts = {
                clientId: 'client-id',
                domain: 'tenant-id', 
                clientSecret: 'client-secret',
                subscriptionId: 'subscription-id',
                resourceGroup: 'rg',
                webAppName: 'app-name'
            };
            delete process.env.COLLECTOR_HOST_ID;
            delete process.env.COLLECTOR_SOURCE_ID;
            
            var master = new AlAzureMaster(mock.DEFAULT_FUNCTION_CONTEXT, 'ehub', '1.0.0', [], [], alOpts, azureOpts);
            
            master.register({}, function(err, collectorHostId, collectorSourceId){
                if (err) console.log(err);
                assert.equal(process.env.APP_INGEST_ENDPOINT, 'new-ingest-endpoint');
                assert.equal(process.env.APP_AZCOLLECT_ENDPOINT, 'new-azcollect-endpoint');
                assert.equal(collectorHostId, 'new-host-id1');
                assert.equal(collectorSourceId, 'new-source-id1');
                done();
            });
        });

        it('Verify register with MSI', function(done) {
            // Mock Azure HTTP calls
            nock('https://management.azure.com:443', {'encodedQueryParams':true})
            .put(/appsettings/, /.*/ )
            .query(true)
            .times(4)
            .reply(200, {});
            
            nock('https://management.azure.com:443', {'encodedQueryParams':true})
            .post(/appsettings/, /.*/ )
            .query(true)
            .times(4)
            .reply(200, {});
            
            // Mock Alert Logic HTTP calls
            fakePost = sinon.stub(alcollector.AlServiceC.prototype, 'post');
            fakePost.withArgs('/azure/ehub/subscription-id/rg/app-name')
                .resolves({
                    source: {
                        host: {
                            id: 'new-host-id1'
                        },
                        id: 'new-source-id1'
                    }
            });
            
            var alOpts = {
                aimsKeyId: 'aimsKeyId',
                aimsKeySecret: 'aimsKeySecret',
                alApiEndpoint: 'alApiEndpoint',
                alDataResidency: 'default'
            };
            
            delete process.env.COLLECTOR_HOST_ID;
            delete process.env.COLLECTOR_SOURCE_ID;
            process.env.WEBSITE_SITE_NAME = 'app-name';
            process.env.APP_SUBSCRIPTION_ID = 'subscription-id';
            process.env.APP_RESOURCE_GROUP = 'rg';
            process.env.MSI_SECRET = 'MSI secret';
            process.env.MSI_ENDPOINT = 'http://127.0.0.1:41963/MSI/token/';
            process.env.APP_PRINCIPAL_ID = 'msi-principal-id';
            
            var master = new AlAzureMaster(mock.DEFAULT_FUNCTION_CONTEXT, 'ehub', '1.0.0', [], [], alOpts);
            
            master.register({}, function(err, collectorHostId, collectorSourceId){
                if (err) console.log(err);
                assert.equal(collectorHostId, 'new-host-id1');
                assert.equal(collectorSourceId, 'new-source-id1');
                const expectedBody = {
                    body: {
                        app_filter_json: '',
                        app_filter_regex: '',
                        app_tenant_id: 'tenant-id',
                        client_id: process.env.APP_PRINCIPAL_ID,
                        client_secret: 'Managed Service Identity',
                        version: '1.0.0'
                   }
                };
                sinon.assert.calledWith(fakePost, '/azure/ehub/subscription-id/rg/app-name', expectedBody);
                delete process.env.MSI_SECRET;
                delete process.env.MSI_ENDPOINT;
                delete process.env.APP_PRINCIPAL_ID;
                done();
            });
        });

        it('Verify register reuse endpoints and collector ids from env', function(done) {
            // Expected Alert Logic parameters
            process.env.WEBSITE_HOSTNAME = 'app-name';
            process.env.CUSTOMCONNSTR_APP_AL_ACCESS_KEY_ID = mock.AL_KEY_ID;
            process.env.CUSTOMCONNSTR_APP_AL_SECRET_KEY = mock.AL_SECRET;
            process.env.CUSTOMCONNSTR_APP_AL_API_ENDPOINT = mock.AL_API_ENDPOINT;
            process.env.CUSTOMCONNSTR_APP_AL_RESIDENCY = 'default';
            process.env.APP_INGEST_ENDPOINT = 'existing-ingest-endpoint';
            process.env.APP_AZCOLLECT_ENDPOINT = 'existing-azcollect-endpoint';
            process.env.COLLECTOR_HOST_ID = 'existing-host-id';
            process.env.COLLECTOR_SOURCE_ID = 'existing-source-id';
            
            // Expected Azure parameters
            process.env.WEBSITE_SITE_NAME = 'kktest11-name';
            process.env.APP_SUBSCRIPTION_ID = 'subscription-id';
            process.env.APP_RESOURCE_GROUP = 'kktest11-rg';
            process.env.APP_TENANT_ID = 'tenant-id';
            process.env.CUSTOMCONNSTR_APP_CLIENT_ID = 'client-id';
            process.env.CUSTOMCONNSTR_APP_CLIENT_SECRET = 'client-secret';
            process.env.AzureWebJobsStorage = 'DefaultEndpointsProtocol=https;AccountName=testappo365;AccountKey=S0meKey+';
            
            var master = new AlAzureMaster(mock.DEFAULT_FUNCTION_CONTEXT, 'ehub', '1.0.0');
            
            master.register({}, function(err, collectorHostId, collectorSourceId){
                if (err) console.log(err);
                assert.equal(process.env.APP_INGEST_ENDPOINT, 'existing-ingest-endpoint');
                assert.equal(process.env.APP_AZCOLLECT_ENDPOINT, 'existing-azcollect-endpoint');
                assert.equal(collectorHostId, 'existing-host-id');
                assert.equal(collectorSourceId, 'existing-source-id');
                done();
            });
        });
        
        it('Verify collector deregister', function(done) {
            // Mock Alert Logic HTTP calls
               var fakeDelete = sinon.stub(alcollector.AlServiceC.prototype, 'deleteRequest');
               fakeDelete.withArgs('/azure/ehub/subscription-id/kktest11-rg/kktest11-name')
                   .resolves('ok');
               // Expected Alert Logic parameters
               process.env.WEBSITE_HOSTNAME = 'app-name';
               process.env.CUSTOMCONNSTR_APP_AL_ACCESS_KEY_ID = mock.AL_KEY_ID;
               process.env.CUSTOMCONNSTR_APP_AL_SECRET_KEY = mock.AL_SECRET;
               process.env.CUSTOMCONNSTR_APP_AL_API_ENDPOINT = mock.AL_API_ENDPOINT;
               process.env.CUSTOMCONNSTR_APP_AL_RESIDENCY = 'default';
               process.env.APP_INGEST_ENDPOINT = 'existing-ingest-endpoint';
               process.env.APP_AZCOLLECT_ENDPOINT = 'existing-azcollect-endpoint';
               process.env.COLLECTOR_HOST_ID = 'existing-host-id';
               process.env.COLLECTOR_SOURCE_ID = 'existing-source-id';
               
               // Expected Azure parameters
               process.env.WEBSITE_SITE_NAME = 'kktest11-name';
               process.env.APP_SUBSCRIPTION_ID = 'subscription-id';
               process.env.APP_RESOURCE_GROUP = 'kktest11-rg';
               process.env.APP_TENANT_ID = 'tenant-id';
               process.env.CUSTOMCONNSTR_APP_CLIENT_ID = 'client-id';
               process.env.CUSTOMCONNSTR_APP_CLIENT_SECRET = 'client-secret';
               process.env.AzureWebJobsStorage = 'DefaultEndpointsProtocol=https;AccountName=testappo365;AccountKey=S0meKey+';
               
               var master = new AlAzureMaster(mock.DEFAULT_FUNCTION_CONTEXT, 'ehub', '1.0.0');
               
               master.deregister({}, function(err){
                   if (err) console.log(err);
                   fakeDelete.restore();
                   const expectedUrl = '/azure/ehub/subscription-id/kktest11-rg/kktest11-name';
                   assert.equal(null, err);
                   sinon.assert.calledWith(fakeDelete, expectedUrl);
                   done();
               });
           });
    });
    
    describe('Checkin tests', function() {
        var fakeStats;
        
        beforeEach(function() {
            // Mock Azure HTTP calls
            nock('https://login.microsoftonline.com:443', {'encodedQueryParams':true})
            .post(/token/, /.*/ )
            .query(true)
            .times(100)
            .reply(200, mock.AZURE_TOKEN_MOCK);
            
            nock('https://management.azure.com:443', {'encodedQueryParams':true})
            .get(/kktest11-name$/, /.*/ )
            .query(true)
            .times(100)
            .reply(200, mock.getAzureWebApp());
            
            // Collection stats Azure mocks
            nock('https://testappo365.queue.core.windows.net:443', {'encodedQueryParams':true})
            .get('/alertlogic-stats')
            .query({'comp':'metadata'})
            .reply(200, '', mock.statsQueueMetadataHeaders());

            nock('https://testappo365.queue.core.windows.net:443', {'encodedQueryParams':true})
            .post('/alertlogic-stats/messages' )
            .query(true)
            .times(100)
            .reply(201, '');
            
            nock('https://testappo365.queue.core.windows.net:443', {"encodedQueryParams":true})
            .get('/alertlogic-stats/messages')
            .query(true)
            .times(100)
            .reply(200, mock.statsMessage);
            
            nock('https://testappo365.queue.core.windows.net:443', {"encodedQueryParams":true})
            .delete(/alertlogic-stats\/messages.*/)
            .query(true)
            .times(100)
            .reply(204,'');
            
            // List blobs
            nock('https://testappo365.blob.core.windows.net:443', {'encodedQueryParams':true})
            .get('/alertlogic-dl')
            .query(true)
            .times(5)
            .reply(200, mock.LIST_CONTAINER_BLOBS());
            
            // Mock Alert Logic HTTP calls
            fakePost = sinon.stub(alcollector.AlServiceC.prototype, 'post').callsFake(
                function fakeFn(path, extraOptions) {
                    return new Promise(function(resolve, reject){
                        return resolve(mock.CHECKIN_RESPONSE_OK);
                    });
                });
            fakeStats = sinon.stub(AzureWebAppStats.prototype, 'getAppStats').callsFake(
                function fakeFn(path, callback) {
                    return callback(null, mock.INVOCATION_STATS);
            });
            
            // Expected Alert Logic parameters
            process.env.WEBSITE_HOSTNAME = 'app-name';
            process.env.CUSTOMCONNSTR_APP_AL_ACCESS_KEY_ID = mock.AL_KEY_ID;
            process.env.CUSTOMCONNSTR_APP_AL_SECRET_KEY = mock.AL_SECRET;
            process.env.CUSTOMCONNSTR_APP_AL_API_ENDPOINT = mock.AL_API_ENDPOINT;
            process.env.CUSTOMCONNSTR_APP_AL_RESIDENCY = 'default';
            process.env.APP_INGEST_ENDPOINT = 'existing-ingest-endpoint';
            process.env.APP_AZCOLLECT_ENDPOINT = 'existing-azcollect-endpoint';
            process.env.COLLECTOR_HOST_ID = 'existing-host-id';
            process.env.COLLECTOR_SOURCE_ID = 'existing-source-id';
            process.env.APP_DL_CONTAINER_NAME = 'alertlogic-dl';
            
            // Expected Azure parameters
            process.env.WEBSITE_SITE_NAME = 'kktest11-name';
            process.env.APP_SUBSCRIPTION_ID = 'subscription-id';
            process.env.APP_RESOURCE_GROUP = 'kktest11-rg';
            process.env.APP_TENANT_ID = 'tenant-id';
            process.env.CUSTOMCONNSTR_APP_CLIENT_ID = 'client-id';
            process.env.CUSTOMCONNSTR_APP_CLIENT_SECRET = 'client-secret';
            process.env.AzureWebJobsStorage = 'DefaultEndpointsProtocol=https;AccountName=testappo365;AccountKey=S0meKey+';
            
        });
        
        afterEach(function(done) {
            fakeStats.restore();
            fakePost.resetHistory();
            fs.unlink(mock.AL_TOKEN_CACHE_FILENAME, function(err){
                done();
            });
        });
        
        it('Verify checkin ok', function(done) {
            var master = new AlAzureMaster(mock.DEFAULT_FUNCTION_CONTEXT, 'ehub', '1.0.0');
            master.checkin('2017-12-22T14:31:39', function(err, resp){
                if (err) console.log(err);
                const expectedCheckin = { 
                    body: {
                        version: '1.0.0',
                        app_tenant_id: 'tenant-id',
                        collection_stats: { 'log': { 'bytes': 10, 'events': 15 } },
                        host_id: 'existing-host-id',
                        source_id: 'existing-source-id',
                        statistics: [{ 'Master': { 'errors': 0, 'invocations': 2 } }, { 'Collector': { 'errors': 1, 'invocations': 10 } }, { 'Updater': { 'errors': 0, 'invocations': 0 } }],
                        dl_stats: { dl_count: 6, max_dl_size: 4257 },
                        status: 'ok',
                        details: []
                    }
                };
                const expectedUrl = '/azure/ehub/checkin/subscription-id/kktest11-rg/kktest11-name';
                fakeStats.restore();
                sinon.assert.calledWithMatch(fakePost, expectedUrl, expectedCheckin);
                assert.equal(resp, mock.CHECKIN_RESPONSE_OK);
                done();
            });
        });
        
        it('Verify checkin ok with force update', function(done) {
            var syncMock = nock('https://management.azure.com:443', {'encodedQueryParams':true})
            .post(/sync/, /.*/ )
            .query(true)
            .reply(200, '');
            const forceUpdateRes = {force_update: true};
            fakePost.restore();
            fakePost = sinon.stub(alcollector.AlServiceC.prototype, 'post').callsFake(
                function fakeFn(path, extraOptions) {
                    return new Promise(function(resolve, reject){
                        return resolve(forceUpdateRes);
                    });
                });
            var master = new AlAzureMaster(mock.DEFAULT_FUNCTION_CONTEXT, 'ehub', '1.0.0');
            master.checkin('2017-12-22T14:31:39', function(err, resp){
                if (err) console.log(err);
                const expectedCheckin = {
                    body: {
                        version: '1.0.0',
                        app_tenant_id: 'tenant-id',
                        collection_stats: { 'log': { 'bytes': 10, 'events': 15 } },
                        host_id: 'existing-host-id',
                        source_id: 'existing-source-id',
                        statistics: [{ 'Master': { 'errors': 0, 'invocations': 2 } }, { 'Collector': { 'errors': 1, 'invocations': 10 } }, { 'Updater': { 'errors': 0, 'invocations': 0 } }],
                        dl_stats: { dl_count: 6, max_dl_size: 4257 },
                        status: 'ok',
                        details: []
                    }
                };
                const expectedUrl = '/azure/ehub/checkin/subscription-id/kktest11-rg/kktest11-name';
                sinon.assert.calledWithMatch(fakePost, expectedUrl, expectedCheckin);
                assert.equal(resp, forceUpdateRes);
                assert.ok(syncMock);
                done();
            });
        });

        it('Verify checkin ok, no DL stats', function(done) {
            const storedDlName = process.env.APP_DL_CONTAINER_NAME;
            delete process.env.APP_DL_CONTAINER_NAME;
            
            // This should not be called
            nock('https://testappo365.blob.core.windows.net:443', {'encodedQueryParams':true})
            .get('/alertlogic-dl')
            .query(true)
            .times(5)
            .reply(404, mock.CONTAINER_NOT_FOUND);
            
            process.env.APP_FILTER_JSON = mock.AL_FILTERJSON;
            process.env.APP_FILTER_REGEX = mock.AL_FILTERREGEX;
            
            var master = new AlAzureMaster(mock.DEFAULT_FUNCTION_CONTEXT, 'ehub', '1.0.0');
            master.checkin('2017-12-22T14:31:39', function(err, resp){
                if (err) console.log(err);
                
                process.env.APP_DL_CONTAINER_NAME = storedDlName;
                let cs = new CollectionStatRecord();
                cs.log.bytes = 10;
                cs.log.events = 15;
                const expectedCheckin = { 
                    body: {
                        version: '1.0.0',
                        app_filter_json: '{\"Filter\": \"test1\"}',
                        app_filter_regex: '{\"Filter\": \"test1\"}',
                        app_tenant_id: 'tenant-id',
                        collection_stats: cs,
                        host_id: 'existing-host-id',
                        source_id: 'existing-source-id',
                        statistics: [{ 'Master': { 'errors': 0, 'invocations': 2 } }, { 'Collector': { 'errors': 1, 'invocations': 10 } }, { 'Updater': { 'errors': 0, 'invocations': 0 } }],
                        // No DL stats
                        //dl_stats: { dl_count: 6, max_dl_size: 4257 },
                        status: 'ok',
                        details: []
                    }
                };
                const expectedUrl = '/azure/ehub/checkin/subscription-id/kktest11-rg/kktest11-name';
                fakeStats.restore();
                sinon.assert.calledWith(fakePost, expectedUrl, expectedCheckin);
                assert.equal(resp, mock.CHECKIN_RESPONSE_OK);
                done();
            });
        });
        
        it('Verify checkin error', function(done) {
            // Mock Azure HTTP calls
            nock('https://management.azure.com:443', {'encodedQueryParams':true})
            .get(/stats-error-name$/, /.*/ )
            .query(true)
            .times(1)
            .reply(200, mock.getAzureWebApp('Limited'));
            
            process.env.WEBSITE_SITE_NAME = 'stats-error-name';
            var master = new AlAzureMaster(mock.DEFAULT_FUNCTION_CONTEXT, 'ehub', '1.0.0');
            master.checkin('2017-12-22T14:31:39', function(err){
                if (err) console.log(err);
                const expectedCheckin = { 
                    body: {
                        version: '1.0.0',
                        app_tenant_id: 'tenant-id',
                        collection_stats: { 'log': { 'bytes': 10, 'events': 15 } },
                        host_id: 'existing-host-id',
                        source_id: 'existing-source-id',
                        statistics: [{ 'Master': { 'errors': 0, 'invocations': 2 } }, { 'Collector': { 'errors': 1, 'invocations': 10 } }, { 'Updater': { 'errors': 0, 'invocations': 0 } }],
                        dl_stats: { dl_count: 6, max_dl_size: 4257 },
                        status: 'error',
                        details: ['Azure Web Application status is not OK. {\"availabilityState\":\"Limited\"}'],
                        error_code: 'ALAZU00001'
                    }
                };
                const expectedUrl = '/azure/ehub/checkin/subscription-id/kktest11-rg/stats-error-name';
                fakeStats.restore();
                sinon.assert.calledWithMatch(fakePost, expectedUrl, expectedCheckin);
                done();
            });
        });
        
        it('Verify checkin with custom health-check ok', function(done) {
            var customHealthFuns = [
                function(m, callback) {
                    return callback(null);
                },
                function(m, callback) {
                    return callback(null);
                }
            ];
            var master = new AlAzureMaster(mock.DEFAULT_FUNCTION_CONTEXT, 'ehub', '1.0.0', customHealthFuns);
            master.checkin('2017-12-22T14:31:39', function(err){
                if (err) console.log(err);
                const expectedCheckin = { 
                    body: {
                        version: '1.0.0',
                        app_tenant_id: 'tenant-id',
                        collection_stats: { 'log': { 'bytes': 10, 'events': 15 } },
                        host_id: 'existing-host-id',
                        source_id: 'existing-source-id',
                        statistics: [{ 'Master': { 'errors': 0, 'invocations': 2 } }, { 'Collector': { 'errors': 1, 'invocations': 10 } }, { 'Updater': { 'errors': 0, 'invocations': 0 } }],
                        dl_stats: { dl_count: 6, max_dl_size: 4257 },
                        status: 'ok',
                        details: []
                    }
                };
                const expectedUrl = '/azure/ehub/checkin/subscription-id/kktest11-rg/kktest11-name';
                sinon.assert.calledWithMatch(fakePost, expectedUrl, expectedCheckin);
                done();
            });
        });
        
        it('Verify checkin with custom health-check error that returns a raw string', function(done) {
            var customHealthFuns = [
                function(m, callback) {
                    return callback(null);
                },
                function(m, callback) {
                    return callback("A Raw String Error");
                }
            ];
            var master = new AlAzureMaster(mock.DEFAULT_FUNCTION_CONTEXT, 'ehub', '1.0.0', customHealthFuns);
            master.checkin('2017-12-22T14:31:39', function(err){
                if (err) console.log(err);
                const expectedCheckin = { 
                    body: {
                        version: '1.0.0',
                        app_tenant_id: 'tenant-id',
                        collection_stats: { 'log': { 'bytes': 10, 'events': 15 } },
                        host_id: 'existing-host-id',
                        source_id: 'existing-source-id',
                        statistics: [{ 'Master': { 'errors': 0, 'invocations': 2 } }, { 'Collector': { 'errors': 1, 'invocations': 10 } }, { 'Updater': { 'errors': 0, 'invocations': 0 } }],
                        status: 'error',
                        details: ["A Raw String Error"],
                        error_code: 'ALAZU000004'
                    }
                };
                const expectedUrl = '/azure/ehub/checkin/subscription-id/kktest11-rg/kktest11-name';
                sinon.assert.calledWithMatch(fakePost, expectedUrl, expectedCheckin);
                done();
            });
        });

        it('Verify checkin with custom health-check error', function(done) {
            var customHealthFuns = [
                function(m, callback) {
                    return callback(null);
                },
                function(m, callback) {
                    return callback(m.errorStatusFmt('ALAZU000004', 'Custom Error'));
                }
            ];
            var master = new AlAzureMaster(mock.DEFAULT_FUNCTION_CONTEXT, 'ehub', '1.0.0', customHealthFuns);
            master.checkin('2017-12-22T14:31:39', function(err){
                if (err) console.log(err);
                const expectedCheckin = { 
                    body: {
                        version: '1.0.0',
                        app_tenant_id: 'tenant-id',
                        collection_stats: { 'log': { 'bytes': 10, 'events': 15 } },
                        host_id: 'existing-host-id',
                        source_id: 'existing-source-id',
                        statistics: [{ 'Master': { 'errors': 0, 'invocations': 2 } }, { 'Collector': { 'errors': 1, 'invocations': 10 } }, { 'Updater': { 'errors': 0, 'invocations': 0 } }],
                        dl_stats: { dl_count: 6, max_dl_size: 4257 },
                        status: 'error',
                        details: ['Custom Error'],
                        error_code: 'ALAZU000004'
                    }
                };
                const expectedUrl = '/azure/ehub/checkin/subscription-id/kktest11-rg/kktest11-name';
                sinon.assert.calledWithMatch(fakePost, expectedUrl, expectedCheckin);
                done();
            });
        });
        
        
    });
});


