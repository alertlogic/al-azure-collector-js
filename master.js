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

const { ManagedIdentityCredential, ClientSecretCredential } = require('@azure/identity');
const {WebSiteManagementClient} = require('@azure/arm-appservice');

const alcollector = require('@alertlogic/al-collector-js');

const m_util = require('./util');
const AzureWebAppStats = require('./appstats').AzureWebAppStats;
const AzureAppInsightStats = require('./appstats').AzureAppInsightStats;
const AzureCollectionStats = require('./appstats').AzureCollectionStats;
const AlAzureDlBlob = require('./dlblob').AlAzureDlBlob;
const AlAzureUpdater = require('./updater').AlAzureUpdater;

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

const APPLICATION_INSIGHTS_ENDPOINTS = 'https://api.applicationinsights.io/';

const DEFAULT_APP_FUNCTIONS = ['Master', 'Collector', 'Updater'];

/**
 * @class
 * Base class for Azure Master function of a collector.
 *
 * @constructor
 * @param {Object} azureContext - context of Azure function.
 * @param {String} collectorType - collector type (ehub, o365, etc).
 * @param {String} version - version of collector.
 * @param {Array.<Function>} healthCheckFuns - (optional) list of custom async health check functions (can be just empty, so only common are applied). Default is [].
 * In case of health-check succeeds a custom health check function should return null, otherwise throw an error object constructed with a help of
 * errorStatusFmt() function. For example, throw master.errorStatusFmt('ALAZU00001', 'Some error description');
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
            async function() {
                return;
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
                    'azure',
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
        this._appFilterJson = process.env.APP_FILTER_JSON ? process.env.APP_FILTER_JSON : '';
        this._appFilterRegex = process.env.APP_FILTER_REGEX ? process.env.APP_FILTER_REGEX : '';
        
        //Initialize new SDK
        this._azureCreds=this.getTokenCredentials();
        if (process.env.FUNCTIONS_EXTENSION_VERSION > '~3') {
            const tokenCredentials = this.getTokenCredentials(APPLICATION_INSIGHTS_ENDPOINTS);
            this._appStats = new AzureAppInsightStats(azureContext, collectorAzureFunNames, tokenCredentials, this._subscriptionId, this._resourceGroup);
        } else {
            this._appStats = new AzureWebAppStats(collectorAzureFunNames);
        }

        this._collectionStats = new AzureCollectionStats(azureContext, {outputQueueBinding: OutputStatsBinding});
        this._alAzureDlBlob = new AlAzureDlBlob(azureContext, null);
        this._azureWebsiteClient = new WebSiteManagementClient(this._azureCreds, this._subscriptionId);
        this.azureWebsiteClientObject = {
            azureWebsiteClient: this._azureWebsiteClient,
            webAppName: this._webAppName,
            resourceGroup: this._resourceGroup
        }

    }

    getTokenCredentials(resource) {
        let credentials = {};
        if (process.env.MSI_ENDPOINT && process.env.MSI_SECRET) {
            // Use Managed Identity when running in Azure Functions
            credentials = new ManagedIdentityCredential();
        } else {
            // Use Client Secret for service principal authentication
            credentials = new ClientSecretCredential(this._domain, this._clientId, this._clientSecret);
        }
        return credentials;
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
                'azure',
                this._collectorType, 
                false, MASTER_RETRY_OPTS);
    }
    
    /**
     *  @function updateAlEndpoints - retrieves Alert Logic service endpoints.
     *  
     *  @param {Boolean} force - force Alert Logic service endpoints update overwriting existing ones stored in application settings
     *  
     *  @return {Promise<void>}
     */
    async updateAlEndpoints(force) {
        var master = this;
        if (!force && process.env.APP_INGEST_ENDPOINT && process.env.APP_AZCOLLECT_ENDPOINT) {
            master._azureContext.log.verbose('Reuse Ingest endpoint', process.env.APP_INGEST_ENDPOINT);
            master._azureContext.log.verbose('Reuse Azcollect endpoint', process.env.APP_AZCOLLECT_ENDPOINT);
            return;
        } else {
            master._azureContext.log.verbose('Updating endpoints for', SERVICE_ENDPOINTS);
            let mapsResult;
            try {
                mapsResult = await Promise.all(SERVICE_ENDPOINTS.map(function(service) {
                    return master._endpointsc.getEndpoint(service, master._alDataResidency);
                }));
            } catch (exception) {
                throw new Error(`Endpoints update failure ${exception}`);
            }
            master._azureContext.log.verbose('New endpoints:', mapsResult);
            var endpoints = {
                APP_AZCOLLECT_ENDPOINT : mapsResult[0].azcollect,
                APP_INGEST_ENDPOINT : mapsResult[1].ingest
            };
            await m_util.updateAppSettings(endpoints, master.azureWebsiteClientObject);
            master.resetAzcollectc(endpoints.APP_AZCOLLECT_ENDPOINT);
        }
    }
    
    getConfigAttrs() {
        return {
            version: this._version,
            web_app_name: this._webAppName,
            app_resource_group: this._resourceGroup,
            app_tenant_id: this._domain,
            subscription_id: this._subscriptionId,
            app_filter_json: this._appFilterJson,
            app_filter_regex: this._appFilterRegex
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
    
    async _getAppStatus() {
        var status = await this._azureWebsiteClient.webApps.get(
            this._resourceGroup,
            this._webAppName
        );
        const expectedProps = {
            availabilityState: 'Normal',
            state: 'Running',
            usageState: 'Normal',
            enabled: true
        };

        var propDiff = m_util.verifyObjProps(status, expectedProps);

        if (propDiff) {
            throw this.errorStatusFmt(
                'ALAZU00001',
                `Azure Web Application status is not OK. ${JSON.stringify(propDiff)}`
            );
        }
    }
    
    async getStats(timestamp) {
        var master = this;

        const withReflect = async function(fn) {
            try {
                return { value: await fn() };
            } catch (error) {
                return { error: error };
            }
        };

        const results = await Promise.all([
            withReflect(async function() {
                return master._appStats.getAppStats(timestamp);
            }),
            withReflect(async function() {
                const stats = await master._collectionStats.getStats();
                if (stats && typeof stats === 'object') {
                    return {
                        collection_stats: stats
                    };
                }
                return null;
            }),
            withReflect(async function() {
                if (process.env.APP_DL_CONTAINER_NAME) {
                    return master._alAzureDlBlob.getDlBlobStats();
                }
                return {};
            })
        ]);
        const statValues = results.reduce(function(acc, val){
            if (val.error) {
                master._azureContext.log.warn('Statistics retrieval failed with', val.error);
                return acc;
            }
            return Object.assign(acc, val.value);
        }, {});
        return statValues;
    }
    
    async getHealthStatus() {
        var master = this;

        const runCustomCheck = async function(check) {
            const result = await check(master);
            if (result) {
                throw result;
            }
        };

        try {
            await Promise.all([
                master._getAppStatus()
            ].concat(master._customHealthChecks.map(runCustomCheck)));
            return {
                status: 'ok',
                details: []
            };
        } catch (errStatus) {
            if(typeof errStatus === 'string'){
                master._azureContext.log.warn('Health check failed with: ',  errStatus);
                return master.errorStatusFmt('ALAZU000004', errStatus);
            }
            if(errStatus && errStatus.details){
                master._azureContext.log.warn('Health check failed with',  errStatus.details);
                return errStatus;
            }
            if(errStatus && errStatus.message){
                master._azureContext.log.warn('Health check failed with error message',  errStatus.message);
                return master.errorStatusFmt('ALAZU000005', errStatus.message);
            }
            return master.errorStatusFmt('ALAZU000006', JSON.stringify(errStatus));
        }
    }

    /**
     *  @function register - registers new collector in Alert Logic.
     *  
     *  @param {Object} registerOpts - optional registration parameters specific for a certain collector type.
     *  
     *  @return {Promise<Object>} { hostId, sourceId }
     */
    async register(registerOpts = {}) {
        var master = this;
        await master.updateAlEndpoints(false);
        var hostId = master._hostId;
        var sourceId = master._sourceId;
        if (hostId && sourceId) {
            master._azureContext.log.verbose('Reuse collector IDs: ', hostId, sourceId);
            return { hostId: hostId, sourceId: sourceId };
        }

        master._azureContext.log.verbose('Registering the collector: ',
                master._webAppName,
                master._collectorType,
                master._version);

        var regBody = Object.assign(
                master.getConfigAttrs(),
                master.getAzureCreds(),
                registerOpts);
        var resp = await master._azcollectc.register(regBody);
        var newHostId = resp.source.host.id;
        var newSourceId = resp.source.id;

        var newSettings = {
            COLLECTOR_HOST_ID: newHostId,
            COLLECTOR_SOURCE_ID: newSourceId
        };
        await m_util.updateAppSettings(newSettings, master.azureWebsiteClientObject);
        master._azureContext.log.verbose('New collector IDs: ', newHostId, newSourceId);
        master._hostId = newHostId;
        master._sourceId = newSourceId;
        return { hostId: newHostId, sourceId: newSourceId };
    }
    
    /**
     *  @function deregister - deregisters a collector from Alert Logic services.
     *  
     *  @param {Object} deregisterOpts - deregistration parameters specific for a certain collector type. Default is {}
     *  
     *  @return {Promise<void>}
     */
    async deregister(deregisterOpts = {}) {
        const deregBody = Object.assign(
            this.getConfigAttrs(),
            this.getCollectorIds(),
            deregisterOpts);
        return this._azcollectc.deregister(deregBody);
    }
    
    /**
     *  @function checkin - report a collector health check into Alert Logic services.
     *  
     *  @param {String} timestamp - for example, '2017-12-22T14:31:39'. Usually Master function timer trigger value is used.
     *  
     *  @return {Promise<void>}
     */
    async checkin(timestamp) {
        var master = this;
        const checkinParts = await Promise.all([
            master.getHealthStatus(),
            master.getStats(timestamp)
        ]);

        const checkinBody = Object.assign(
            master.getConfigAttrs(),
            master.getCollectorIds(),
            checkinParts[0],
            checkinParts[1]);
        const resp = await master._azcollectc.checkin(checkinBody);
        if(resp && resp.force_update === true){
            const updater = new AlAzureUpdater();
            try {
                await updater.syncWebApp();
            } catch (syncError) {
                throw new Error(`Forced update application sync failed: ${syncError}`);
            }
            master._azureContext.log.info('Forced update application sync OK');
        }
        return resp;
    }
};

module.exports = {
    AlAzureMaster: AlAzureMaster
};

