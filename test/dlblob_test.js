/* -----------------------------------------------------------------------------
 * @copyright (C) 2019, Alert Logic, Inc
 * @doc
 * 
 * Unit tests for DLBlob functions
 * 
 * @end
 * -----------------------------------------------------------------------------
 */

const assert = require('assert');
const sinon = require('sinon');
const { BlobServiceClient } = require('@azure/storage-blob');

const mock = require('./mock');
const AlAzureDlBlob = require('../dlblob').AlAzureDlBlob;

function makeAsyncIterator(items) {
    return {
        async *[Symbol.asyncIterator]() {
            for (const item of items) {
                yield item;
            }
        }
    };
}

function makeReadable(text) {
    const { Readable } = require('stream');
    return Readable.from([text]);
}

function sampleBlobs() {
    return [
        { name: 'kktestdl/ehubgeneral/2019-01-23T15-53-06Z', properties: { contentLength: 4257 } },
        { name: 'kktestdl/ehubgeneral/2019-01-23T15-53-09Z', properties: { contentLength: 2000 } },
        { name: 'kktestdl/ehubgeneral/2019-01-23T15-53-14Z', properties: { contentLength: 1000 } },
        { name: 'kktestdl/ehubgeneral/2019-01-23T15-56-35Z', properties: { contentLength: 900 } },
        { name: 'kktestdl/ehubgeneral/2019-01-23T15-44-58Z', properties: { contentLength: 800 } },
        { name: 'kktestdl/ehubgeneral/2019-01-23T15-45-04Z', properties: { contentLength: 700 } }
    ];
}

function setupBlobService({ blobs, failDownloads = new Set(), failDelete = new Set(), failList = null }) {
    const deleteSpy = sinon.spy();

    const containerClient = {
        listBlobsFlat: sinon.stub().callsFake(() => {
            if (failList) {
                throw failList;
            }
            return makeAsyncIterator(blobs);
        }),
        getBlockBlobClient: sinon.stub().callsFake((name) => ({
            download: async () => {
                if (failDownloads.has(name)) {
                    const err = new Error('download failed');
                    err.code = 'ContainerNotFound';
                    err.statusCode = 404;
                    throw err;
                }
                return { readableStreamBody: makeReadable(JSON.stringify(mock.GET_BLOB_CONTENT_TEXT)) };
            },
            delete: async () => {
                if (failDelete.has(name)) {
                    const err = new Error('delete failed');
                    err.code = 'ContainerNotFound';
                    err.statusCode = 404;
                    throw err;
                }
                deleteSpy(name);
            }
        }))
    };

    sinon.stub(BlobServiceClient, 'fromConnectionString').returns({
        getContainerClient: () => containerClient
    });

    return { deleteSpy };
}

describe('Dead letter blob processing unit tests.', function() {
    before(function() {
        process.env.WEBSITE_HOSTNAME = 'app-name';
        process.env.WEBSITE_SITE_NAME = 'test-site';
        process.env.CUSTOMCONNSTR_APP_AL_ACCESS_KEY_ID = mock.AL_KEY_ID;
        process.env.CUSTOMCONNSTR_APP_AL_SECRET_KEY = mock.AL_SECRET;
        process.env.CUSTOMCONNSTR_APP_AL_API_ENDPOINT = mock.AL_API_ENDPOINT;
        process.env.CUSTOMCONNSTR_APP_AL_RESIDENCY = 'default';
        process.env.APP_INGEST_ENDPOINT = 'existing-ingest-endpoint';
        process.env.APP_AZCOLLECT_ENDPOINT = 'existing-azcollect-endpoint';
        process.env.COLLECTOR_HOST_ID = 'existing-host-id';
        process.env.COLLECTOR_SOURCE_ID = 'existing-source-id';
        process.env.APP_DL_CONTAINER_NAME = 'alertlogic-dl';
        process.env.DL_BLOB_PAGE_SIZE = '100';
        process.env.APP_SUBSCRIPTION_ID = 'subscription-id';
        process.env.APP_RESOURCE_GROUP = 'kktest11-rg';
        process.env.APP_TENANT_ID = 'tenant-id';
        process.env.CUSTOMCONNSTR_APP_CLIENT_ID = 'client-id';
        process.env.CUSTOMCONNSTR_APP_CLIENT_SECRET = 'client-secret';
        process.env.AzureWebJobsStorage = 'DefaultEndpointsProtocol=https;AccountName=kktestdl;AccountKey=S0meKey+;EndpointSuffix=core.windows.net';
    });

    afterEach(function() {
        sinon.restore();
    });

    it('Simple OK check', async function() {
        process.env.DL_BLOB_PAGE_SIZE = '10';
        const { deleteSpy } = setupBlobService({ blobs: sampleBlobs() });

        const testProcessingStub = sinon.stub().callsFake(async function(context, dlblob) {
            sinon.assert.match(dlblob.name, 'kktestdl/ehubgeneral/2019-01-23T15');
            assert.equal(context.executionContext.invocationId, 'invocation-id');
        });

        const dlblob = new AlAzureDlBlob(mock.DEFAULT_FUNCTION_CONTEXT, testProcessingStub);
        const result = await dlblob.processDlBlobs({});
        assert.equal(result.length, 6);
        assert.equal(result.every((entry) => entry.status === 'fulfilled'), true);
        sinon.assert.callCount(deleteSpy, 6);
        sinon.assert.callCount(testProcessingStub, 6);
    });

    it('Stats OK', async function() {
        setupBlobService({ blobs: sampleBlobs() });
        const dlblob = new AlAzureDlBlob(mock.DEFAULT_FUNCTION_CONTEXT, sinon.fake());
        const stats = await dlblob.getDlBlobStats();
        assert.equal(stats.dl_stats.dl_count, 6);
        assert.equal(stats.dl_stats.max_dl_size, 4257);
        assert.equal(JSON.parse(stats.dl_stats.dl_sample).length, 2);
    });

    it('Stats Empty Array', async function() {
        setupBlobService({ blobs: [] });
        const dlblob = new AlAzureDlBlob(mock.DEFAULT_FUNCTION_CONTEXT, sinon.fake());
        const stats = await dlblob.getDlBlobStats();
        assert.equal(stats.dl_stats.dl_count, 0);
        assert.equal(stats.dl_stats.max_dl_size, 0);
        assert.equal(JSON.parse(stats.dl_stats.dl_sample).length, 0);
    });

    it('Stats error', async function() {
        setupBlobService({ blobs: sampleBlobs(), failDownloads: new Set(['kktestdl/ehubgeneral/2019-01-23T15-53-09Z']) });
        const dlblob = new AlAzureDlBlob(mock.DEFAULT_FUNCTION_CONTEXT, sinon.fake());
        try {
            await dlblob.getDlBlobStats();
            assert.fail('Expected getDlBlobStats to throw');
        } catch (err) {
            assert.equal(err.code, 'ContainerNotFound');
            assert.equal(err.statusCode, 404);
        }
    });

    it('Blob list error', async function() {
        const failList = new Error('list failed');
        failList.code = 'ContainerNotFound';
        failList.statusCode = 404;
        setupBlobService({ blobs: [], failList });
        const dlblob = new AlAzureDlBlob(mock.DEFAULT_FUNCTION_CONTEXT, sinon.fake());
        try {
            await dlblob.processDlBlobs({});
            assert.fail('Expected processDlBlobs to throw');
        } catch (err) {
            assert.equal(err.code, 'ContainerNotFound');
            assert.equal(err.statusCode, 404);
        }
    });

    it('Get blob content error', async function() {
        const blobs = sampleBlobs();
        const failDownloads = new Set(blobs.slice(1).map((b) => b.name));
        setupBlobService({ blobs, failDownloads });
        const testProcessingStub = sinon.stub().callsFake(async () => {});
        const dlblob = new AlAzureDlBlob(mock.DEFAULT_FUNCTION_CONTEXT, testProcessingStub);
        const result = await dlblob.processDlBlobs({});
        assert.equal(result[0].status, 'fulfilled');
        assert.equal(result.slice(1).every((entry) => entry.status === 'rejected'), true);
        sinon.assert.callCount(testProcessingStub, 1);
    });

    it('Delete blob error', async function() {
        const blobs = sampleBlobs();
        setupBlobService({ blobs, failDelete: new Set(blobs.map((b) => b.name)) });
        const testProcessingStub = sinon.stub().callsFake(async () => {});
        const dlblob = new AlAzureDlBlob(mock.DEFAULT_FUNCTION_CONTEXT, testProcessingStub);
        const result = await dlblob.processDlBlobs({});
        assert.equal(result.every((entry) => entry.status === 'rejected'), true);
        sinon.assert.callCount(testProcessingStub, 6);
    });
});
