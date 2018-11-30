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

const alcollector = require('al-collector-js');

const MASTER_RETRY_OPTS = {
    factor: 2,
    minTimeout: 300,
    retries: 7,
    maxTimeout: 10000
};

/**
 * @class
 * Base class for Azure Master function of a collector.
 *
 * @constructor
 * @param {Object} azureContext - context of Azure function.
 * @param {String} collectorType - collector type (ehub, o365, etc).
 * @param {String} version - version of collector.
 * @param {Array.<function>} healthCheckFuns - list of custom health check functions (can be just empty, so only common are applied). Deliberately not optional parameter.
 * @param {Array.<function>} statsFuns - list of custom stats functions (can be just empty, so only common are applied). Deliberately not optional parameter.
 * 
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
 */
class AlAzureMaster {
    constructor(azureContext, collectorType, version, healthCheckFuns, statsFuns,
            {hostId, sourceId, aimsKeyId, aimsKeySecret, alApiEndpoint, alAzcollectEndpoint, alDataResidency} = {},
            {clientId, domain, clientSecret, subscriptionId, resourceGroup, webAppName} = {}) {
        this._azureContext = azureContext;
        this._collectorType = collectorType;
        this._version = version;
        this._customHealthChecks = healthCheckFuns ? healthCheckFuns : [];
        this._customStatsFuns = statsFuns ? statsFuns : [];
        
        // Init Alert Logic optional configuration parameters
        this._hostId = hostId ? hostId : process.env.COLLECTOR_HOST_ID;
        this._sourceId = sourceId ? sourceId : process.env.COLLECTOR_SOURCE_ID;
        var alKeyId = aimsKeyId ? aimsKeyId : process.env.CUSTOMCONNSTR_APP_AL_ACCESS_KEY_ID;
        var alSecret = aimsKeySecret ? aimsKeySecret : process.env.CUSTOMCONNSTR_APP_AL_SECRET_KEY;
        var creds = {
            access_key_id: alKeyId,
            secret_key: alSecret
        };
        var apiEndpoint = alApiEndpoint ? alApiEndpoint : process.env.CUSTOMCONNSTR_APP_AL_API_ENDPOINT;
        var aimsc = new alcollector.AimsC(apiEndpoint, creds, undefined, MASTER_RETRY_OPTS);
        this._alDataResidency = alDataResidency ? alDataResidency : process.env.CUSTOMCONNSTR_APP_AL_RESIDENCY;
        
        // Init Azure optional configuration parameters
        this._clientId = clientId ? clientId : process.env.CUSTOMCONNSTR_APP_CLIENT_ID;
        this._domain = domain ? domain : process.env.APP_TENANT_ID;
        this._clientSecret = clientSecret ? clientSecret : process.env.CUSTOMCONNSTR_APP_CLIENT_SECRET;
        this._subscriptionId = subscriptionId ? subscriptionId : process.env.APP_SUBSCRIPTION_ID;
        this._resourceGroup = resourceGroup ? resourceGroup : process.env.APP_RESOURCE_GROUP;
        this._webAppName = webAppName ? webAppName : process.env.WEBSITE_SITE_NAME;
    }
    
    register(callback) {
        return callback('not implemented');
    }
    
    deregister(callback) {
        return callback('not implemented');
    }
    
    checkin(callback) {
        return callback('not implemented');
    }
    
    updateAlEndpoints(callback) {
        return callback('not implemented');
    }
};
module.exports = {
    AlAzureMaster: AlAzureMaster
};

