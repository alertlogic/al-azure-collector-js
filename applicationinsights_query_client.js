/* -----------------------------------------------------------------------------
 * @copyright (C) 2026, Alert Logic, Inc
 * @doc
 *
 * Custom Application Insights query client to replace vulnerable @azure/applicationinsights-query.
 * Provides direct HTTPS API access using axios and @azure/identity credentials.
 *
 * @end
 * -----------------------------------------------------------------------------
 */

const axios = require('axios');

// Configuration constants
const API_TIMEOUT_MS = 30000;              // 30 second timeout for Application Insights API calls
const BASE_URL = "https://api.applicationinsights.io"; // BASE_URLfor Application Insights API
/**
 * Custom Application Insights query client to replace vulnerable @azure/applicationinsights-query.
 * Maintains API compatibility with the original SDK while using axios for HTTP requests.
 */
class ApplicationInsightsQueryClient {
    constructor(tokenCredentials, options = {}) {
        this.tokenCredentials = tokenCredentials;
        this.subscriptionId = options.subscriptionId;
        this.baseUri = options.baseUri || this.baseUri || BASE_URL;
        
        // Create a persistent axios instance for connection pooling and reuse
        this.axiosInstance = axios.create({
            baseURL: this.baseUri,
            timeout: API_TIMEOUT_MS,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Create query object to match SDK interface: client.query.execute()
        this.query = {
            execute: this._executeQuery.bind(this)
        };
    }

    async _executeQuery(appId, query) {
        try {
            // Get access token from credentials
            const token = await this.tokenCredentials.getToken(this.baseUri);
            
            const postData = query;
            
            // Reuse the persistent axios instance with updated authorization header
            const response = await this.axiosInstance.post(
                `/v1/apps/${appId}/query`, 
                postData,
                {
                    headers: {
                        'Authorization': `Bearer ${token.token}`
                    }
                }
            );
            
            return response.data;
        } catch (error) {
            // Format error message for consistent error handling
            if (error?.response) {
                throw new Error(`Application Insights API error: ${error.response.status} - ${error.response.statusText}`);
            } else if (error?.request) {
                throw new Error(`Application Insights query failed: ${error.message}`);
            } else {
                throw new Error(`Failed to prepare Application Insights request: ${error.message}`);
            }
        }
    }
}

module.exports = ApplicationInsightsQueryClient;
