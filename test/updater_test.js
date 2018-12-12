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
    beforeEach(function(done) {
        if (!nock.isActive()) {
            nock.activate();
        }
        done();
    });
    
    afterEach(function(done) {
        nock.cleanAll();
        done();
    });
    
    it('Valid input', function(done) {
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
        upd.syncWebApp(function(err){
            assert.ok(tokenMock);
            assert.ok(syncMock);
            done();
        });
    });
    
    it('Valid input from process env', function(done) {
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
        upd.syncWebApp(function(err){
            assert.ok(tokenMock);
            assert.ok(syncMock);
            done();
        });
    });
});


