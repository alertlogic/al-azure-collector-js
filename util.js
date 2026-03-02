/* -----------------------------------------------------------------------------
 * @copyright (C) 2018, Alert Logic, Inc
 * @doc
 * 
 * Helpers for collectors.
 * 
 * @end
 * -----------------------------------------------------------------------------
 */
 
const path = require('path');
/**
 *  @function
 *  returns Azure token cache filename.
 *  
 *  @param {String} [resource] - Azure resource URI.
 *  @param {String} [clientId] - (optional) Azure client id. Default is process.env.CUSTOMCONNSTR_APP_CLIENT_ID
 *  @param {String} [tenantId] - (optional) Azure AD id. Default is process.env.APP_TENANT_ID
 *  
 *  @return {String} - Azure token cache filename
 */
const getADCacheFilename = function (resource, clientId, tenantId) {
    var cId = clientId ? clientId : process.env.CUSTOMCONNSTR_APP_CLIENT_ID;
    var tId = tenantId ? tenantId : process.env.APP_TENANT_ID;
    return path.join(process.env.TMP,
        encodeURIComponent(cId) + '-' +
        encodeURIComponent(tId) + '-' +
        encodeURIComponent(resource) + '-token.tmp');
}

/**
 *  @function
 *  checks if expected key/value properties are present in Object
 *  
 *  @param {Object} obj - target JSON object where to check expected properties.
 *  @param {Object} expectedProps - JSON object that contains expected property keys and values.
 *  
 *  @return false - all expected key:value pairs are present in the object.
 *      | {Object} - the first unexpected key-value. The actual value is returned from the object.
 */
const verifyObjProps = function (obj, expectedProps) {
    var expectedKeys = Object.keys(expectedProps);
    
    for (let k of expectedKeys) {
        if (obj[k] !== expectedProps[k]) {
            var retObj = {};
            retObj[k] = obj[k];
            return retObj;
        }
    }
    return false;
}

 const getAppSettings = async function (azureClientObject) {
        return azureClientObject.azureWebsiteClient.webApps.listApplicationSettings(
            azureClientObject.resourceGroup, azureClientObject.webAppName, null
        );
    }

 const setAppSettings = async function (settings, azureClientObject) {
        await azureClientObject.azureWebsiteClient.webApps.updateApplicationSettings(
            azureClientObject.resourceGroup, azureClientObject.webAppName, settings, null
        );
    }
   
 const updateAppSettings = async function (newSettings, azureClientObject) {
     const appSettings = await getAppSettings(azureClientObject);
     var updatedProps = Object.assign({}, appSettings.properties, newSettings);
     var updatedEnv = Object.assign({}, process.env, newSettings);
     process.env = updatedEnv;
     appSettings.properties = updatedProps;
     await setAppSettings(appSettings, azureClientObject);
 }

/**
 * Helper function to ensure connection string includes EndpointSuffix for backward compatibility
 * @param {String} connectionString - Azure storage connection string
 * @return {String} connection string with EndpointSuffix
 */
const ensureEndpointSuffix = function(connectionString) {
    if (!connectionString) {
        return connectionString;
    }
    // Check if EndpointSuffix already exists
    if (connectionString.includes('EndpointSuffix')) {
        return connectionString;
    }
    // Add EndpointSuffix for public Azure cloud
    return connectionString + ';EndpointSuffix=core.windows.net';
};



module.exports = {
        getADCacheFilename: getADCacheFilename,
        verifyObjProps: verifyObjProps,
        updateAppSettings: updateAppSettings,
        getAppSettings: getAppSettings,
        setAppSettings: setAppSettings,
        ensureEndpointSuffix: ensureEndpointSuffix

};
