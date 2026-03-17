/* -----------------------------------------------------------------------------
 * @copyright (C) 2018, Alert Logic, Inc
 * @doc
 * 
 * The module for getting function invocation statistics from storage account.
 * 
 * @end
 * -----------------------------------------------------------------------------
 */

const util = require('util');
const moment = require('moment');
const parse = require('parse-key-value');
const { ensureEndpointSuffix } = require('./util');

const { DefaultAzureCredential } = require("@azure/identity");
const { ApplicationInsightsManagementClient } = require("@azure/arm-appinsights");
const { TableClient } = require("@azure/data-tables");
const { QueueServiceClient } = require("@azure/storage-queue");
const ApplicationInsightsQueryClient = require('./applicationinsights_query_client');

// Statistics configuration constants
const STATS_PERIOD_MINUTES = 15;           // Statistics aggregation period in minutes
const STAT_MSG_VISIBILITY_TIMEOUT_SEC = 300; // Queue message visibility timeout in seconds
const STAT_MSG_NUMBER_PER_BATCH = 32;     // Stats messages per batch
const MAX_STATS_PAGES = 10;               // Max pages to retrieve stats from
const MAX_TABLE_ENTITIES_PER_QUERY = 1000; // Max entities to retrieve per table query
const STAT_TYPES_LOG = 1;                 // Log type identifier
const DEFAULT_STATS_QUEUE_NAME = 'alertlogic-stats';

class AzureAppStats {
    constructor(functionNames = []) {
        this._functionNames = functionNames;
    }
    
    async getFunctionStats(functionName, timestamp) {
        const obj = {};
        obj[functionName] = {
            invocations : 0,
            errors : 0
        };
        return obj;
    };

    /**
     * @function
     * @param {String} timestamp -  for example, '2017-12-22T14:31:39'. Usually Master function timer trigger value is used.
     * 
     * @return Promise resolves to stats
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
    async getAppStats(timestamp) {
        const results = await Promise.all(
            this._functionNames.map(fname => this.getFunctionStats(fname, timestamp))
        );
        return { statistics: results };
    };
}

/**
 * @class
 * A class for retrieving Azure web application invocation statistics.
 *
 * @constructor
 * @param {List} functionNames - (optional) a list of Azure Function names. Default is [].
 **/
class AzureWebAppStats extends AzureAppStats {
    constructor(functionNames = []) {
        super(functionNames);
        this._connectionString = ensureEndpointSuffix(process.env.AzureWebJobsStorage);
        const storageParams = parse(this._connectionString);
        const tableUrl = `https://${storageParams.AccountName}.table.core.windows.net`;
        this._tableUrl = tableUrl;
        // Cache TableClient to prevent socket exhaustion
        this._cachedTableClient = null;
        this._cachedTableName = null;
    }

    _getTableClient() {
        const currentTableName = this.getLogTableName();
        // Reuse client if table name hasn't changed (same month)
        if (this._cachedTableClient && this._cachedTableName === currentTableName) {
            return this._cachedTableClient;
        }
        // Create new client only when month changes
        this._cachedTableName = currentTableName;
        this._cachedTableClient = TableClient.fromConnectionString(this._connectionString, currentTableName);
        return this._cachedTableClient;
    }

    getTableUrl() {
        return this._tableUrl;
    }

    getLogTableName() {
        return 'AzureWebJobsHostLogs' + moment.utc().format('YYYYMM');
    }

    _getInvocationsQuery(functionName, timestamp) {
        const functionStartTime = moment(timestamp).utc().subtract(STATS_PERIOD_MINUTES, 'minutes').toDate();
        const filterString = `FunctionName eq '${functionName}' and StartTime ge datetime'${functionStartTime.toISOString()}'`;
        return filterString;
    };

    _getInvocationStats(entities, accStats) {
        accStats.invocations += entities.length;

        return entities.reduce(function (acc, current) {
            if (current.ErrorDetails) {
                acc.errors++;
            }
            return acc;
        },
            accStats);
    };

    async getFunctionStats(functionName, timestamp) {
        let accStats = {
            invocations: 0,
            errors: 0
        };
        
        try {
            // Reuse cached TableClient to prevent socket exhaustion
            const tableClient = this._getTableClient();

            const filterString = this._getInvocationsQuery(functionName, timestamp);
            const entities = [];
            
            for await (const entity of tableClient.listEntities({ filter: filterString })) {
                entities.push(entity);
                if (entities.length >= MAX_TABLE_ENTITIES_PER_QUERY) {
                    break;
                }
            }

            const obj = {};
            obj[functionName] = this._getInvocationStats(entities, accStats);
            return obj;
        } catch (error) {
            const obj = {};
            obj[functionName] = {
                error: `${error}`
            };
            return obj;
        }
    };

    /**
     * @function
     * Retrieve application stats for the last 15 mins starting from provided 'timestamp'.
     * Stats include: function invocations total and invocation error count.
     * 
     * @param {String} timestamp -  for example, '2017-12-22T14:31:39'. Usually Master function timer trigger value is used.
     * 
     * @return Promise resolves to stats
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
    async getAppStats(timestamp) {
        const results = await Promise.all(
            this._functionNames.map(fname => this.getFunctionStats(fname, timestamp))
        );
        return { statistics: results };
    };
}

class AzureAppInsightStats extends AzureAppStats {
    constructor(azureContext, functionNames = [], tokenCredentials, subscriptionId, resourceGroup) {
        super(functionNames);
        this.azureContext = azureContext;
        this._functionNames = functionNames;
        this.tokenCredentials = tokenCredentials;
        this.subscriptionId = subscriptionId;
        this.resourceGroup = resourceGroup;
        this.invocationsCount = [];
        // Cache clients to prevent socket exhaustion
        this._insightsManagementClient = new ApplicationInsightsManagementClient(new DefaultAzureCredential(), this.subscriptionId);
        this._insightsQueryClient = new ApplicationInsightsQueryClient(this.tokenCredentials, { subscriptionId: this.subscriptionId });
    }

    setFunctionStats(invocationsCount) {
        this.invocationsCount = invocationsCount;
    }

    async getFunctionStats(functionName, timestamp) {
        return super.getFunctionStats(functionName, timestamp);
    }
    
    async getAppInsightsFunctionStats(functionNames, timestamp) {
        // Reuse cached clients to prevent socket exhaustion
        const result = await this._insightsManagementClient.components.listByResourceGroup(this.resourceGroup);
        const insightsClient = this._insightsQueryClient;
        let stringifiedFunctionNames = JSON.stringify(functionNames).replace(/\[|\]/g, '');
        let query = {
            query: `requests
                    | where operation_Name in (${stringifiedFunctionNames})
                    | where timestamp > ago(15m)
                    | order by timestamp desc
                    | where success == "True" or success == "False"
                    | summarize errors = countif(success == "False"),invocations = countif(success == "True" or success == "False") by operation_Name
                    | extend details = pack_all()
                    | summarize Result = make_list(details,128)`
        };
        let appId = result[0].appId;
        const queryResults = await insightsClient.query.execute(appId, query);
        const rows = queryResults && queryResults.tables && queryResults.tables[0] && queryResults.tables[0].rows ? queryResults.tables[0].rows : [];
        const row = rows.length > 0 ? rows[0] : null;
        const data = row ? JSON.parse(row[0]) : [];
        if (data.length) {
            const mapResult = data.map((item) => {
                return { [item.operation_Name]: { invocations: item.invocations, errors: item.errors } };
            });
            return { statistics: mapResult };
        }

        this.azureContext.log.info(`appstats.invocationsCount ${JSON.stringify(this.invocationsCount)}`);
        if (this.invocationsCount.length > 0) {
            return { statistics: this.invocationsCount };
        }

        const fallback = await Promise.all(functionNames.map((fname) => this.getFunctionStats(fname, timestamp)));
        return { statistics: fallback };
    }

    async getAppStats(timestamp) {
        if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY || process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
            return this.getAppInsightsFunctionStats(this._functionNames, timestamp);
        }

        if (this.invocationsCount.length > 0) {
            return { statistics: this.invocationsCount };
        }

        const results = await Promise.all(this._functionNames.map((fname) => this.getFunctionStats(fname, timestamp)));
        return { statistics: results };
    };
}

class CollectionStatRecord {
    constructor() {
        this.log = {
            bytes: 0,
            events: 0
        };
    }

    reset() {
        this.log = {
            bytes: 0,
            events: 0
        };
    }

    add(addStats) {
        if (addStats instanceof CollectionStatRecord) {
            this.log.bytes += addStats.log.bytes;
            this.log.events += addStats.log.events;
        }
        return this;
    }

    subtract(subtractStats) {
        if (subtractStats instanceof CollectionStatRecord) {
            this.log.bytes -= subtractStats.log.bytes > this.log.bytes ? this.log.bytes : subtractStats.log.bytes;
            this.log.events -= subtractStats.log.events > this.log.events ? this.log.events : subtractStats.log.events;
        }
        return this;
    }

    _aggregateStats(statsMessages) {
        var initStats = new CollectionStatRecord();
        return statsMessages.reduce(function (acc, curr) {
            try {
                const message = curr.messageText || curr.body;
                const stat = JSON.parse(message);
                switch (stat.type) {
                    case STAT_TYPES_LOG:
                        acc.log.bytes += stat.bytes;
                        acc.log.events += stat.events;
                        break;

                    default:
                        break;
                }
                return acc;
            } catch (e) {
                return acc;
            }
        }, initStats);
    }

    aggregateAdd(statsMessages) {
        const aggrStats = this._aggregateStats(statsMessages);
        return this.add(aggrStats);
    }

    aggregateSubtract(statsMessages) {
        const aggrStats = this._aggregateStats(statsMessages);
        return this.subtract(aggrStats);
    }
}

class AzureCollectionStats {
    constructor(context, { statsQueueName, outputQueueBinding } = {}) {
        this._connectionString = ensureEndpointSuffix(process.env.AzureWebJobsStorage);
        const storageParams = parse(this._connectionString);
        this._context = context;
        this._statsQueueName = statsQueueName ? statsQueueName :
            process.env.APP_STATS_QUEUE_NAME ? process.env.APP_STATS_QUEUE_NAME : DEFAULT_STATS_QUEUE_NAME;
        this._outputQueueBinding = outputQueueBinding;
        this._queueServiceClient = QueueServiceClient.fromConnectionString(this._connectionString);
        const queueUrl = `https://${storageParams.AccountName}.queue.core.windows.net`;
        this._queueUrl = queueUrl;
    }

    getQueueUrl() {
        return this._queueUrl;
    };

    async _getStatsBatch() {
        const queueName = this._statsQueueName;
        var aggrStats = new CollectionStatRecord();

        const queueClient = this._queueServiceClient.getQueueClient(queueName);

        try {
            const receivedMessages = await queueClient.receiveMessages({
                visibilityTimeout: STAT_MSG_VISIBILITY_TIMEOUT_SEC,
                numberOfMessages: STAT_MSG_NUMBER_PER_BATCH
            });

            if (receivedMessages.receivedMessageItems && receivedMessages.receivedMessageItems.length > 0) {
                aggrStats.aggregateAdd(receivedMessages.receivedMessageItems);
                
                const deletePromises = receivedMessages.receivedMessageItems.map(async (msg) => {
                    try {
                        await queueClient.deleteMessage(msg.messageId, msg.popReceipt);
                        return null;
                    } catch (err) {
                        return msg;
                    }
                });
                
                const undeleted = await Promise.all(deletePromises);
                aggrStats.aggregateSubtract(undeleted.filter(x => x !== null));
            }
            
            return aggrStats;
        } catch (error) {
            if (error.code === 'QueueNotFound' || error.code === '404') {
                return aggrStats;
            } else {
                throw error;
            }
        }
    };

    async getStats() {
        const queueName = this._statsQueueName;
        var resultStats = new CollectionStatRecord();
        var resultError = '';

        const queueClient = this._queueServiceClient.getQueueClient(queueName);

        try {
            const properties = await queueClient.getProperties();
            const approximateMessageCount = properties.approximateMessagesCount || 0;

            let processed = 0;
            while (processed < approximateMessageCount) {
                try {
                    const aggrStatsBatch = await this._getStatsBatch();
                    resultStats.add(aggrStatsBatch);
                } catch (error) {
                    resultError = `${error}${resultError}`;
                }
                processed += STAT_MSG_NUMBER_PER_BATCH;
            }
            return resultStats;
        } catch (error) {
            if (error.code === 'QueueNotFound' || error.code === '404') {
                return resultStats;
            } else {
                throw error;
            }
        }
    };

    async putLogStats(collectedBytes, collectedEvents) {
        const invId = this._context.executionContext.invocationId;
        const logStats = {
            invocationId: invId,
            type: STAT_TYPES_LOG,
            bytes: collectedBytes,
            events: collectedEvents
        };
        return this._putStats(logStats);
    };

    async _putStats(collectionStats) {
        const queueName = this._statsQueueName;
        var outBinding = this._outputQueueBinding;
        const collectionStatsString = JSON.stringify(collectionStats);
        
        if (outBinding) {
            outBinding.push(collectionStatsString);
            return;
        } else {
            const queueClient = this._queueServiceClient.getQueueClient(queueName);

            try {
                await queueClient.create();
            } catch (error) {
                if (error.code !== 'QueueAlreadyExists' && error.code !== '409') {
                    throw error;
                }
            }
            
            await queueClient.sendMessage(collectionStatsString);
        }
    };
}

module.exports = {
    AzureWebAppStats: AzureWebAppStats,
    AzureCollectionStats: AzureCollectionStats,
    CollectionStatRecord: CollectionStatRecord,
    AzureAppInsightStats: AzureAppInsightStats,
    ApplicationInsightsQueryClient: ApplicationInsightsQueryClient
};

