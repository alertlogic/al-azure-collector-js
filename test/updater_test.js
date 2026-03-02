/* -----------------------------------------------------------------------------
 * @copyright (C) 2018, Alert Logic, Inc
 * @doc
 *
 * Tests for updater.
 *
 * @end
 * -----------------------------------------------------------------------------
 */
const assert = require('assert');
const nock = require('nock');
const AlAzureUpdater = require('../updater').AlAzureUpdater;

const mock = require('./mock');

describe('Updater tests', function() {
    beforeEach(function() {
        if (!nock.isActive()) {
            nock.activate();
        }
    });
    
    afterEach(function() {
        nock.cleanAll();
    });
    
    it('Valid input', async function() {
        var tokenMock = nock('https://login.microsoftonline.com:443', {'encodedQueryParams':true})
        .post(/token$/, /.*/ )
        .query(true)
        .reply(200, mock.AZURE_TOKEN_MOCK);
        
        var syncMock = nock('https://management.azure.com:443', {'encodedQueryParams':true})
        .post(/sync/, /.*/ )
        .query(true)
        .reply(200, '');
        var azureOpts = {
            clientId: 'client-id',
            domain: 'tenant-id', 
            clientSecret: 'client-secret',
            subscriptionId: 'subscription-id',
            resourceGroup: 'rg',
            webAppName: 'app-name'
        };
        var upd = new AlAzureUpdater(azureOpts);
        await upd.syncWebApp();
        assert.ok(tokenMock);
        assert.ok(syncMock);
    });
    
    it('Valid input from process env', async function() {
        var tokenMock = nock('https://login.microsoftonline.com:443', {'encodedQueryParams':true})
        .post(/token$/, /.*/ )
        .query(true)
        .reply(200, mock.AZURE_TOKEN_MOCK);
        
        var syncMock = nock('https://management.azure.com:443', {'encodedQueryParams':true})
        .post(/sync/, /.*/ )
        .query(true)
        .reply(200, '');
        
        process.env.WEBSITE_SITE_NAME = 'kktest11';
        process.env.APP_SUBSCRIPTION_ID = 'subscription-id';
        process.env.APP_RESOURCE_GROUP = 'kktest11';
        process.env.APP_TENANT_ID = 'tenant-id';
        process.env.CUSTOMCONNSTR_APP_CLIENT_ID = 'client-id';
        process.env.CUSTOMCONNSTR_APP_CLIENT_SECRET = 'client-secret';
        
        var upd = new AlAzureUpdater();
        await upd.syncWebApp();
        assert.ok(tokenMock);
        assert.ok(syncMock);
    });
});


