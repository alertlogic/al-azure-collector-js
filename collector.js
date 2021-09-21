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

const moment = require('moment');
const alcollector = require('@alertlogic/al-collector-js');

const COLLECTOR_RETRY_OPTS = {
    factor: 2,
    minTimeout: 300,
    retries: 7,
    maxTimeout: 10000
};

/**
 * @class
 * Base class for Azure Master function of a collector
 *
 * @constructor
 * @param {Object} azureContext - context of Azure function.
 * @param {String} collectorType - collector type (ehub, o365, etc).
 * @param {String} version - version of collector.
 * 
 * @param {Object} alOptional - optional Alert Logic service parameters.
 * @param {String} [alOptional.hostId] - (optional) Alert Logic collector host id. Default is process.env.COLLECTOR_HOST_ID
 * @param {String} [alOptional.sourceId] - (optional) Alert Logic collector source id. Default is process.env.COLLECTOR_SOURCE_ID
 * @param {String} [alOptional.aimsKeyId] - (optional) Alert Logic API access key id. Default is process.env.CUSTOMCONNSTR_APP_AL_ACCESS_KEY_ID
 * @param {String} [alOptional.aimsKeySecret] - (optional) Alert Logic API access key secret. Default is process.env.CUSTOMCONNSTR_APP_AL_SECRET_KEY
 * @param {String} [alOptional.alApiEndpoint] - (optional) Alert Logic API endpoint. Default is process.env.CUSTOMCONNSTR_APP_AL_API_ENDPOINT
 * @param {String} [alOptional.alIngestEndpoint] - (optional) Alert Logic Ingestion service endpoint. Default is process.env.APP_INGEST_ENDPOINT
 * @param {String} [alOptional.alDataResidency] - (optional) data residency on Alert Logic side. Default is process.env.CUSTOMCONNSTR_APP_AL_RESIDENCY
 * @param {String} [alOptional.filterJson] - (optional) Alert Logic filterJSON. Default is process.env.COLLECTOR_FILTER_JSON
 * @param {String} [alOptional.filterRegex] - (optional) Alert Logic filterREGEX. Default is process.env.COLLECTOR_FILTER_REGEX
 * 
 */
class AlAzureCollector {
    constructor(azureContext, collectorType, version,
            {hostId, sourceId, aimsKeyId, aimsKeySecret, alApiEndpoint, alIngestEndpoint, alDataResidency, filterJson, filterRegex} = {}) {
        this._azureContext = azureContext;
        this._collectorType = collectorType;
        this._version = version;
        
        this._hostId = hostId ? hostId : process.env.COLLECTOR_HOST_ID;
        this._sourceId = sourceId ? sourceId : process.env.COLLECTOR_SOURCE_ID;
        this._filterJson = filterJson ? filterJson : process.env.COLLECTOR_FILTER_JSON;
        this._filterRegex = filterRegex ? filterRegex : process.env.COLLECTOR_FILTER_REGEX;
        var alKeyId = aimsKeyId ? aimsKeyId : process.env.CUSTOMCONNSTR_APP_AL_ACCESS_KEY_ID;
        var alSecret = aimsKeySecret ? aimsKeySecret : process.env.CUSTOMCONNSTR_APP_AL_SECRET_KEY;
        var creds = {
            access_key_id: alKeyId,
            secret_key: alSecret
        };
        var apiEndpoint = alApiEndpoint ? alApiEndpoint : process.env.CUSTOMCONNSTR_APP_AL_API_ENDPOINT;
        var aimsc = new alcollector.AimsC(apiEndpoint, creds, process.env.TMP, COLLECTOR_RETRY_OPTS);
        var ingestEndpoint = alIngestEndpoint ? alIngestEndpoint : process.env.APP_INGEST_ENDPOINT;
        this._ingestc = new alcollector.IngestC(ingestEndpoint, aimsc, 'azure_function', COLLECTOR_RETRY_OPTS);
        this._alDataResidency = alDataResidency ? alDataResidency : process.env.CUSTOMCONNSTR_APP_AL_RESIDENCY;
    }
    
    _defaultHostmetaElems() {
        return [
          {
            key: 'host_type',
            value: {str: 'azure_fun'}
          },
          {
            key: 'local_hostname',
            value: {str: process.env.WEBSITE_HOSTNAME}
          }
        ];
    }

    _prepareLmcStats(raw_count, raw_bytes) {
        return {
            inst_type: 'collector',
            appliance_id: '',
            source_type: this._collectorType,
            source_id: this._sourceId,
            host_id: this._hostId,
            event_count: raw_count,
            byte_count: raw_bytes,
            application_id: '',
            timestamp: moment().unix()
        };
    }
    
    /**
     *  @function processLog - formats and send log messages to Alert Logic Ingestion service.
     *  
     *  @param {Array.<Object>} messages - the list of JSON objects to be processed as Log data type.
     *  @param {Function} formatFun - message object formatting function. Refer to al-collector-js/al_log.js:buildPayload(parseCallback)
     *  @param {Function} hostmetaElems - (optional) additional host metadata elements. Refer to al-collector-js/al_log.js:buildPayload(hostmetaElems)
     *  @param {Function} callback
     *  
     *  @return {Function} callback - (error, response)
     */
    processLog(messages, formatFun, hostmetaElems, callback) {
        var args = Array.from(arguments);
        var callback = args.pop();
        messages = args.shift();
        formatFun = args.shift();
        if (args.length > 0) {
            hostmetaElems = args.shift();
        } else {
            hostmetaElems = undefined;
        }
        // Somebody can still pass 'undefined' as hostmetaElems and it will be added to args list.
        var hm = hostmetaElems ? hostmetaElems : this._defaultHostmetaElems();
        var ingestc = this._ingestc;
        
        if (messages && messages.length > 0) {
            let buildPayloadObj = {
                hostId: this._hostId, 
                sourceId: this._sourceId, 
                hostmetaElems: hm, 
                content: messages, 
                parseCallback: formatFun, 
                filterJson: this._filterJson, 
                filterRegexp: this._filterRegex
            };
            alcollector.AlLog.buildPayload(buildPayloadObj, (err, data) => {
                if (err) {
                    return callback(err);
                } else {
                    ingestc.sendLogmsgs(data.payload)
                        .then( resp => {
                            let lmcStats = this._prepareLmcStats(data.raw_count, data.raw_bytes);
                            ingestc.sendLmcstats(JSON.stringify([lmcStats]))
                                .then(resp => {
                                    return callback(null, resp);
                                })
                                .catch(exception => {
                                    return callback(null);
                                });
                        })
                        .catch( err => {
                            return callback(err);
                        });
                }
            });
        } else {
            return callback(null, {});
        }
        
    }
    
    processSecMsgs(callback){
        return callback('not implemented');
    }
};
module.exports = {
    AlAzureCollector: AlAzureCollector
};

