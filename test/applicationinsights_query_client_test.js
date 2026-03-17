/* -----------------------------------------------------------------------------
 * @copyright (C) 2018, Alert Logic, Inc
 * @doc
 *
 * Tests for Application Insights Query Client.
 *
 * @end
 * -----------------------------------------------------------------------------
 */
const assert = require('assert');
const sinon = require('sinon');

const ApplicationInsightsQueryClient = require('../applicationinsights_query_client');

describe('ApplicationInsightsQueryClient tests', function() {
    
    describe('constructor', function() {
        it('initializes with tokenCredentials and options', function() {
            const mockCredentials = { 
                getToken: sinon.stub().resolves({ token: 'test-token' })
            };
            const options = { subscriptionId: 'test-subscription' };
            
            const client = new ApplicationInsightsQueryClient(mockCredentials, options);
            
            assert.strictEqual(client.tokenCredentials, mockCredentials);
            assert.strictEqual(client.subscriptionId, 'test-subscription');
        });
        
        it('initializes with default empty options', function() {
            const mockCredentials = { 
                getToken: sinon.stub().resolves({ token: 'test-token' })
            };
            
            const client = new ApplicationInsightsQueryClient(mockCredentials);
            
            assert.strictEqual(client.tokenCredentials, mockCredentials);
            assert.strictEqual(client.subscriptionId, undefined);
        });
        
        it('creates query object with execute method', function() {
            const mockCredentials = { 
                getToken: sinon.stub().resolves({ token: 'test-token' })
            };
            
            const client = new ApplicationInsightsQueryClient(mockCredentials);
            
            assert(client.query);
            assert(typeof client.query.execute === 'function');
        });
    });
    
    describe('query.execute method', function() {
        let mockCredentials;
        let getTokenStub;
        
        beforeEach(function() {
            getTokenStub = sinon.stub().resolves({ token: 'test-bearer-token' });
            mockCredentials = { 
                getToken: getTokenStub
            };
        });
        
        afterEach(function() {
            sinon.restore();
        });
        
        it('fetches token from credentials with correct scope', async function() {
            const axios = require('axios');
            
            const mockResponse = { data: { tables: [] } };
            sinon.stub(axios, 'create').returns({
                post: sinon.stub().resolves(mockResponse)
            });
            const client = new ApplicationInsightsQueryClient(mockCredentials);
            
            try {
                const appId = 'test-app-id';
                const query = { query: 'test query' };
                
                await client.query.execute(appId, query);
                
                assert(getTokenStub.calledOnce);
                assert.strictEqual(getTokenStub.firstCall.args[0], 'https://api.applicationinsights.io');
            } finally {
                sinon.restore();
            }
        });
        
        it('makes POST request to correct endpoint', async function() {
            const axios = require('axios');
            
            let capturedConfig = null;
            const mockPost = sinon.stub().resolves({ data: { tables: [] } });
            sinon.stub(axios, 'create').callsFake((config) => {
                capturedConfig = config;
                return {
                    post: mockPost
                };
            });
            const client = new ApplicationInsightsQueryClient(mockCredentials);
            
            try {
                const appId = 'test-app-id-123';
                const query = { query: 'test query' };
                
                await client.query.execute(appId, query);
                
                assert(capturedConfig.baseURL === 'https://api.applicationinsights.io');
                assert(mockPost.calledOnce);
                const callPath = mockPost.firstCall.args[0];
                assert.strictEqual(callPath, '/v1/apps/test-app-id-123/query');
            } finally {
                sinon.restore();
            }
        });
        
        it('includes Authorization header with bearer token', async function() {
            const axios = require('axios');
            
            let capturedConfig = null;
            let mockPost;
            sinon.stub(axios, 'create').callsFake((config) => {
                capturedConfig = config;
                mockPost = sinon.stub().resolves({ data: { tables: [] } });
                return {
                    post: mockPost
                };
            });
            const client = new ApplicationInsightsQueryClient(mockCredentials);
            
            try {
                const appId = 'test-app-id';
                const query = { query: 'test query' };
                
                await client.query.execute(appId, query);
                
                assert.strictEqual(capturedConfig.headers['Content-Type'], 'application/json');
                assert(mockPost.calledOnce);
                const requestConfig = mockPost.firstCall.args[2];
                assert.strictEqual(requestConfig.headers.Authorization, 'Bearer test-bearer-token');
            } finally {
                sinon.restore();
            }
        });
        
        it('resolves with parsed JSON response', async function() {
            const axios = require('axios');
            
            const responseData = { 
                tables: [{ 
                    name: 'test', 
                    rows: [['data1', 'data2']] 
                }] 
            };
            
            sinon.stub(axios, 'create').returns({
                post: sinon.stub().resolves({ data: responseData })
            });
            const client = new ApplicationInsightsQueryClient(mockCredentials);
            
            try {
                const appId = 'test-app-id';
                const query = { query: 'test query' };
                
                const result = await client.query.execute(appId, query);
                
                assert.deepStrictEqual(result, responseData);
            } finally {
                sinon.restore();
            }
        });
        
        it('rejects on network error', async function() {
            const axios = require('axios');
            
            const networkError = new Error('Network timeout');
            networkError.request = true;
            
            sinon.stub(axios, 'create').returns({
                post: sinon.stub().rejects(networkError)
            });
            const client = new ApplicationInsightsQueryClient(mockCredentials);
            
            try {
                const appId = 'test-app-id';
                const query = { query: 'test query' };
                
                try {
                    await client.query.execute(appId, query);
                    assert.fail('Should have thrown an error');
                } catch (e) {
                    assert(e.message.includes('Application Insights query failed'));
                    assert(e.message.includes('Network timeout'));
                }
            } finally {
                sinon.restore();
            }
        });
        
        it('rejects on API error response', async function() {
            const axios = require('axios');
            
            const apiError = new Error('Bad Request');
            apiError.response = {
                status: 400,
                statusText: 'Bad Request'
            };
            
            sinon.stub(axios, 'create').returns({
                post: sinon.stub().rejects(apiError)
            });
            const client = new ApplicationInsightsQueryClient(mockCredentials);
            
            try {
                const appId = 'test-app-id';
                const query = { query: 'test query' };
                
                try {
                    await client.query.execute(appId, query);
                    assert.fail('Should have thrown an error');
                } catch (e) {
                    assert(e.message.includes('Application Insights API error'));
                    assert(e.message.includes('400'));
                    assert(e.message.includes('Bad Request'));
                }
            } finally {
                sinon.restore();
            }
        });
        
        it('sends stringified query in request body', async function() {
            const axios = require('axios');
            
            const mockPost = sinon.stub().resolves({ data: {} });
            sinon.stub(axios, 'create').returns({
                post: mockPost
            });
            const client = new ApplicationInsightsQueryClient(mockCredentials);
            
            try {
                const appId = 'test-app-id';
                const query = { query: 'test query', timespan: 'PT1H' };
                
                await client.query.execute(appId, query);
                
                assert(mockPost.calledOnce);
                const sentData = mockPost.firstCall.args[1];
                assert.deepStrictEqual(sentData, query);
            } finally {
                sinon.restore();
            }
        });
    });
});
