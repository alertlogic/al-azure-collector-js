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

const parse = require('parse-key-value');
const { BlobServiceClient } = require("@azure/storage-blob");
const { ensureEndpointSuffix } = require('./util');

const CONCURRENT_BLOB_PROCESS_NUM = 20;  // Max concurrent blob processing operations
const DLQ_SAMPLE_SIZE = 2;               // Number of sample dead letter messages to retrieve
const LIST_BLOB_PAGE_SIZE = 100;         // Page size for listing blobs
const MAX_DL_BLOBS_TO_LIST = 5000;       // Max dead letter blobs to list per operation
const DEFAULT_DL_CONTAINER_NAME = 'alertlogic-dl';


/**
 * @class
 * Dead letter blobs processing class.
 *
 * @constructor
 * @param {Object} context - context of Azure function.
 * @param {Function} processCallback - an async blob processing function(context, blob, blobText)
 *
 */
class AlAzureDlBlob {
    constructor(context, processCallback) {
        this._context = context;
        this._blobServiceClient = BlobServiceClient.fromConnectionString(ensureEndpointSuffix(process.env.AzureWebJobsStorage));
        this._processCallback = processCallback;
        this._listPageSize = process.env.DL_BLOB_PAGE_SIZE ? 
                parseInt(process.env.DL_BLOB_PAGE_SIZE) : LIST_BLOB_PAGE_SIZE;
        this._dlContainerName = process.env.APP_DL_CONTAINER_NAME ? 
                process.env.APP_DL_CONTAINER_NAME : DEFAULT_DL_CONTAINER_NAME;
    };
    
    getBlobServiceClient() {
        return this._blobServiceClient;
    };
    
    _findMaxDlBlobSize(blobs) {
        let max = 0;
        blobs.forEach(blob => {
            const contentLen = Number(blob.properties.contentLength || 0);
            if (contentLen > max) {
                max = contentLen;
            }
        });
        return max;
    }
    
    /**
     *  @function Retrieves the first page of dead letter blobs and finds the one with the maximum size.
     *  
     *  @return Promise resolves to dlstats
     */
    async getDlBlobStats() {
        try {
            const containerClient = this._blobServiceClient.getContainerClient(this._dlContainerName);
            const blobs = [];
            
            for await (const blob of containerClient.listBlobsFlat({ prefix: process.env.WEBSITE_SITE_NAME })) {
                blobs.push(blob);
                if (blobs.length >= MAX_DL_BLOBS_TO_LIST) {
                    break;
                }
            }
            
            const sample = blobs.slice(0, DLQ_SAMPLE_SIZE);
            const dlSample = await Promise.all(
                sample.map(async (blob) => {
                    return this._getSampleMessage(blob);
                })
            );
            
            return {
                dl_stats: {
                    dl_count: blobs.length,
                    max_dl_size: this._findMaxDlBlobSize(blobs),
                    dl_sample: JSON.stringify(dlSample)
                }
            };
        } catch (error) {
            throw error;
        }
    };
    
    async processDlBlobs(timer) {
        try {
            const containerClient = this._blobServiceClient.getContainerClient(this._dlContainerName);
            const blobs = [];
            
            for await (const blob of containerClient.listBlobsFlat({ prefix: process.env.WEBSITE_SITE_NAME })) {
                blobs.push(blob);
                if (blobs.length >= this._listPageSize) {
                    break;
                }
            }
            
            this._context.log.verbose('Listed blobs: ', blobs.length);
            
            const results = [];
            for (let i = 0; i < blobs.length; i += CONCURRENT_BLOB_PROCESS_NUM) {
                const chunk = blobs.slice(i, i + CONCURRENT_BLOB_PROCESS_NUM);
                const chunkResults = await Promise.allSettled(
                    chunk.map(async (blob) => {
                        return this._processDlBlob(blob);
                    })
                );
                results.push(...chunkResults);
            }
            
            return results;
        } catch (error) {
            throw error;
        }
    };

    async _getSampleMessage(blob) {
        try {
            const containerClient = this._blobServiceClient.getContainerClient(this._dlContainerName);
            const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
            const downloadBlockBlobResponse = await blockBlobClient.download(0);
            const downloaded = await this._streamToString(downloadBlockBlobResponse.readableStreamBody);
            return downloaded;
        } catch (error) {
            throw error;
        }
    };

    /**
     * Helper function to read stream to string
     */
    async _streamToString(readableStream) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            readableStream.on("data", (data) => {
                chunks.push(data.toString("utf8"));
            });
            readableStream.on("end", () => {
                resolve(chunks.join(""));
            });
            readableStream.on("error", reject);
        });
    }
    
    async _processDlBlob(blob) {
        try {
            this._context.log.verbose('Processing blob: ', blob.name);
            
            const containerClient = this._blobServiceClient.getContainerClient(this._dlContainerName);
            const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
            const downloadBlockBlobResponse = await blockBlobClient.download(0);
            const blobData = await this._streamToString(downloadBlockBlobResponse.readableStreamBody);
            
            await this._processCallback(this._context, blob, blobData);
            
            await blockBlobClient.delete();
        } catch (error) {
            throw error;
        }
    };
};

module.exports = {
    AlAzureDlBlob: AlAzureDlBlob
};
