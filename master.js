/* -----------------------------------------------------------------------------
 * @copyright (C) 2018, Alert Logic, Inc
 * @doc
 *
 * Master function base class
 *
 * @end
 * -----------------------------------------------------------------------------
 */
'use strict';

const async = require('async');

const msRestAzure = require('ms-rest-azure');
const azureArmWebsite = require('azure-arm-website');
const fileTokenCache = require('azure/lib/util/fileTokenCache');

const alcollector = require('al-collector-js');

const m_util = require('./util');
const AzureWebAppStats = require('./appstats').AzureWebAppStats;
const AzureCollectionStats = require('./appstats').AzureCollectionStats;

const MASTER_RETRY_OPTS = {
    factor: 2,
    minTimeout: 300,
    retries: 7,
    maxTimeout: 10000
};

const SERVICE_ENDPOINTS = [
    'azcollect',
    'ingest'
];

const DEFAULT_APP_FUNCTIONS = ['Master', 'Collector', 'Updater'];

/**
 * @class
 * Base class for Azure Master function of a collector.
 *
 * @constructor
 * @param {Object} azureContext - context of Azure function.
 * @param {String} collectorType - collector type (ehub, o365, etc).
 * @param {String} version - version of collector.
 * @param {Array.<Function>} healthCheckFuns - (optional) list of custom health check functions (can be just empty, so only common are applied). Default is [].
 * In case of health-check succeeds a custom health check function should call callback(null), otherwise return an error object constructed with a help of.
 * errorStatusFmt() function. For example, master.errorStatusFmt('ALAZU00001', 'Some error description');
 * 
 * @param {Array.<Function>} collectionStatsFun - (optional,deprecated) a function which is called during checking to get collection stats. The result of the function will be assigned to 'collection_stats' property of a checkin body. Default is null.
 * @
 * @param {Object} alOptional - optional Alert Logic service parameters.
 * @param {String} [alOptional.hostId] - (optional) Alert Logic collector host id. Default is process.env.COLLECTOR_HOST_ID
 * @param {String} [alOptional.sourceId] - (optional) Alert Logic collector source id. Default is process.env.COLLECTOR_SOURCE_ID
 * @param {String} [alOptional.aimsKeyId] - (optional) Alert Logic API access key id. Default is process.env.CUSTOMCONNSTR_APP_AL_ACCESS_KEY_ID
 * @param {String} [alOptional.aimsKeySecret] - (optional) Alert Logic API access key secret. Default is process.env.CUSTOMCONNSTR_APP_AL_SECRET_KEY
 * @param {String} [alOptional.alApiEndpoint] - (optional) Alert Logic API endpoint. Default is process.env.CUSTOMCONNSTR_APP_AL_API_ENDPOINT
 * @param {String} [alOptional.alAzcollectEndpoint] - (optional) Alert Logic Azcollect service endpoint. Default is process.env.APP_AZCOLLECT_ENDPOINT
 * @param {String} [alOptional.alDataResidency] - (optional) data residency inside Alert Logic. Default is process.env.CUSTOMCONNSTR_APP_AL_RESIDENCY
 * 
 * @param {Object} azureOptional - optional Azure parameters.
 * @param {String} [azureOptional.clientId] - (optional) Application (client) ID. Default is process.env.CUSTOMCONNSTR_APP_CLIENT_ID
 * @param {String} [azureOptional.domain] - (optional) Directory (tenant) ID. Default is process.env.APP_TENANT_ID
 * @param {String} [azureOptional.clientSecret] - (optional) Application (client) secret. Default is process.env.CUSTOMCONNSTR_APP_CLIENT_SECRET
 * @param {String} [azureOptional.subscriptionId] - (optional) Azure subscription ID. Default is process.env.APP_SUBSCRIPTION_ID
 * @param {String} [azureOptional.resourceGroup] - (optional) Azure resource group where the function is deployed. Default is process.env.APP_RESOURCE_GROUP
 * @param {String} [azureOptional.webAppName] - (optional) Azure web application name Update is running for. Default is process.env.WEBSITE_SITE_NAME
 * 
 * @param {Array.<String>} collectorAzureFunNames - (optional) the list of Azure function names a collector Web application consists of. Default is ['Master', 'Collector', 'Updater'].
 * 
 */
class AlAzureMaster {
    constructor(azureContext, collectorType, version, healthCheckFuns, collectionStatsFun,
            {hostId, sourceId, aimsKeyId, aimsKeySecret, alApiEndpoint, alAzcollectEndpoint, alDataResidency} = {},
            {clientId, domain, clientSecret, subscriptionId, resourceGroup, webAppName} = {},
            collectorAzureFunNames = DEFAULT_APP_FUNCTIONS, OutputStatsBinding = null) {
        this._azureContext = azureContext;
        this._collectorType = collectorType;
        this._version = version;
        this._customHealthChecks = healthCheckFuns ? healthCheckFuns : [];
        this._collectionStatsFun = collectionStatsFun && typeof collectionStatsFun === 'function' ? collectionStatsFun :
            function(m, ts, callback) {
                return callback();
        };
        
        // Init Alert Logic optional configuration parameters
        this._hostId = hostId ? hostId : process.env.COLLECTOR_HOST_ID;
        this._sourceId = sourceId ? sourceId : process.env.COLLECTOR_SOURCE_ID;
        var alKeyId = aimsKeyId ? aimsKeyId : process.env.CUSTOMCONNSTR_APP_AL_ACCESS_KEY_ID;
        var alSecret = aimsKeySecret ? aimsKeySecret : process.env.CUSTOMCONNSTR_APP_AL_SECRET_KEY;
        var creds = {
            access_key_id: alKeyId,
            secret_key: alSecret
        };
        this._apiEndpoint = alApiEndpoint ? alApiEndpoint : process.env.CUSTOMCONNSTR_APP_AL_API_ENDPOINT;
        this._alAzcollectEndpoint = alAzcollectEndpoint ? alAzcollectEndpoint : process.env.APP_AZCOLLECT_ENDPOINT;
        this._aimsc = new alcollector.AimsC(this._apiEndpoint, creds, process.env.TMP, MASTER_RETRY_OPTS);
        this._endpointsc = new alcollector.EndpointsC(this._apiEndpoint, this._aimsc, MASTER_RETRY_OPTS);
        this._azcollectc = this._alAzcollectEndpoint ? 
                new alcollector.AzcollectC(
                    this._alAzcollectEndpoint,
                    this._aimsc,
                    this._collectorType,
                    false,
                    MASTER_RETRY_OPTS) :
                undefined;
        this._alDataResidency = alDataResidency ? alDataResidency : process.env.CUSTOMCONNSTR_APP_AL_RESIDENCY;
        
        // Init Azure optional configuration parameters
        this._domain = domain ? domain : process.env.APP_TENANT_ID;
        this._clientId = clientId ? clientId : 
            process.env.MSI_SECRET ? process.env.APP_PRINCIPAL_ID : process.env.CUSTOMCONNSTR_APP_CLIENT_ID;
        this._clientSecret = clientSecret ? clientSecret : 
            process.env.MSI_SECRET ? 'Managed Service Identity' : process.env.CUSTOMCONNSTR_APP_CLIENT_SECRET;
        this._subscriptionId = subscriptionId ? subscriptionId : process.env.APP_SUBSCRIPTION_ID;
        this._resourceGroup = resourceGroup ? resourceGroup : process.env.APP_RESOURCE_GROUP;
        this._webAppName = webAppName ? webAppName : process.env.WEBSITE_SITE_NAME;
        
        // Init Azure SDK
        if (process.env.MSI_ENDPOINT && process.env.MSI_SECRET) {
            this._azureCreds = new msRestAzure.MSIAppServiceTokenCredentials();
        } else {
            const tokenCache = new fileTokenCache(m_util.getADCacheFilename(
                'https://management.azure.com',
                this._clientId,
                this._domain));
            this._azureCreds = new msRestAzure.ApplicationTokenCredentials(
                this._clientId,
                this._domain,
                this._clientSecret,
                { 'tokenCache': tokenCache });
        }
        this._azureWebsiteClient = new azureArmWebsite(this._azureCreds, this._subscriptionId);
        this._appStats = new AzureWebAppStats(collectorAzureFunNames);
        this._collectionStats = new AzureCollectionStats(azureContext, {outputQueueBinding: OutputStatsBinding});
    }
    
    getApplicationTokenCredentials(){
        return this._azureCreds;
    }
    
    getAzureWebsiteClient(){
        return this._azureWebsiteClient;
    }
    
    resetAzcollectc(endpoint) {
        return this._azcollectc = new alcollector.AzcollectC(
                endpoint, 
                this._aimsc, 
                this._collectorType, 
                false, MASTER_RETRY_OPTS);
    }
    
    updateAppSettings(newSettings, callback) {
        var master = this;
        async.waterfall([
            function(callback) {
                return master.getAppSettings(callback);
            },
            function(appSettings, callback) {
                var updatedProps = Object.assign({}, appSettings.properties, newSettings);
                var updatedEnv = Object.assign({}, process.env, newSettings);
                process.env = updatedEnv;
                appSettings.properties = updatedProps;
                return master.setAppSettings(appSettings, callback);
            }],
            callback
        );
    };

    getAppSettings(callback) {
        return this._azureWebsiteClient.webApps.listApplicationSettings(
            this._resourceGroup, this._webAppName, null,
            function(err, result, request, response) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(null, result);
                }
            });
    };

    setAppSettings(settings, callback) {
        return this._azureWebsiteClient.webApps.updateApplicationSettings(
            this._resourceGroup, this._webAppName, settings, null,
            function(err, result, request, response) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(null);
                }
            });
    };
    
    /**
     *  @function updateAlEndpoints - retrieves Alert Logic service endpoints.
     *  
     *  @param {Boolean} force - force Alert Logic service endpoints update overwriting existing ones stored in application settings
     *  @param {Function} callback
     *  
     *  @return {Function} callback - (error)
     */
    updateAlEndpoints(force, callback) {
        var master = this;
        if (!force && process.env.APP_INGEST_ENDPOINT && process.env.APP_AZCOLLECT_ENDPOINT) {
            master._azureContext.log.verbose('Reuse Ingest endpoint', process.env.APP_INGEST_ENDPOINT);
            master._azureContext.log.verbose('Reuse Azcollect endpoint', process.env.APP_AZCOLLECT_ENDPOINT);
            return callback(null);
        } else {
            master._azureContext.log.verbose('Updating endpoints for', SERVICE_ENDPOINTS);
            async.map(SERVICE_ENDPOINTS, 
                function(service, callback){
                    master._endpointsc.getEndpoint(service, master._alDataResidency)
                        .then(resp => {
                            return callback(null, resp);
                        })
                        .catch(function(exception) {
                            return callback(`Endpoints update failure ${exception}`);
                        });
                },
                function (mapErr, mapsResult) {
                    if (mapErr) {
                        return callback(mapErr);
                    } else {
                        master._azureContext.log.verbose('New endpoints:', mapsResult);
                        var endpoints = {
                            APP_AZCOLLECT_ENDPOINT : mapsResult[0].azcollect,
                            APP_INGEST_ENDPOINT : mapsResult[1].ingest
                        };
                        master.updateAppSettings(endpoints, function(settingsError) {
                            if (settingsError) {
                                return callback(settingsError);
                            } else {
                                master.resetAzcollectc(endpoints.APP_AZCOLLECT_ENDPOINT);
                                return callback(null);
                            }
                        });
                    }
            });
        }
    }
    
    getConfigAttrs() {
        return {
            version: this._version,
            web_app_name: this._webAppName,
            app_resource_group: this._resourceGroup,
            app_tenant_id: this._domain,
            subscription_id: this._subscriptionId
        };
    }
    
    getAzureCreds() {
        return {
            client_id: this._clientId,
            client_secret: this._clientSecret
        };
    }
    
    getCollectorIds() {
        return {
            host_id: this._hostId,
            source_id: this._sourceId
        };
    }
    
    errorStatusFmt(code, message) {
       return {
           status: 'error',
           error_code: code,
           details: [message]
       };
   }
    
    _getAppStatus(callback) {
        var master = this;
        this._azureWebsiteClient.webApps.get(
            this._resourceGroup,
            this._webAppName,
            function(err, status) {
            if (err) {
                return callback(err);
            } else {
                const expectedProps = {
                    availabilityState: 'Normal',
                    state: 'Running',
                    usageState: 'Normal',
                    enabled: true
                };
                
                var propDiff = m_util.verifyObjProps(status, expectedProps);
                
                if (!propDiff) {
                    return callback(null);
                } else {
                    return callback(master.errorStatusFmt(
                        'ALAZU00001',
                        `Azure Web Application status is not OK. ${JSON.stringify(propDiff)}`
                    ));
                }
            }
        });
    }
    
    _getCustomHealthChecks() {
        var master = this;
        return master._customHealthChecks.map(function(check) {
            return function(callback) {
                check(master, callback)
            }
        });
    }
    
    getStats(timestamp, callback) {
        var master = this;
        
        async.parallel([
            async.reflect(function(callback) {
                return master._appStats.getAppStats(timestamp, callback);
            }),
            async.reflect(function(callback) {
                return master._collectionStats.getStats(function(err, stats) {
                    var result;
                    if (stats && typeof stats === 'object') {
                        result = {
                            collection_stats: stats
                        };
                    } else {
                        result = null;
                    }
                    return callback(err, result);
                });
            })
        ],
        function(err, results){
            const statValues = results.reduce(function(acc, val){
                if (val.error) {
                    master._azureContext.log.warn('Statistics retrieval failed with', val.error);
                    return acc;
                } else {
                    return Object.assign(acc, val.value);
                }
            }, {});
            return callback(null, statValues);
        });
    }
    
    getHealthStatus(callback) {
        var master = this;
        
        async.parallel([
            function(callback) {
                master._getAppStatus(callback);
            }
        ].concat(master._getCustomHealthChecks()),
        function(errStatus) {
            var status;
            if (errStatus) {
                master._azureContext.log.warn('Health check failed with',  errStatus.details);
                status = errStatus;
            } else {
                status = {
                    status: 'ok',
                    details: []
                };
            }
            return callback(null, status);
        });
    }

    /**
     *  @function register - registers new collector in Alert Logic.
     *  
     *  @param {Object} registerOpts - optional registration parameters specific for a certain collector type.
     *  @param {Function} callback
     *  
     *  @return {Function} callback - (error, collectorHostId, collectorSourceId)
     */
    register(registerOpts = {}, callback) {
        var master = this;
        async.waterfall([
            // Update Alert Logic service endpoints, if necessary
            function(callback) {
                return master.updateAlEndpoints(false, callback);
            },
            // Register a collector with Alert Logic backed, if necessary
            function(callback) {
                var hostId = master._hostId;
                var sourceId = master._sourceId;
                if (hostId && sourceId) {
                    master._azureContext.log.verbose('Reuse collector IDs: ', hostId, sourceId);
                    return callback(null, false, hostId, sourceId);
                } else {
                    master._azureContext.log.verbose('Registering the collector: ',
                            master._webAppName,
                            master._collectorType,
                            master._version);
                    
                    var regBody = Object.assign(
                            master.getConfigAttrs(),
                            master.getAzureCreds(),
                            registerOpts);
                    master._azcollectc.register(regBody)
                        .then(resp => {
                            var newHostId = resp.source.host.id;
                            var newSourceId = resp.source.id;
                            return callback(null, true, newHostId, newSourceId);
                        })
                        .catch(err => {
                            return callback(err);
                        });
                }
            },
            // Update Azure application settings with collector registration values if needed
            function(updateSettings, hostId, sourceId, callback) {
                if (updateSettings) {
                    var newSettings = {
                        COLLECTOR_HOST_ID: hostId,
                        COLLECTOR_SOURCE_ID: sourceId
                    };
                    master.updateAppSettings(newSettings, 
                        function(settingsError) {
                            if (settingsError) {
                                return callback(settingsError);
                            } else {
                                master._azureContext.log.verbose('New collector IDs: ', hostId, sourceId);
                                master._hostId = hostId;
                                master._sourceId = sourceId;
                                return callback(null, hostId, sourceId);
                            }
                        });
                } else {
                    return callback(null, hostId, sourceId);
                }
            }
        ], callback);
    }
    
    /**
     *  @function deregister - deregisters a collector from Alert Logic services.
     *  
     *  @param {Object} deregisterOpts - deregistration parameters specific for a certain collector type. Default is {}
     *  @param {} callback
     *  
     *  @return callback - (error)
     */
    deregister(deregisterOpts = {}, callback) {
        const deregBody = Object.assign(
            this.getConfigAttrs(),
            this.getCollectorIds(),
            deregisterOpts);
        this._azcollectc.deregister(deregBody)
            .then(resp => {
                return callback(null, resp);
            })
            .catch(err => {
                return callback(err);
            });
    }
    
    /**
     *  @function checkin - report a collector health check into Alert Logic services.
     *  
     *  @param {String} timestamp - for example, '2017-12-22T14:31:39'. Usually Master function timer trigger value is used.
     *  @param callback
     *  
     *  @return callback - (error)
     */
    checkin(timestamp, callback) {
        var master = this;
        async.parallel([
            function(callback) {
                master.getHealthStatus(callback);
            },
            function(callback) {
                master.getStats(timestamp, callback);
            }
        ],
        function(err, checkinParts) {
            const checkinBody = Object.assign(
                master.getConfigAttrs(),
                master.getCollectorIds(),
                checkinParts[0],
                checkinParts[1]);
            master._azcollectc.checkin(checkinBody)
                .then(resp => {
                    return callback(null, resp);
                })
                .catch(err => {
                    return callback(err);
                });
        });
    }
};

module.exports = {
    AlAzureMaster: AlAzureMaster
};

