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

const AzureWebAppStats = require('../appstats').AzureWebAppStats;
const AzureAppInsightStats = require('../appstats').AzureAppInsightStats;
const AzureCollectionStats = require('../appstats').AzureCollectionStats;
const CollectionStatRecord = require('../appstats').CollectionStatRecord;
const ApplicationInsightsQueryClient = require('../appstats').ApplicationInsightsQueryClient;
const storageQueue = require("@azure/storage-queue");

const mock = require('./mock');

const DEFAULT_APP_FUNCTIONS = ['Master', 'Collector', 'Updater'];
process.env.APP_SUBSCRIPTION_ID = 'subscription-id';
process.env.APP_RESOURCE_GROUP = 'kktest11';
const mockCredentials={signRequest:()=>{}};

describe('App Stats tests', function() {
    before(function(){
        if (!nock.isActive()) {
            nock.activate();
        }
        // Useful for capturing HTTP calls for new tests.
        //nock.recorder.rec();
    });
    after(function(){
        nock.restore();
    });
    
    describe('AzureWebAppStats test', function() {
        
        beforeEach(function(){
        });
        afterEach(async function() {
            try {
                await fs.promises.unlink(mock.AL_TOKEN_CACHE_FILENAME);
            } catch (err) {
                if (err.code !== 'ENOENT') throw err;
            }
            nock.cleanAll();
        });

        it('checks getAppStats() with no Functions', async function() {
            var expectedStats = {
                statistics: []
            };
            var stats = new AzureWebAppStats();
            const appStats = await stats.getAppStats('2017-12-22T14:31:39');
            assert.deepEqual(expectedStats, appStats);
        });
        
        it('checks getAppStats() with empty stats', async function() {
            var getFunctionStatsStub = sinon.stub(AzureWebAppStats.prototype, 'getFunctionStats').callsFake(
                async function fakeFn(functionName) {
                    return {
                        [functionName]: { invocations: 0, errors: 0 }
                    };
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
            const appStats = await stats.getAppStats('2017-12-22T14:31:39');
            getFunctionStatsStub.restore();
            assert.deepEqual(expectedStats, appStats);
        });

        it('checks getAppStats() success', async function() {
            var getInvocationQueryStub = sinon.stub(AzureWebAppStats.prototype, 'getFunctionStats').callsFake(
                async function fakeFn(functionName, _timestamp) {
                    if (functionName === 'Master')
                        return { Master: { invocations: 3, errors: 2 } };
                    if (functionName === 'Collector')
                        return { Collector: { invocations: 3, errors: 1 } };
                    if (functionName === 'Updater')
                        return { Updater: { invocations: 2, errors: 1 } };
                    return { [functionName]: { invocations: 0, errors: 0 } };
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
            const appStats = await stats.getAppStats('2017-12-22T14:31:39');
            getInvocationQueryStub.restore();
            assert.deepEqual(expectedStats, appStats);
        });

        it('checks getAppStats() success with pagination', async function() {
            var getInvocationQueryStub = sinon.stub(AzureWebAppStats.prototype, 'getFunctionStats').callsFake(
                async function fakeFn(functionName, _timestamp) {
                    if (functionName === 'Master')
                        return { Master: { invocations: 3, errors: 2 } };
                    if (functionName === 'Collector')
                        return { Collector: { invocations: 11, errors: 0 } };
                    if (functionName === 'Updater')
                        return { Updater: { invocations: 2, errors: 1 } };
                    return { [functionName]: { invocations: 0, errors: 0 } };
                }
            );

            var expectedStats = {
                statistics: [
                    { Master: { invocations: 3, errors: 2 } },
                    { Collector: { invocations: 11, errors: 0 } },
                    { Updater: { invocations: 2, errors: 1 } }
                ]
            };

            var stats = new AzureWebAppStats(DEFAULT_APP_FUNCTIONS);
            const appStats = await stats.getAppStats('2017-12-22T14:31:39');
            getInvocationQueryStub.restore();
            assert.deepEqual(expectedStats, appStats);
        });
        
        it('checks getAppStats() success with cont token (Updater)', async function() {
            var getInvocationQueryStub = sinon.stub(AzureWebAppStats.prototype, 'getFunctionStats').callsFake(
                async function fakeFn(functionName, _timestamp) {
                    if (functionName === 'Master')
                        return { Master: { invocations: 3, errors: 2 } };
                    if (functionName === 'Collector')
                        return { Collector: { invocations: 3, errors: 1 } };
                    if (functionName === 'Updater') {
                        return { Updater: { invocations: 4, errors: 2 } };
                    }
                    return { [functionName]: { invocations: 0, errors: 0 } };
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
            const appStats = await stats.getAppStats('2017-12-22T14:31:39');
            getInvocationQueryStub.restore();
            assert.deepEqual(expectedStats, appStats);
        });
        
        it('checks getAppStats() errors', async function() {
            var getInvocationQueryStub = sinon.stub(AzureWebAppStats.prototype, 'getFunctionStats').callsFake(
                async function fakeFn(functionName, _timestamp) {
                    return {
                        [functionName]: { error: 'Error: getaddrinfo ENOTFOUND test.table.core.windows.net test.table.core.windows.net:443' }
                    };
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
            const appStats = await stats.getAppStats('2017-12-22T14:31:39');
            getInvocationQueryStub.restore();
            assert.deepEqual(expectedStats, appStats);
        });
    });

    describe('AzureAppInsightStats test', function () {
        beforeEach(function () {
        });
        afterEach(async function () {
            try {
                await fs.promises.unlink(mock.AL_TOKEN_CACHE_FILENAME);
            } catch (err) {
                if (err.code !== 'ENOENT') throw err;
            }
            nock.cleanAll();
        });

        it('checks getAppStats() with no Functions', async function () {
            var expectedStats = {
                statistics: []
            };
            var stats = new AzureAppInsightStats({},[],mockCredentials,process.env.APP_SUBSCRIPTION_ID,process.env.APP_RESOURCE_GROUP);
            const appStats = await stats.getAppStats('2022-12-22T14:31:39');
            assert.deepEqual(expectedStats, appStats);
        });

        it('checks getAppStats() with empty or zero stats', async function () {
            var expectedStats = {
                statistics: [
                    { Master: { invocations: 0, errors: 0 } },
                    { Collector: { invocations: 0, errors: 0 } },
                    { Updater: { invocations: 0, errors: 0 } }
                ]
            };
            var stats = new AzureAppInsightStats({},DEFAULT_APP_FUNCTIONS, mockCredentials, process.env.APP_SUBSCRIPTION_ID, process.env.APP_RESOURCE_GROUP);
            const appStats = await stats.getAppStats('2022-12-22T14:31:39');
            assert.deepEqual(expectedStats, appStats);
        });

        it('checks getAppStats() and gets stats from application insights', async function () {
            var getInvocationQueryStub = sinon.stub(AzureAppInsightStats.prototype, 'getFunctionStats').callsFake(
                async function fakeFn(functionName, _timestamp) {
                    if (functionName === 'Master')
                        return mock.APPINSIGHTS_MASTER_INVOCATION_LOGS;
                    if (functionName === 'Collector')
                        return mock.APPINSIGHTS_COLLECTOR_INVOCATION_LOGS;
                    if (functionName === 'Updater') {
                        return mock.APPINSIGHTS_UPDATER_INVOCATION_LOGS;
                    }
                    return [];
                }
            );
            var expectedStats = {
                statistics: [
                    { Master: { invocations: 5, errors: 3 } },
                    { Collector: { invocations: 50, errors: 5 } },
                    { Updater: { invocations: 15, errors: 10 } }
                ]
            };
            var stats = new AzureAppInsightStats({},DEFAULT_APP_FUNCTIONS, mockCredentials, process.env.APP_SUBSCRIPTION_ID, process.env.APP_RESOURCE_GROUP);
            const appStats = await stats.getAppStats('2022-12-22T14:31:39');
            getInvocationQueryStub.restore();
            assert.deepEqual(expectedStats, appStats);
        });

        it('checks getAppStats() and gets stats from application insights getAppInsightsFunctionStats', async function () {
            process.env.APPINSIGHTS_INSTRUMENTATIONKEY = 'test-key';
            var getInvocationQueryStub = sinon.stub(AzureAppInsightStats.prototype, 'getAppInsightsFunctionStats').callsFake(
                async function fakeFn(functionNames, _timestamp) {
                    if (functionNames[0] === 'Master' || functionNames[1] === 'Collector' || functionNames[2] === 'Updater') {
                        let statistics = [
                            mock.APPINSIGHTS_MASTER_INVOCATION_LOGS,
                            mock.APPINSIGHTS_COLLECTOR_INVOCATION_LOGS,
                            mock.APPINSIGHTS_UPDATER_INVOCATION_LOGS
                        ];
                        return { statistics: statistics };
                    }
                    return [];
                }
            );
            var expectedStats = {
                statistics: [
                    { Master: { invocations: 5, errors: 3 } },
                    { Collector: { invocations: 50, errors: 5 } },
                    { Updater: { invocations: 15, errors: 10 } }
                ]
            };
            var stats = new AzureAppInsightStats({},DEFAULT_APP_FUNCTIONS, mockCredentials, process.env.APP_SUBSCRIPTION_ID, process.env.APP_RESOURCE_GROUP);
            const appStats = await stats.getAppStats('2022-12-22T14:31:39');
            getInvocationQueryStub.restore();
            assert.deepEqual(expectedStats, appStats);
        });

        it('checks getAppStats() return values from Insights API to test Master stats parsing', async function () {
            var query = mock.setKustoQuery(['Master']);
            var insightsClient = new ApplicationInsightsQueryClient(mockCredentials, { subscriptionId: process.env.APP_SUBSCRIPTION_ID });
            var appId = 'c5b420d7-23f3-4664-802d-c00c4c5611eb';
            var mockInsightsClient = sinon.stub(insightsClient.query, 'execute');
            mockInsightsClient.withArgs(appId, query).resolves(mock.UNPARSED_APPINSIGHTS_MASTER_INVOCATION_LOGS);

            try {
                const result = await insightsClient.query.execute(appId, query);
                let dataObj = { 'Master': { invocations: 0, errors: 0 } };
                const data = JSON.parse(result.tables[0].rows[0]);
                if (data.length) {
                    dataObj = { [data[0].operation_Name]: { invocations: data[0].invocations, errors: data[0].errors } };
                }
                mockInsightsClient.restore();
                assert.deepEqual(mock.APPINSIGHTS_MASTER_INVOCATION_LOGS, dataObj);
            } catch (e) {
                mockInsightsClient.restore();
                throw e;
            }
        });

        it('checks getAppStats() return values from Insights API to test Updater stats parsing', async function () {
            var query = mock.setKustoQuery(['Updater']);
            var insightsClient = new ApplicationInsightsQueryClient(mockCredentials, { subscriptionId: process.env.APP_SUBSCRIPTION_ID });
            var appId = 'c5b420d7-23f3-4664-802d-c00c4c5611eb';
            var mockInsightsClient = sinon.stub(insightsClient.query, 'execute');
            mockInsightsClient.withArgs(appId, query).resolves(mock.UNPARSED_APPINSIGHTS_UPDATER_INVOCATION_LOGS);

            try {
                const result = await insightsClient.query.execute(appId, query);
                let dataObj = { 'Updater': { invocations: 0, errors: 0 } };
                const data = JSON.parse(result.tables[0].rows[0]);
                if (data.length) {
                    dataObj = { [data[0].operation_Name]: { invocations: data[0].invocations, errors: data[0].errors } };
                }
                mockInsightsClient.restore();
                assert.deepEqual(mock.APPINSIGHTS_UPDATER_INVOCATION_LOGS, dataObj);
            } catch (e) {
                mockInsightsClient.restore();
                throw e;
            }
        });

        it(`checks getAppStats() return values from Insights API to test ['Master','Collector','Updater'] stats parsing`, async function () {
            var query = mock.setKustoQuery(['Collector']);
            var insightsClient = new ApplicationInsightsQueryClient(mockCredentials, { subscriptionId: process.env.APP_SUBSCRIPTION_ID });
            var appId = 'c5b420d7-23f3-4664-802d-c00c4c5611eb';
            var mockInsightsClient = sinon.stub(insightsClient.query, 'execute');
            mockInsightsClient.withArgs(appId, query).resolves(mock.UNPARSED_APPINSIGHTS_ALL_FUNCTIONS_INVOCATION_LOGS);
            
            try {
                const result = await insightsClient.query.execute(appId, query);
                let mapResult = [];
                const data = JSON.parse(result.tables[0].rows[0]);
                if (data.length) {
                    mapResult = data.map((item) => {
                        return { [item.operation_Name]: { invocations: item.invocations, errors: item.errors } };
                    });
                }
                mockInsightsClient.restore();
                assert.deepEqual(mock.PARSED_APPINSIGHTS_ALL_FUNCTIONS_INVOCATION_LOGS, mapResult);
            } catch (e) {
                mockInsightsClient.restore();
                throw e;
            }
        });

        it('checks getAppStats() return values from Insights API to test Collector stats parsing', async function () {
            var query = mock.setKustoQuery(['Collector']);
            var insightsClient = new ApplicationInsightsQueryClient(mockCredentials, { subscriptionId: process.env.APP_SUBSCRIPTION_ID });
            var appId = 'c5b420d7-23f3-4664-802d-c00c4c5611eb';
            var mockInsightsClient = sinon.stub(insightsClient.query, 'execute');
            mockInsightsClient.withArgs(appId, query).resolves(mock.UNPARSED_APPINSIGHTS_COLLECTOR_INVOCATION_LOGS);
            
            try {
                const result = await insightsClient.query.execute(appId, query);
                let dataObj = { 'Collector': { invocations: 0, errors: 0 } };
                const data = JSON.parse(result.tables[0].rows[0]);
                if (data.length) {
                    dataObj = { [data[0].operation_Name]: { invocations: data[0].invocations, errors: data[0].errors } };
                }
                mockInsightsClient.restore();
                assert.deepEqual(mock.APPINSIGHTS_COLLECTOR_INVOCATION_LOGS, dataObj);
            } catch (e) {
                mockInsightsClient.restore();
                throw e;
            }
        });
    });
    
    describe('AzureCollectionStats test', function() {
        beforeEach(function() {
            process.env.AzureWebJobsStorage = 'DefaultEndpointsProtocol=https;AccountName=testappo365;AccountKey=S0meKey+;EndpointSuffix=core.windows.net';
        });

        function statsMessages() {
            return [
                { messageText: JSON.stringify({ type: 1, bytes: 10, events: 15 }), messageId: '1', popReceipt: 'p1' },
                { messageText: JSON.stringify({ type: 1, bytes: 10, events: 15 }), messageId: '2', popReceipt: 'p2' }
            ];
        }

        it('checks putLogStats ok case', async function() {
            const queueClient = {
                create: async () => {},
                sendMessage: async () => {}
            };
            const fromConnectionStringStub = sinon.stub(storageQueue.QueueServiceClient, 'fromConnectionString').returns({
                getQueueClient: () => queueClient
            });

            const collectionStats = new AzureCollectionStats(mock.DEFAULT_FUNCTION_CONTEXT);
            await collectionStats.putLogStats(10, 15);
            fromConnectionStringStub.restore();
        });

        it('checks putLogStats error case', async function() {
            const queueClient = {
                create: async () => {},
                sendMessage: async () => {
                    const err = new Error('forbidden');
                    err.statusCode = 403;
                    throw err;
                }
            };
            const fromConnectionStringStub = sinon.stub(storageQueue.QueueServiceClient, 'fromConnectionString').returns({
                getQueueClient: () => queueClient
            });

            const collectionStats = new AzureCollectionStats(mock.DEFAULT_FUNCTION_CONTEXT);
            try {
                await collectionStats.putLogStats(10, 20);
                assert.fail('Expected error to be thrown');
            } catch (err) {
                assert.equal(err.statusCode, 403);
            }
            fromConnectionStringStub.restore();
        });

        it('checks getStats queue not found', async function() {
            const queueClient = {
                getProperties: async () => {
                    const err = new Error('not found');
                    err.code = 'QueueNotFound';
                    throw err;
                }
            };
            const fromConnectionStringStub = sinon.stub(storageQueue.QueueServiceClient, 'fromConnectionString').returns({
                getQueueClient: () => queueClient
            });

            const collectionStats = new AzureCollectionStats(mock.DEFAULT_FUNCTION_CONTEXT);
            const result = await collectionStats.getStats();
            assert.deepEqual(result, { log: { bytes: 0, events: 0 } });
            fromConnectionStringStub.restore();
        });

        it('checks getStats ok case', async function() {
            const queueClient = {
                getProperties: async () => ({ approximateMessagesCount: 2 }),
                receiveMessages: async () => ({ receivedMessageItems: statsMessages() }),
                deleteMessage: async () => {}
            };
            const fromConnectionStringStub = sinon.stub(storageQueue.QueueServiceClient, 'fromConnectionString').returns({
                getQueueClient: () => queueClient
            });

            const collectionStats = new AzureCollectionStats(mock.DEFAULT_FUNCTION_CONTEXT);
            const result = await collectionStats.getStats();
            assert.deepEqual(result, { log: { bytes: 20, events: 30 } });
            fromConnectionStringStub.restore();
        });

        it('checks getStats ok 2 batches', async function() {
            const queueClient = {
                getProperties: async () => ({ approximateMessagesCount: 64 }),
                receiveMessages: async () => ({ receivedMessageItems: statsMessages() }),
                deleteMessage: async () => {}
            };
            const fromConnectionStringStub = sinon.stub(storageQueue.QueueServiceClient, 'fromConnectionString').returns({
                getQueueClient: () => queueClient
            });

            const collectionStats = new AzureCollectionStats(mock.DEFAULT_FUNCTION_CONTEXT);
            const result = await collectionStats.getStats();
            assert.deepEqual(result, { log: { bytes: 40, events: 60 } });
            fromConnectionStringStub.restore();
        });

        it('checks getStats ok 3 batches', async function() {
            const queueClient = {
                getProperties: async () => ({ approximateMessagesCount: 65 }),
                receiveMessages: async () => ({ receivedMessageItems: statsMessages() }),
                deleteMessage: async () => {}
            };
            const fromConnectionStringStub = sinon.stub(storageQueue.QueueServiceClient, 'fromConnectionString').returns({
                getQueueClient: () => queueClient
            });

            const collectionStats = new AzureCollectionStats(mock.DEFAULT_FUNCTION_CONTEXT);
            const result = await collectionStats.getStats();
            assert.deepEqual(result, { log: { bytes: 60, events: 90 } });
            fromConnectionStringStub.restore();
        });

        it('getStats inaccurate stats. Error in get message batch.', async function() {
            let receiveCount = 0;
            const queueClient = {
                getProperties: async () => ({ approximateMessagesCount: 65 }),
                receiveMessages: async () => {
                    receiveCount += 1;
                    if (receiveCount === 3) {
                        throw new Error('batch failed');
                    }
                    return { receivedMessageItems: statsMessages() };
                },
                deleteMessage: async () => {}
            };
            const fromConnectionStringStub = sinon.stub(storageQueue.QueueServiceClient, 'fromConnectionString').returns({
                getQueueClient: () => queueClient
            });

            const collectionStats = new AzureCollectionStats(mock.DEFAULT_FUNCTION_CONTEXT);
            const result = await collectionStats.getStats();
            assert.deepEqual(result, { log: { bytes: 40, events: 60 } });
            fromConnectionStringStub.restore();
        });

        it('getStats accurate stats with an error in delete message.', async function() {
            let deleteCount = 0;
            const queueClient = {
                getProperties: async () => ({ approximateMessagesCount: 65 }),
                receiveMessages: async () => ({ receivedMessageItems: statsMessages() }),
                deleteMessage: async () => {
                    deleteCount += 1;
                    if (deleteCount > 4) {
                        throw new Error('delete failed');
                    }
                }
            };
            const fromConnectionStringStub = sinon.stub(storageQueue.QueueServiceClient, 'fromConnectionString').returns({
                getQueueClient: () => queueClient
            });

            const collectionStats = new AzureCollectionStats(mock.DEFAULT_FUNCTION_CONTEXT);
            const result = await collectionStats.getStats();
            assert.deepEqual(result, { log: { bytes: 40, events: 60 } });
            fromConnectionStringStub.restore();
        });
    });

    describe('CollectionStatRecord test', function() {
        beforeEach(function() {
        });
        afterEach(function() {
        });
        
        it('checks stats aggregation', function() {
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
        });
    });
});


