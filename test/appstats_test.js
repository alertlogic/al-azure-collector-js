/* -----------------------------------------------------------------------------
 * @copyright (C) 2018, Alert Logic, Inc
 * @doc
 *
 * Tests for Azure application stats class.
 *
 * @end
 * -----------------------------------------------------------------------------
 */
const assert = require('assert');
const sinon = require('sinon');
const nock = require('nock');
const fs = require('fs');
var azureStorage = require('azure-storage');

const AzureWebAppStats = require('../appstats').AzureWebAppStats;
const AzureCollectionStats = require('../appstats').AzureCollectionStats;
const CollectionStatRecord = require('../appstats').CollectionStatRecord;
const mock = require('./mock');

const DEFAULT_APP_FUNCTIONS = ['Master', 'Collector', 'Updater'];

describe('App Stats tests', function() {
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
    
    describe('AzureWebAppStats test', function() {
        beforeEach(function(){
        });
        afterEach(function(done) {
            fs.unlink(mock.AL_TOKEN_CACHE_FILENAME, function(err){
                done();
            });
            nock.cleanAll();
        });

        it('checks getAppStats() with no Functions', function(done) {
            var msTableServiceStub = sinon.stub(azureStorage, 'createTableService').callsFake(
                function fakeFn(account, key, host) {
                    var mockObj = {
                        queryEntities : function(table, query, token, callback) {
                            return callback(null, {entries : []});
                        }
                    };
                    return mockObj;
                }
            );
            var expectedStats = {
                statistics: []
            };
            var stats = new AzureWebAppStats();
            stats.getAppStats('2017-12-22T14:31:39', function(err, stats) {
                msTableServiceStub.restore();
                assert.deepEqual(expectedStats, stats);
                done();
            });
        });
        
        it('checks getAppStats() with empty stats', function(done) {
            var msTableServiceStub = sinon.stub(azureStorage, 'createTableService').callsFake(
                function fakeFn(account, key, host) {
                    var mockObj = {
                        queryEntities : function(table, query, token, callback) {
                            return callback(null, {entries : []});
                        }
                    };
                    return mockObj;
                }
            );
            var expectedStats = {
                statistics: [ 
                    { Master: { invocations: 0, errors: 0 } },
                    { Collector: { invocations: 0, errors: 0 } },
                    { Updater: { invocations: 0, errors: 0 } }
                ]
            };
            var stats = new AzureWebAppStats(DEFAULT_APP_FUNCTIONS);
            stats.getAppStats('2017-12-22T14:31:39', function(err, stats) {
                msTableServiceStub.restore();
                assert.deepEqual(expectedStats, stats);
                done();
            });
        });
        
        it('checks getAppStats() success', function(done) {
            var msTableServiceStub = sinon.stub(azureStorage, 'createTableService').callsFake(
                function fakeFn(account, key, host) {
                    var mockObj = {
                        queryEntities : function(table, query, token, callback) {
                            if (query === 'Master')
                                return callback(null, mock.MASTER_INVOCATION_LOGS);
                            if (query === 'Collector')
                                return callback(null, mock.COLLECTOR_INVOCATION_LOGS);
                            if (query === 'Updater')
                                return callback(null, mock.UPDATER_INVOCATION_LOGS);
                            return callback(null, {entries : []});
                        }
                    };
                    return mockObj;
                }
            );
            
            var getInvocationQueryStub = sinon.stub(AzureWebAppStats.prototype, '_getInvocationsQuery').callsFake(
                function fakeFn(functionName, timestamp) {
                    return functionName;
                }
            );
            
            var expectedStats = {
                statistics: [ 
                    { Master: { invocations: 3, errors: 2 } },
                    { Collector: { invocations: 3, errors: 1 } },
                    { Updater: { invocations: 2, errors: 1 } }
                ]
            };
            
            var stats = new AzureWebAppStats(DEFAULT_APP_FUNCTIONS);
            stats.getAppStats('2017-12-22T14:31:39', function(err, stats) {
                msTableServiceStub.restore();
                getInvocationQueryStub.restore();
                assert.deepEqual(expectedStats, stats);
                done();
            });
        });
        
        it('checks getAppStats() success with cont token (Updater)', function(done) {
            var msTableServiceStub = sinon.stub(azureStorage, 'createTableService').callsFake(
                function fakeFn(account, key, host) {
                    var mockObj = {
                        queryEntities : function(table, query, token, callback) {
                            if (query === 'Master')
                                return callback(null, mock.MASTER_INVOCATION_LOGS);
                            if (query === 'Collector')
                                return callback(null, mock.COLLECTOR_INVOCATION_LOGS);
                            if (query === 'Updater') {
                                if (token === 'cont-token') {
                                    return callback(null, mock.UPDATER_INVOCATION_LOGS);
                                } else {
                                    return callback(null, mock.UPDATER_INVOCATION_LOGS_CONTD);
                                }
                            } 
                            return callback(null, {entries : []});
                        }
                    };
                    return mockObj;
                }
            );
            
            var getInvocationQueryStub = sinon.stub(AzureWebAppStats.prototype, '_getInvocationsQuery').callsFake(
                function fakeFn(functionName, timestamp) {
                    return functionName;
                }
            );
            
            var expectedStats = {
                statistics: [ 
                    { Master: { invocations: 3, errors: 2 } },
                    { Collector: { invocations: 3, errors: 1 } },
                    { Updater: { invocations: 4, errors: 2 } }
                ]
            };
            
            var stats = new AzureWebAppStats(DEFAULT_APP_FUNCTIONS);
            stats.getAppStats('2017-12-22T14:31:39', function(err, stats) {
                msTableServiceStub.restore();
                getInvocationQueryStub.restore();
                assert.deepEqual(expectedStats, stats);
                done();
            });
        });
        
        it('checks getAppStats() errors', function(done) {
            var msTableServiceStub = sinon.stub(azureStorage, 'createTableService').callsFake(
                function fakeFn(account, key, host) {
                    var mockObj = {
                        queryEntities : function(table, query, token, callback) {
                            return callback('Error: getaddrinfo ENOTFOUND test.table.core.windows.net test.table.core.windows.net:443');
                        }
                    };
                    return mockObj;
                }
            );
            
            var expectedStats = {
                statistics:[
                    {'Master':{'error':'Error: getaddrinfo ENOTFOUND test.table.core.windows.net test.table.core.windows.net:443'}},
                    {'Collector':{'error':'Error: getaddrinfo ENOTFOUND test.table.core.windows.net test.table.core.windows.net:443'}},
                    {'Updater':{'error':'Error: getaddrinfo ENOTFOUND test.table.core.windows.net test.table.core.windows.net:443'}}
                ]
            };
            
            var stats = new AzureWebAppStats(DEFAULT_APP_FUNCTIONS);
            stats.getAppStats('2017-12-22T14:31:39', function(err, stats) {
                console.log(JSON.stringify(stats));
                msTableServiceStub.restore();
                assert.deepEqual(expectedStats, stats);
                done();
            });
        });
    });
    
    describe('AzureCollectionStats test', function() {
        beforeEach(function() {
            process.env.AzureWebJobsStorage = 'DefaultEndpointsProtocol=https;AccountName=testappo365;AccountKey=S0meKey+';
        });
        afterEach(function() {
            nock.cleanAll();
        });
        
        it('checks putLogStats ok case', function(done) {
            // Collection stats Azure mocks
            nock('https://testappo365.queue.core.windows.net:443', {'encodedQueryParams':true})
            .head('/alertlogic-stats')
            .query({'comp':'metadata'})
            .times(100)
            .reply(200, '', mock.statsQueueMetadataHeaders());
            
            nock('https://testappo365.queue.core.windows.net:443', {'encodedQueryParams':true})
            .post('/alertlogic-stats/messages' )
            .query(true)
            .times(100)
            .reply(201, '');
            
            var collectionStats = new AzureCollectionStats(mock.DEFAULT_FUNCTION_CONTEXT);
            
            collectionStats.putLogStats(10, 15, function(err) {
                assert.equal(err, null);
                done();
            });
            
        });
        
        it('checks putLogStats error case', function(done) {
            // Collection stats Azure mocks
            nock('https://testappo365.queue.core.windows.net:443', {'encodedQueryParams':true})
            .head('/alertlogic-stats')
            .query({'comp':'metadata'})
            .times(100)
            .reply(200, '', mock.statsQueueMetadataHeaders());
            
            nock('https://testappo365.queue.core.windows.net:443', {'encodedQueryParams':true})
            .post('/alertlogic-stats/messages' )
            .query(true)
            .times(100)
            .reply(403, mock.statsQueue403, mock.statsQueue403Headers);
            
            var collectionStats = new AzureCollectionStats(mock.DEFAULT_FUNCTION_CONTEXT);
            
            collectionStats.putLogStats(10, 20, function(err) {
                assert.equal(err.statusCode, 403);
                done();
            });
        });
        
        it('checks getStats queue not found', function(done) {
            // Collection stats Azure mocks
            nock('https://testappo365.queue.core.windows.net:443', {'encodedQueryParams':true})
            .get('/alertlogic-stats')
            .query({'comp':'metadata'})
            .times(100)
            .reply(404, mock.statsQueue404, mock.statsQueue404Headers);
            
            var collectionStats = new AzureCollectionStats(mock.DEFAULT_FUNCTION_CONTEXT);
            
            collectionStats.getStats(function(err, result) {
                const expected = { log: { bytes: 0, events: 0 } };
                assert.equal(err, null);
                assert.deepEqual(result, expected);
                done();
            });
            
        });

        it('checks getStats ok case', function(done) {
         // Collection stats Azure mocks
            nock('https://testappo365.queue.core.windows.net:443', {'encodedQueryParams':true})
            .get('/alertlogic-stats')
            .query({'comp':'metadata'})
            .times(100)
            .reply(200, '', mock.statsQueueMetadataHeaders());

            nock('https://testappo365.queue.core.windows.net:443', {"encodedQueryParams":true})
            .get('/alertlogic-stats/messages')
            .query(true)
            .times(100)
            .reply(200, mock.statsMessages);

            nock('https://testappo365.queue.core.windows.net:443', {"encodedQueryParams":true})
            .delete(/alertlogic-stats\/messages.*/)
            .query(true)
            .times(100)
            .reply(204,'');

            process.env.AzureWebJobsStorage = 'DefaultEndpointsProtocol=https;AccountName=testappo365;AccountKey=S0meKey+';
            var collectionStats = new AzureCollectionStats(mock.DEFAULT_FUNCTION_CONTEXT);
            
            collectionStats.getStats(function(err, result) {
                const expected = { log: { bytes: 20, events: 30 } };
                assert.equal(err, null);
                assert.deepEqual(result, expected);
                done();
            });
        });
        
        it('checks getStats ok 2 batches', function(done) {
            // Collection stats Azure mocks
               nock('https://testappo365.queue.core.windows.net:443', {'encodedQueryParams':true})
               .get('/alertlogic-stats')
               .query({'comp':'metadata'})
               .times(100)
               .reply(200, '', mock.statsQueueMetadataHeaders(64));

               nock('https://testappo365.queue.core.windows.net:443', {"encodedQueryParams":true})
               .get('/alertlogic-stats/messages')
               .query(true)
               .times(100)
               .reply(200, mock.statsMessages);

               nock('https://testappo365.queue.core.windows.net:443', {"encodedQueryParams":true})
               .delete(/alertlogic-stats\/messages.*/)
               .query(true)
               .times(100)
               .reply(204,'');

               process.env.AzureWebJobsStorage = 'DefaultEndpointsProtocol=https;AccountName=testappo365;AccountKey=S0meKey+';
               var collectionStats = new AzureCollectionStats(mock.DEFAULT_FUNCTION_CONTEXT);
               
               collectionStats.getStats(function(err, result) {
                   const expected = { log: { bytes: 40, events: 60 } };
                   assert.equal(err, null);
                   assert.deepEqual(result, expected);
                   done();
               });
           });
        
        it('checks getStats ok 3 batches', function(done) {
            // Collection stats Azure mocks
               nock('https://testappo365.queue.core.windows.net:443', {'encodedQueryParams':true})
               .get('/alertlogic-stats')
               .query({'comp':'metadata'})
               .times(100)
               .reply(200, '', mock.statsQueueMetadataHeaders(65));

               nock('https://testappo365.queue.core.windows.net:443', {"encodedQueryParams":true})
               .get('/alertlogic-stats/messages')
               .query(true)
               .times(100)
               .reply(200, mock.statsMessages);

               nock('https://testappo365.queue.core.windows.net:443', {"encodedQueryParams":true})
               .delete(/alertlogic-stats\/messages.*/)
               .query(true)
               .times(100)
               .reply(204,'');

               process.env.AzureWebJobsStorage = 'DefaultEndpointsProtocol=https;AccountName=testappo365;AccountKey=S0meKey+';
               var collectionStats = new AzureCollectionStats(mock.DEFAULT_FUNCTION_CONTEXT);
               
               collectionStats.getStats(function(err, result) {
                   const expected = { log: { bytes: 60, events: 90 } };
                   assert.equal(err, null);
                   assert.deepEqual(result, expected);
                   done();
               });
           });
        
        it('getStats inaccurate stats. Error in get message batch.', function(done) {
            // Collection stats Azure mocks
               nock('https://testappo365.queue.core.windows.net:443', {'encodedQueryParams':true})
               .get('/alertlogic-stats')
               .query({'comp':'metadata'})
               .times(100)
               .reply(200, '', mock.statsQueueMetadataHeaders(65));

               nock('https://testappo365.queue.core.windows.net:443', {"encodedQueryParams":true})
               .get('/alertlogic-stats/messages')
               .query(true)
               .times(2)
               .reply(200, mock.statsMessages)
               .get('/alertlogic-stats/messages')
               .query(true)
               .times(1)
               .reply(403, mock.statsQueue403, mock.statsQueue403Headers);

               nock('https://testappo365.queue.core.windows.net:443', {"encodedQueryParams":true})
               .delete(/alertlogic-stats\/messages.*/)
               .query(true)
               .times(100)
               .reply(204,'');

               process.env.AzureWebJobsStorage = 'DefaultEndpointsProtocol=https;AccountName=testappo365;AccountKey=S0meKey+';
               var collectionStats = new AzureCollectionStats(mock.DEFAULT_FUNCTION_CONTEXT);
               
               collectionStats.getStats(function(err, result) {
                   const expected = { log: { bytes: 40, events: 60 } };
                   assert.notEqual(err, null);
                   assert.deepEqual(result, expected);
                   done();
               });
           });

        it('getStats accurate stats with an error in delete message.', function(done) {
            // Collection stats Azure mocks
               nock('https://testappo365.queue.core.windows.net:443', {'encodedQueryParams':true})
               .get('/alertlogic-stats')
               .query({'comp':'metadata'})
               .times(100)
               .reply(200, '', mock.statsQueueMetadataHeaders(65));

               nock('https://testappo365.queue.core.windows.net:443', {"encodedQueryParams":true})
               .get('/alertlogic-stats/messages')
               .query(true)
               .times(3)
               .reply(200, mock.statsMessages);
               
               nock('https://testappo365.queue.core.windows.net:443', {"encodedQueryParams":true})
               .delete(/alertlogic-stats\/messages.*/)
               .query(true)
               // First 4 messages are removed successfully
               .times(4)
               .reply(204,'')
               .delete(/alertlogic-stats\/messages.*/)
               .query(true)
               // The last two messages from the last message batch get delete error
               .times(2)
               .reply(403, mock.statsQueue403, mock.statsQueue403Headers);

               process.env.AzureWebJobsStorage = 'DefaultEndpointsProtocol=https;AccountName=testappo365;AccountKey=S0meKey+';
               var collectionStats = new AzureCollectionStats(mock.DEFAULT_FUNCTION_CONTEXT);
               
               collectionStats.getStats(function(err, result) {
                   const expected = { log: { bytes: 40, events: 60 } };
                   assert.equal(err, null);
                   assert.deepEqual(result, expected);
                   done();
               });
           });

    });

    describe('CollectionStatRecord test', function() {
        beforeEach(function() {
        });
        afterEach(function() {
        });
        
        it('checks stats aggregation', function(done) {
            var stats1 = new CollectionStatRecord();
            var stats2 = new CollectionStatRecord();
            
            var statsData = [
                // STAT_TYPES_LOG
                { messageText: '{ "type": 1, "bytes": 1000, "events": 10 }'},
                { messageText: '{ "type": 1, "bytes": 2000, "events": 20 }'},
                { messageText: '{ "type": 1, "bytes": 3000, "events": 30 }'}
            ];
            
            assert.deepEqual(stats1, { log: { bytes: 0, events: 0 } });
            assert.deepEqual(stats2, { log: { bytes: 0, events: 0 } });
            
            stats1.aggregateAdd(statsData);
            stats2.aggregateAdd(statsData);
            stats2.aggregateAdd([]);
            assert.deepEqual(stats1, { log: { bytes: 6000, events: 60 } });
            assert.deepEqual(stats2, { log: { bytes: 6000, events: 60 } });
            
            stats1.add(stats2);
            assert.deepEqual(stats1, { log: { bytes: 12000, events: 120 } });
            
            stats1.aggregateSubtract(statsData);
            assert.deepEqual(stats1, { log: { bytes: 6000, events: 60 } });
            
            stats1.subtract(stats2);
            assert.deepEqual(stats1, { log: { bytes: 0, events: 0 } });
            
            stats2.reset();
            assert.deepEqual(stats2, { log: { bytes: 0, events: 0 } });
            
            done();
        });
    });
});


