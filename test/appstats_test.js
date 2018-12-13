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
                        if (query == 'Master')
                            return callback(null, mock.MASTER_INVOCATION_LOGS);
                        if (query == 'Collector')
                            return callback(null, mock.COLLECTOR_INVOCATION_LOGS);
                        if (query == 'Updater')
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
                        if (query == 'Master')
                            return callback(null, mock.MASTER_INVOCATION_LOGS);
                        if (query == 'Collector')
                            return callback(null, mock.COLLECTOR_INVOCATION_LOGS);
                        if (query == 'Updater') {
                            if (token == 'cont-token') {
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


