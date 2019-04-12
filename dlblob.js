/* ----------------------------------------------------------------------------
 * @copyright (C) 2019, Alert Logic, Inc
 * @doc
 * 
 * Basic class for a dead letter blob processing.
 * Dead letter blobs are located in 'alertlogic-dl' container located in the
 * web application storage account.
 * The actual collector function.json blob binding for dead letters should looks like:
 * {
 *     "name": "dlBlob",
 *     "type": "blob",
 *     "path": "%APP_DL_CONTAINER_NAME%/%WEBSITE_SITE_NAME%/<collect-function-name-here>/{DateTime}",
 *     "connection": "AzureWebJobsStorage",
 *     "direction": "out"
 * }
 * 
 * @end
 * ----------------------------------------------------------------------------
 */
 
'use strict';

const async = require('async');
const azure = require('azure');

const CONCURRENT_BLOB_PROCESS_NUM = 20;
const LIST_BLOB_PAGE_SIZE = 100;
const DEFAULT_DL_CONTAINER_NAME = 'alertlogic-dl';


/**
 * @class
 * Dead letter blobs processing class.
 *
 * @constructor
 * @param {Object} context - context of Azure function.
 * @param {Function} processCallback - a blob processing callback(context, dlblob, dlblobText, callback)
 *
 */
class AlAzureDlBlob {
    constructor(context, processCallback) {
        this._context = context;
        this._blobService = azure.createBlobService(process.env.AzureWebJobsStorage);
        this._processCallback = processCallback;
        this._listPageSize = process.env.DL_BLOB_PAGE_SIZE ? 
                parseInt(process.env.DL_BLOB_PAGE_SIZE) : LIST_BLOB_PAGE_SIZE;
        this._dlContainerName = process.env.APP_DL_CONTAINER_NAME ? 
                process.env.APP_DL_CONTAINER_NAME : DEFAULT_DL_CONTAINER_NAME;
    };
    
    getBlobService() {
        return this._blobService;
    };
    
    _findMaxDlBlobSize(dlblobs) {
        var len = dlblobs.length, max = -Infinity;
        while (len--) {
            const contentLen = Number(dlblobs[len].contentLength);
            if (contentLen > max) {
                max = contentLen;
            }
        }
        return max;
    }
    
    /**
     *  @function Retrievs the first page (5000) of dead letter blobs and finds the one with the maximum size.
     *  
     *  @param callback
     *  @returns callback
     */
    getDlBlobStats(callback) {
        var dlblob = this;
        return dlblob._blobService.listBlobsSegmentedWithPrefix(
            dlblob._dlContainerName,
            process.env.WEBSITE_SITE_NAME,
            null, function(listErr, dlblobList) {
                if (listErr) {
                    return callback(listErr);
                } else {
                    const dlstats =  {
                        dl_stats: {
                            dl_count: dlblobList.entries.length,
                            max_dl_size: dlblob._findMaxDlBlobSize(dlblobList.entries)
                        }
                    };
                    return callback(null, dlstats);
                }
            });
    };
    
    processDlBlobs(timer, callback) {
        var dlblob = this;
        const options = {
            maxResults: dlblob._listPageSize
        };
        this._blobService.listBlobsSegmentedWithPrefix(
            dlblob._dlContainerName,
            process.env.WEBSITE_SITE_NAME,
            null, options,
            function(listErr, data) {
                if (listErr) {
                    return callback(listErr);
                } else {
                    dlblob._context.log.verbose('Listed blobs: ', data.entries.length);
                    async.mapLimit(data.entries, CONCURRENT_BLOB_PROCESS_NUM, async.reflect(function(blob, asyncCallback) {
                        return dlblob._processDlBlob(blob, asyncCallback);
                    }), callback);
                }
        });
    };
    
    _processDlBlob(blob, callback) {
        var dlblob = this;
        dlblob._context.log.verbose('Processing blob: ', blob.name);
        async.waterfall([
            function(asyncCallback) {
                return dlblob._blobService.getBlobToText(dlblob._dlContainerName, blob.name, asyncCallback);
            },
            function(blobData, blobReq, blobResp, asyncCallback) {
                try {
                    return dlblob._processCallback(dlblob._context, blob, blobData, asyncCallback);
                } catch (ex) {
                    return asyncCallback(ex);
                }
            },
            function(asyncCallback) {
                return dlblob._blobService.deleteBlob(dlblob._dlContainerName, blob.name, asyncCallback);
            }
        ], callback);
    };
};
module.exports = {
    AlAzureDlBlob: AlAzureDlBlob
};

