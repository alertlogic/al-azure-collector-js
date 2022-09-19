/* -----------------------------------------------------------------------------
 * @copyright (C) 2018, Alert Logic, Inc
 * @doc
 *
 * Updater function helpers
 *
 * @end
 * -----------------------------------------------------------------------------
 */
'use strict';

const { WebSiteManagementClient } = require('@azure/arm-appservice');
const { MSIAppServiceTokenCredentials, ApplicationTokenCredentials } = require('@azure/ms-rest-nodeauth');
const WebSiteManagement = require('@azure/arm-appservice');
const async = require('async');
/**
 * @class
 * Helper class for Updater function.
 *
 * @constructor
 * @param {Object} azureOptional - optional Azure parameters.
 * @param {String} [azureOptional.clientId] - (optional) Application (client) ID. Default is process.env.CUSTOMCONNSTR_APP_CLIENT_ID
 * @param {String} [azureOptional.domain] - (optional) Directory (tenant) ID. Default is process.env.APP_TENANT_ID
 * @param {String} [azureOptional.clientSecret] - (optional) Application (client) secret. Default is process.env.CUSTOMCONNSTR_APP_CLIENT_SECRET
 * @param {String} [azureOptional.subscriptionId] - (optional) Azure subscription ID. Default is process.env.APP_SUBSCRIPTION_ID
 * @param {String} [azureOptional.resourceGroup] - (optional) Azure resource group where the function is deployed. Default is process.env.APP_RESOURCE_GROUP
 * @param {String} [azureOptional.webAppName] - (optional) Azure web application name Update is running for. Default is process.env.WEBSITE_SITE_NAME
 *
 */
class AlAzureUpdater {
    constructor({ clientId, domain, clientSecret, subscriptionId, resourceGroup, webAppName } = {}) {
        this._clientId = clientId ? clientId : process.env.CUSTOMCONNSTR_APP_CLIENT_ID;
        this._domain = domain ? domain : process.env.APP_TENANT_ID;
        this._clientSecret = clientSecret ? clientSecret : process.env.CUSTOMCONNSTR_APP_CLIENT_SECRET;
        this._subscriptionId = subscriptionId ? subscriptionId : process.env.APP_SUBSCRIPTION_ID;
        this._resourceGroup = resourceGroup ? resourceGroup : process.env.APP_RESOURCE_GROUP;
        this._webAppName = webAppName ? webAppName : process.env.WEBSITE_SITE_NAME;
        this._azureWebsiteClient = new WebSiteManagementClient(this._getAzureCredentials(), this._subscriptionId);

    }

    _getAzureCredentials() {
        if (process.env.MSI_ENDPOINT && process.env.MSI_SECRET) {
            const options = {
                msiEndpoint: process.env.MSI_ENDPOINT,
                msiSecret: process.env.MSI_SECRET,
            };
            return new MSIAppServiceTokenCredentials(options);
        } else {
            return new ApplicationTokenCredentials(this._clientId, this._domain, this._clientSecret);
        }
    }

    syncWebApp(callback) {
        const credentials = this._getAzureCredentials();
        const webSiteClient = new WebSiteManagementClient(credentials, this._subscriptionId);
        return webSiteClient.webApps.syncRepository(this._resourceGroup, this._webAppName, callback);
    }

    setEnvForMigration(envObject, callback) {
        if (process.env.FUNCTIONS_EXTENSION_VERSION) {
            var updateEnv = envObject;
            this.updateAppSettings(updateEnv, function (settingsError) {
                if (settingsError) {
                    return callback(settingsError);
                } else {
                    return callback(null);
                }
            });
        }
    }

    getAppSettings(callback) {
        return this._azureWebsiteClient.webApps.listApplicationSettings(
            this._resourceGroup, this._webAppName, null,
            function (err, result, request, response) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(null, result);
                }
            });
    }

    setAppSettings(settings, callback) {
        this._azureWebsiteClient.webApps.updateApplicationSettings(
            this._resourceGroup, this._webAppName, settings, null,
            function (err, result, request, response) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(null);
                }
            });
    }

    updateAppSettings(newSettings, callback) {
        let updater = this;
        async.waterfall([
            function (callback) {
                return updater.getAppSettings(callback);
            },
            function (appSettings, callback) {
                var updatedProps = Object.assign({}, appSettings.properties, newSettings);
                var updatedEnv = Object.assign({}, process.env, newSettings);
                process.env = updatedEnv;
                appSettings.properties = updatedProps;
                return updater.setAppSettings(appSettings, callback);
            }],
            callback
        );
    }


}
module.exports = {
    AlAzureUpdater: AlAzureUpdater
};