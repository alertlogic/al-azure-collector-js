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

module.exports = {
    AzureWebAppStats: AzureWebAppStats
};
