/* -----------------------------------------------------------------------------
 * @copyright (C) 2018, Alert Logic, Inc
 * @doc
 * 
 * The module for getting function invocation statistics from storage account.
 * 
 * @end
 * -----------------------------------------------------------------------------
 */

const async = require('async');
const util = require('util');
const moment = require('moment');
const parse = require('parse-key-value');
const azureStorage = require('azure-storage');
const TableQuery = azureStorage.TableQuery;
const TableUtilities = azureStorage.TableUtilities;

const STATS_PERIOD_MINUTES = 15;

const STAT_MSG_VISIBILITY_TIMEOUT_SEC = 300;
const STAT_MSG_NUBMER_PER_BATCH = 32;

const STAT_TYPES_LOG = 1;


/**
 * @class
 * A class for retrieving Azure web application invocation statistics.
 *
 * @constructor
 * @param {List} functionNames - (optional) a list of Azure Function names. Default is [].
 **/
class AzureWebAppStats {
    constructor(functionNames = []) {
        this._functionNames = functionNames;
        const storageParams = parse(process.env.AzureWebJobsStorage);
        this._tableService = azureStorage.createTableService(
            storageParams.AccountName, 
            storageParams.AccountKey, 
            storageParams.AccountName + '.table.core.windows.net');
    }
    
    getTableService() {
        return this._tableService;
    }
    
    getLogTableName() {
        return 'AzureWebJobsHostLogs' + moment.utc().format('YYYYMM');
    }
    
    _getInvocationsQuery(functionName, timestamp) {
        var functionFilter = TableQuery.stringFilter(
            'FunctionName',
            TableUtilities.QueryComparisons.EQUAL,
            functionName);
        var dateFilter = TableQuery.dateFilter(
            'StartTime',
            TableUtilities.QueryComparisons.GREATER_THAN_OR_EQUAL,
            new Date(moment(timestamp).utc().subtract(STATS_PERIOD_MINUTES, 'minutes')));
        var whereFilter = TableQuery.combineFilters(
            dateFilter,
            TableUtilities.TableOperators.AND,
            functionFilter);
            
        return new TableQuery().where(whereFilter);
    };

    _getInvocationStats(entities, accStats) {
        accStats.invocations += entities.length;
        
        return entities.reduce(function(acc, current) {
            if (current.ErrorDetails) {
                acc.errors++;
            }
            return acc;
        },
        accStats);
    };

    _getFunctionStats(functionName, timestamp, callback) {
        var accStats = {
            invocations : 0,
            errors : 0
        };
        return this._getFunctionStatsAcc(functionName, timestamp, null, accStats, callback);
    };

    _getFunctionStatsAcc(functionName, timestamp, contToken, accStats, callback) {
        var tableService = this._tableService;
        var appstats = this;
        var obj = {};
        
        tableService.queryEntities(
            appstats.getLogTableName(), 
            appstats._getInvocationsQuery(functionName, timestamp),
            contToken,
            function(error, result) {
                if (error) {
                    obj[functionName] = {
                        error : `${error}`
                    };
                    return callback(null, obj);
                } else {
                    if (result.continuationToken) {
                        return appstats._getFunctionStatsAcc(
                            functionName,
                            timestamp,
                            result.continuationToken,
                            appstats._getInvocationStats(result.entries, accStats),
                            callback);
                    } else {
                        obj[functionName] = appstats._getInvocationStats(result.entries, accStats);
                        return callback(null, obj);
                    }
                }
            });
    };

    /**
     * @function
     * Retrieve application stats for the last 15 mins starting from provided 'timestamp'.
     * Stats include: function invocations total and invocation error count.
     * 
     * @param {String} timestamp -  for example, '2017-12-22T14:31:39'. Usually Master function timer trigger value is used.
     * 
     * @return callback(err, stats)
     * @param {Object} stats - for example,
     * {
     *   statistics: [
     *     {"Master":
     *       {"invocations":2,"errors":0}
     *      },
     *      {"Collector":
     *          {"invocations":10,"errors":1}
     *      },
     *      {"Updater":
     *          {"invocations":0,"errors":0}
     *      }
     *   ]
     * }
     */
    getAppStats(timestamp, callback) {
        var appstats = this;
        async.map(appstats._functionNames,
            function(fname, callback){
                appstats._getFunctionStats(fname, timestamp, callback); 
            },
            function (mapErr, mapsResult) {
                if (mapErr) {
                    return callback(mapErr);
                } else {
                    return callback(null, {statistics: mapsResult});
                }
            });
    };

}

class CollectionStatRecord {
    constructor() {
        this.log = {
            bytes: 0,
            events: 0
        };
    };
    
    reset() {
        this.log = {
            bytes: 0,
            events: 0
        };
    };
    
    add(addStats) {
        if (addStats instanceof CollectionStatRecord) {
            this.log.bytes += addStats.log.bytes;
            this.log.events += addStats.log.events;
        }
        return this;
    };
    
    // Update with stat messages from the Storage queue.
    // [{invocationId : invId,
    //    type: STAT_TYPES_LOG,
    //    bytes: collectedBytes,
    //    events: collectedEvents}]
    //
    aggregateAdd(statsMessages) {
        var initStats = new CollectionStatRecord();
        var aggrStats = statsMessages.reduce(function(acc, curr) {
            switch(curr.type) {
                case STAT_TYPES_LOG:
                    acc.log.bytes += curr.bytes;
                    acc.log.events += curr.events;
                    break;
                    
                default:
                    break;
            };
            return acc;
        }, initStats);
        return this.add(aggrStats);
    }
}

class AzureCollectionStats {
    constructor(context, {statsQueueName, outputQueueBinding} = {}) {
        const storageParams = parse(process.env.AzureWebJobsStorage);
        this._context = context;
        this._statsQueueName = statsQueueName ? statsQueueName : process.env.APP_STATS_QUEUE_NAME;
        this._outputQueueBinding = outputQueueBinding;
        this._queueService = azureStorage.createQueueService(
            storageParams.AccountName,
            storageParams.AccountKey,
            storageParams.AccountName + '.queue.core.windows.net');
    }
    
    getQueueService() {
        return this._queueService;
    };
    
    _getStatsBatch(callback) {
        var stats = this;
        var queueService = stats._queueService;
        const queueName = stats._statsQueueName;
        const options = {
            visibilityTimeout: STAT_MSG_VISIBILITY_TIMEOUT_SEC,
            numOfMessages: STAT_MSG_NUBMER_PER_BATCH
        };
        var aggrStats = new CollectionStatRecord();
        
        queueService.getMessages(queueName, options, function(error, statsMessages) {
            if(!error) {
                const decodedStats = statsMessages.reduce(function(acc, msg) {
                    try {
                        acc.push(JSON.parse(msg.messageText));
                        return acc;
                    } catch (e) {
                        return acc;
                    }
                }, []);
                aggrStats.aggregateAdd(decodedStats);
                async.each(statsMessages, function(msg, callback) {
                    return queueService.deleteMessage(queueName, msg.messageId, msg.popReceipt, callback);
                }, function(error) {
                    if(!error){
                        return callback(null, aggrStats);
                    } else {
                        return callback(`Inaccurate colleciton stats due to ${error}`, aggrStats);
                    }
                });
            } else if (error && error.code === 'QueueNotFound') {
                return callback(null, aggrStats);
            } else {
                return callback(error, aggrStats);
            }
        });
    };
    
    getStats(callback) {
        var stats = this;
        const queueService = stats._queueService;
        const queueName = stats._statsQueueName;
        var resultStats = new CollectionStatRecord();
        var resultError = '';
        
        queueService.getQueueMetadata(queueName, function(error, metadata) {
            if (!error) {
                var processed = 0;
                async.doWhilst(function(callback) {
                    stats._getStatsBatch(function(error, aggrStatsBatch) {
                        resultError = error ? error + resultError : '';
                        resultStats.add(aggrStatsBatch);
                        processed += STAT_MSG_NUBMER_PER_BATCH;
                        return callback();
                    });
                }, function() {
                    return processed < metadata.approximateMessageCount;
                }, function() {
                    if (!resultError) {
                        return callback(null, resultStats);
                    } else {
                        return callback(resultError, resultStats);
                    }
                });
            } else if (error && error.code === 'QueueNotFound') {
                return callback(null, resultStats);
            } else {
                return callback(error);
            }
        });
    };
    
    putLogStats(collectedBytes, collectedEvents, callback) {
        const invId = this._context.executionContext.invocationId; 
        const logStats = {
            invocationId : invId,
            type: STAT_TYPES_LOG,
            bytes: collectedBytes,
            events: collectedEvents
        };
        return this._putStats(logStats, callback);
    };
    
    _putStats(collectionStats, callback) {
        var stats = this;
        const queueName = stats._statsQueueName;
        var outBinding = stats._outputQueueBinding;
        const collectionStatsString = JSON.stringify(collectionStats);
        if (outBinding) {
            outBinding.push(collectionStatsString);
            return callback(null);
        } else {
            return async.waterfall([
                function(callback) {
                    return stats._queueService.createQueueIfNotExists(queueName, callback);
                },
                function(metadata, resp, callback) {
                    return stats._queueService.createMessage(queueName, collectionStatsString, callback);
                },
            ], callback);
        }
    };
}
module.exports = {
    AzureWebAppStats: AzureWebAppStats,
    AzureCollectionStats: AzureCollectionStats,
    CollectionStatRecord: CollectionStatRecord
};
