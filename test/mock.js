/* -----------------------------------------------------------------------------
 * @copyright (C) 2018, Alert Logic, Inc
 * @doc
 *
 * Predefined constants for the tests.
 *
 * @end
 * -----------------------------------------------------------------------------
 */

const util = require('util');


process.env.TMP = '/tmp';

const AZURE_TOKEN_MOCK = {
    'token_type' : 'Bearer',
    'expires_in' : 3599,
    'ext_expires_in' : 3599,
    'expires_on' : '1543401497',
    'not_before' :'1543401497',
    'resource' : 'https://management.azure.com',
    'access_token' :  'some-token'
};

const AL_CID = '12345678';
const AL_TOKEN_TTL = 21600; //6 hours

const AL_KEY_ID = 'key-id';
const AL_SECRET = 'secret-key';

const AL_TOKEN_CACHE_FILENAME = '/tmp/' + AL_KEY_ID + '-token.tmp';

const AL_API_ENDPOINT = 'al-api-endpoint.alertlogic.com';
const INGEST_API_ENDPOINT = 'ingest-api-endpoint.alertlogic.com';
const AZCOLLECT_API_ENDPOINT = 'azcollect-api-endpoint.alertlogic.com';

function getAzureWebApp(availabilityState = 'Normal') {
    return {
        'properties': {
            'httpsOnly': false,
            'slotSwapStatus': null,
            'defaultHostName': 'test-integration.azurewebsites.net',
            'resourceGroup': 'test-integration',
            'tags': null,
            'hostingEnvironmentId': null,
            'cloningInfo': null,
            'homeStamp': 'waws-prod-am2-035',
            'maxNumberOfWorkers': null,
            'functionExecutionUnitsCache': null,
            'siteDisabledReason': 0,
            'suspendedTill': null,
            'dailyMemoryTimeQuota': 0,
            'containerSize': 1536,
            'possibleOutboundIpAddresses': '127.0.0.1',
            'outboundIpAddresses': '127.0.0.1',
            'kind': 'functionapp',
            'domainVerificationIdentifiers': null,
            'hostNamesDisabled': false,
            'clientCertEnabled': false,
            'clientAffinityEnabled': false,
            'hostingEnvironmentProfile': null,
            'hostingEnvironment': null,
            'targetSwapSlot': null,
            'scmSiteAlsoStopped': false,
            'cers': null,
            'csrs': [],
            'sslCertificates': null,
            'availabilityState': availabilityState,
            'siteProperties': {
              'appSettings': null,
              'properties': [
                {
                  'value': '',
                  'name': 'LinuxFxVersion'
                },
                {
                  'value': null,
                  'name': 'WindowsFxVersion'
                }
              ],
              'metadata': null
            },
            'enabledHostNames': [
              'test-integration.azurewebsites.net',
              'test-integration.scm.azurewebsites.net'
            ],
            'adminEnabled': true,
            'enabled': true,
            'name': 'test-integration',
            'state': 'Running',
            'hostNames': [
              'test-integration.azurewebsites.net'
            ],
            'webSpace': 'test-integration-WestEuropewebspace',
            'selfLink': 'https://waws-prod-am2-035.api.azurewebsites.windows.net:454/subscriptions/05dcd414-c680-4f2c-8716-058cd058974b/webspaces/test-integration-WestEuropewebspace/sites/test-integration',
            'repositorySiteName': 'test-integration',
            'owner': null,
            'usageState': 'Normal',
            'siteMode': null,
            'hostNameSslStates': [
              {
                'hostType': 'Standard',
                'name': 'test-integration.azurewebsites.net',
                'sslState': 'Disabled',
                'ipBasedSslResult': null,
                'virtualIP': null,
                'thumbprint': null,
                'toUpdate': null,
                'toUpdateIpBasedSsl': null,
                'ipBasedSslState': 'NotConfigured'
              },
              {
                'hostType': 'Repository',
                'name': 'test-integration.scm.azurewebsites.net',
                'sslState': 'Disabled',
                'ipBasedSslResult': null,
                'virtualIP': null,
                'thumbprint': null,
                'toUpdate': null,
                'toUpdateIpBasedSsl': null,
                'ipBasedSslState': 'NotConfigured'
              }
            ],
            'computeMode': null,
            'serverFarm': null,
            'serverFarmId': '/subscriptions/subscr-id/resourceGroups/test-integration/providers/Microsoft.Web/serverfarms/WestEuropePlan',
            'reserved': false,
            'isXenon': false,
            'hyperV': false,
            'lastModifiedTimeUtc': '2018-10-02T16:25:27.073',
            'storageRecoveryDefaultState': 'Running',
            'contentAvailabilityState': 'Normal',
            'runtimeAvailabilityState': 'Normal',
            'siteConfig': null,
            'deploymentId': 'test-integration',
            'trafficManagerHostNames': null,
            'sku': 'Dynamic'
          },
          'location': 'West Europe',
          'kind': 'functionapp',
          'type': 'Microsoft.Web/sites',
          'name': 'test-integration',
          'id': '/subscriptions/subscr-id/resourceGroups/test-integration/providers/Microsoft.Web/sites/test-integration'
    };
}

const FAKE_INVOCATION_STATS = {
    statistics: [
        {'Master':
            {'invocations':2,'errors':0}
        },
        {'Collector':
            {'invocations':10,'errors':1}
        },
        {'Updater':
            {'invocations':0,'errors':0}
        }
    ]
};

const DEFAULT_FUNCTION_CONTEXT = {
    invocationId: 'invocation-id',
    bindings: {
    },
    log: {
        error : function() {
            return console.log('ERROR:', util.format.apply(null, arguments));
        },
        warn : function() {
            return console.log('WARNING:', util.format.apply(null, arguments));
        },
        info : function() {
            return console.log('INFO:', util.format.apply(null, arguments));
        },
        verbose : function() {
            return console.log('VERBOSE:', util.format.apply(null, arguments));
        }
    },
    done: function () {
        console.log('Test response:');
    },
    res: null
};

function getAuthResp() {
    return {
        authentication : {
            token : 'token',
            account : {
                id : AL_CID
            },
            token_expiration : Math.ceil(Date.now()/1000 + AL_TOKEN_TTL)
        }
    };
}

var COLLECTOR_INVOCATION_LOGS = {
    entries : [
      { PartitionKey: { '$': 'Edm.String', _: 'I' },
        RowKey: { '$': 'Edm.String', _: '1bcef7c9-e0c3-4728-a704-b2b4c6e0f375' },
        Timestamp: { '$': 'Edm.DateTime', _: '2017-12-22T10:05:30.666Z' },
        ArgumentsJson: { _: '{"req":"Method: POST, Uri: https://test.azurewebsites.net/api/o365/webhook","_log":null,"_binder":null,"_context":"1bcef7c9-e0c3-4728-a704-b2b4c6e0f375","_logger":null,"$return":"response"}' },
        EndTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:47.760Z' },
        FunctionInstanceHeartbeatExpiry: { '$': 'Edm.DateTime', _: '2017-12-22T10:07:45.676Z' },
        FunctionName: { _: 'O365WebHook' },
        LogOutput: { _: '' },
        StartTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:47.760Z' },
        TriggerReason: { _: 'This function was programmatically called via the host APIs.' },
        '.metadata': { etag: 'W/"datetime\'2017-12-22T10%3A05%3A30.6667953Z\'"' } },
      { PartitionKey: { '$': 'Edm.String', _: 'I' },
        RowKey: { '$': 'Edm.String', _: '1c43776f-cb79-4e80-8f62-7cc98a4798e5' },
        Timestamp: { '$': 'Edm.DateTime', _: '2017-12-22T10:05:30.709Z' },
        ArgumentsJson: { _: '{"req":"Method: POST, Uri: https://test.azurewebsites.net/api/o365/webhook","_log":null,"_binder":null,"_context":"1c43776f-cb79-4e80-8f62-7cc98a4798e5","_logger":null,"$return":"response"}' },
        EndTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:50.657Z' },
        FunctionInstanceHeartbeatExpiry: { '$': 'Edm.DateTime', _: '2017-12-22T10:07:45.676Z' },
        FunctionName: { _: 'O365WebHook' },
        LogOutput: { _: '' },
        StartTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:50.657Z' },
        TriggerReason: { _: 'This function was programmatically called via the host APIs.' },
        '.metadata': { etag: 'W/"datetime\'2017-12-22T10%3A05%3A30.7098371Z\'"' } },
      { PartitionKey: { '$': 'Edm.String', _: 'I' },
        RowKey: { '$': 'Edm.String', _: '5d941e00-5413-45ea-932a-684e78fbfc6a' },
        Timestamp: { '$': 'Edm.DateTime', _: '2017-12-21T10:39:43.713Z' },
        ArgumentsJson: { _: '{"req":"Method: POST, Uri: https://test.azurewebsites.net/api/o365/webhook","_log":null,"_binder":null,"_context":"5d941e00-5413-45ea-932a-684e78fbfc6a","_logger":null,"$return":"response"}' },
        EndTime: { '$': 'Edm.DateTime', _: '2017-12-21T10:39:00.011Z' },
        ErrorDetails: { _: 'Unable to fetch content: O365 fetch content Error: Too many requests. Method=GetBlob, PublisherId=00000000-0000-0000-0000-000000000000' },
        FunctionInstanceHeartbeatExpiry: { '$': 'Edm.DateTime', _: '2017-12-21T10:41:58.749Z' },
        FunctionName: { _: 'O365WebHook' },
        LogOutput: { _: 'Unable to fetch content: O365 fetch content Error: Too many requests. Method=GetBlob, PublisherId=00000000-0000-0000-0000-000000000000\r\nparsedData:  [ { message_ts: 1513739921,\n    record_type: \'15\',\n    message: \'{"CreationTime":"2017-12-20T03:18:41","Id":"d405d9d9-f3b7-4c4b-bc22-b39ea7e45d26","Operation":"UserLoggedIn","OrganizationId":"bf8d32d3-1c13-4487-af02-80dba2236485","RecordType":15,"ResultStatus":"Succeeded","UserKey":"1003BFFD991C0527@alazurealertlogic.onmicrosoft.com","UserType":0,"Version":1,"Workload":"AzureActiveDirectory","ClientIP":"204.110.219.5","ObjectId":"797f4846-ba00-4fd7-ba43-dac1f8f63013","UserId":"azure_se_logcollection@alazurealertlogic.onmicrosoft.com","AzureActiveDirectoryEventType":1,"ExtendedProperties":[{"Name":"UserAuthenticationMethod","Value":"1"},{"Name":"RequestType","Value":"OAuth2:Token"},{"Name":"ResultStatusDetail","Value":"Success"}],"Actor":[{"ID":"62c77c61-11d0-47cc-9e86-a2f33c69037a","Type":0},{"ID":"azure_se_logcollection@alazurealertlogic.onmicrosoft.com","Type":5},{"ID":"1003BFFD991C0527","Type":3}],"ActorContextId":"bf8d32d3-1c13-4487-af02-80dba2236485","ActorIpAddress":"204.110.219.5","InterSystemsId":"68381b98-e142-43ae-8cf4-8c8d636a3def","IntraSystemId":"e8546ad8-ed8c-4b59-89a6-197afc2f0100","Target":[{"ID":"797f4846-ba00-4fd7-ba43-dac1f8f63013","Type":0}],"TargetContextId":"bf8d32d3-1c13-4487-af02-80dba2236485","ApplicationId":"04b07795-8ddb-461a-bbee-02f9e1bf7b46"}\' } ]\r\nparsedData:  [ { message_ts: 1513666223,\n    record_type: \'15\',\n    message: \'{"CreationTime":"2017-12-19T06:50:23","Id":"72253d17-6292-4c2e-8eb7-85506e78d4f7","Operation":"UserLoginFailed","OrganizationId":"bf8d32d3-1c13-4487-af02-80dba2236485","RecordType":15,"ResultStatus":"Failed","UserKey":"Not Available","UserType":0,"Version":1,"Workload":"AzureActiveDirectory","ClientIP":"204.110.219.5","ObjectId":"797f4846-ba00-4fd7-ba43-dac1f8f63013","UserId":"testuser@alazurealertlogic.onmicrosoft.com","AzureActiveDirectoryEventType":1,"ExtendedProper…' },
        StartTime: { '$': 'Edm.DateTime', _: '2017-12-21T10:38:59.386Z' },
        TriggerReason: { _: 'This function was programmatically called via the host APIs.' },
        '.metadata': { etag: 'W/"datetime\'2017-12-21T10%3A39%3A43.7137248Z\'"' } }
    ]
};

var MASTER_INVOCATION_LOGS = {
    entries : [
      { PartitionKey: { '$': 'Edm.String', _: 'I' },
        RowKey: { '$': 'Edm.String', _: '1bcef7c9-e0c3-4728-a704-b2b4c6e0f375' },
        Timestamp: { '$': 'Edm.DateTime', _: '2017-12-22T10:05:30.666Z' },
        ArgumentsJson: { _: '{"req":"Method: POST, Uri: https://test.azurewebsites.net/api/o365/webhook","_log":null,"_binder":null,"_context":"1bcef7c9-e0c3-4728-a704-b2b4c6e0f375","_logger":null,"$return":"response"}' },
        EndTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:47.760Z' },
        FunctionInstanceHeartbeatExpiry: { '$': 'Edm.DateTime', _: '2017-12-22T10:07:45.676Z' },
        FunctionName: { _: 'Master' },
        LogOutput: { _: '' },
        StartTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:47.760Z' },
        TriggerReason: { _: 'This function was programmatically called via the host APIs.' },
        '.metadata': { etag: 'W/"datetime\'2017-12-22T10%3A05%3A30.6667953Z\'"' } },
      { PartitionKey: { '$': 'Edm.String', _: 'I' },
        RowKey: { '$': 'Edm.String', _: '1c43776f-cb79-4e80-8f62-7cc98a4798e5' },
        Timestamp: { '$': 'Edm.DateTime', _: '2017-12-22T10:05:30.709Z' },
        ArgumentsJson: { _: '{"req":"Method: POST, Uri: https://test.azurewebsites.net/api/o365/webhook","_log":null,"_binder":null,"_context":"1c43776f-cb79-4e80-8f62-7cc98a4798e5","_logger":null,"$return":"response"}' },
        EndTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:50.657Z' },
        ErrorDetails: { _: 'Unable to fetch content: O365 fetch content Error: Too many requests. Method=GetBlob, PublisherId=00000000-0000-0000-0000-000000000000' },
        FunctionInstanceHeartbeatExpiry: { '$': 'Edm.DateTime', _: '2017-12-22T10:07:45.676Z' },
        FunctionName: { _: 'Master' },
        LogOutput: { _: '' },
        StartTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:50.657Z' },
        TriggerReason: { _: 'This function was programmatically called via the host APIs.' },
        '.metadata': { etag: 'W/"datetime\'2017-12-22T10%3A05%3A30.7098371Z\'"' } },
      { PartitionKey: { '$': 'Edm.String', _: 'I' },
        RowKey: { '$': 'Edm.String', _: '5d941e00-5413-45ea-932a-684e78fbfc6a' },
        Timestamp: { '$': 'Edm.DateTime', _: '2017-12-21T10:39:43.713Z' },
        ArgumentsJson: { _: '{"req":"Method: POST, Uri: https://test.azurewebsites.net/api/o365/webhook","_log":null,"_binder":null,"_context":"5d941e00-5413-45ea-932a-684e78fbfc6a","_logger":null,"$return":"response"}' },
        EndTime: { '$': 'Edm.DateTime', _: '2017-12-21T10:39:00.011Z' },
        ErrorDetails: { _: 'Unable to fetch content: O365 fetch content Error: Too many requests. Method=GetBlob, PublisherId=00000000-0000-0000-0000-000000000000' },
        FunctionInstanceHeartbeatExpiry: { '$': 'Edm.DateTime', _: '2017-12-21T10:41:58.749Z' },
        FunctionName: { _: 'Master' },
        LogOutput: { _: 'Unable to fetch content: O365 fetch content Error: Too many requests. Method=GetBlob, PublisherId=00000000-0000-0000-0000-000000000000\r\nparsedData:  [ { message_ts: 1513739921,\n    record_type: \'15\',\n    message: \'{"CreationTime":"2017-12-20T03:18:41","Id":"d405d9d9-f3b7-4c4b-bc22-b39ea7e45d26","Operation":"UserLoggedIn","OrganizationId":"bf8d32d3-1c13-4487-af02-80dba2236485","RecordType":15,"ResultStatus":"Succeeded","UserKey":"1003BFFD991C0527@alazurealertlogic.onmicrosoft.com","UserType":0,"Version":1,"Workload":"AzureActiveDirectory","ClientIP":"204.110.219.5","ObjectId":"797f4846-ba00-4fd7-ba43-dac1f8f63013","UserId":"azure_se_logcollection@alazurealertlogic.onmicrosoft.com","AzureActiveDirectoryEventType":1,"ExtendedProperties":[{"Name":"UserAuthenticationMethod","Value":"1"},{"Name":"RequestType","Value":"OAuth2:Token"},{"Name":"ResultStatusDetail","Value":"Success"}],"Actor":[{"ID":"62c77c61-11d0-47cc-9e86-a2f33c69037a","Type":0},{"ID":"azure_se_logcollection@alazurealertlogic.onmicrosoft.com","Type":5},{"ID":"1003BFFD991C0527","Type":3}],"ActorContextId":"bf8d32d3-1c13-4487-af02-80dba2236485","ActorIpAddress":"204.110.219.5","InterSystemsId":"68381b98-e142-43ae-8cf4-8c8d636a3def","IntraSystemId":"e8546ad8-ed8c-4b59-89a6-197afc2f0100","Target":[{"ID":"797f4846-ba00-4fd7-ba43-dac1f8f63013","Type":0}],"TargetContextId":"bf8d32d3-1c13-4487-af02-80dba2236485","ApplicationId":"04b07795-8ddb-461a-bbee-02f9e1bf7b46"}\' } ]\r\nparsedData:  [ { message_ts: 1513666223,\n    record_type: \'15\',\n    message: \'{"CreationTime":"2017-12-19T06:50:23","Id":"72253d17-6292-4c2e-8eb7-85506e78d4f7","Operation":"UserLoginFailed","OrganizationId":"bf8d32d3-1c13-4487-af02-80dba2236485","RecordType":15,"ResultStatus":"Failed","UserKey":"Not Available","UserType":0,"Version":1,"Workload":"AzureActiveDirectory","ClientIP":"204.110.219.5","ObjectId":"797f4846-ba00-4fd7-ba43-dac1f8f63013","UserId":"testuser@alazurealertlogic.onmicrosoft.com","AzureActiveDirectoryEventType":1,"ExtendedProper…' },
        StartTime: { '$': 'Edm.DateTime', _: '2017-12-21T10:38:59.386Z' },
        TriggerReason: { _: 'This function was programmatically called via the host APIs.' },
        '.metadata': { etag: 'W/"datetime\'2017-12-21T10%3A39%3A43.7137248Z\'"' } }
    ]
};
  
var UPDATER_INVOCATION_LOGS = {
    entries : [      
      { PartitionKey: { '$': 'Edm.String', _: 'I' },
        RowKey: { '$': 'Edm.String', _: '1c43776f-cb79-4e80-8f62-7cc98a4798e5' },
        Timestamp: { '$': 'Edm.DateTime', _: '2017-12-22T10:05:30.709Z' },
        ArgumentsJson: { _: '{"req":"Method: POST, Uri: https://test.azurewebsites.net/api/o365/webhook","_log":null,"_binder":null,"_context":"1c43776f-cb79-4e80-8f62-7cc98a4798e5","_logger":null,"$return":"response"}' },
        EndTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:50.657Z' },
        FunctionInstanceHeartbeatExpiry: { '$': 'Edm.DateTime', _: '2017-12-22T10:07:45.676Z' },
        FunctionName: { _: 'Updater' },
        LogOutput: { _: '' },
        StartTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:50.657Z' },
        TriggerReason: { _: 'This function was programmatically called via the host APIs.' },
        '.metadata': { etag: 'W/"datetime\'2017-12-22T10%3A05%3A30.7098371Z\'"' } },
      { PartitionKey: { '$': 'Edm.String', _: 'I' },
        RowKey: { '$': 'Edm.String', _: '5d941e00-5413-45ea-932a-684e78fbfc6a' },
        Timestamp: { '$': 'Edm.DateTime', _: '2017-12-21T10:39:43.713Z' },
        ArgumentsJson: { _: '{"req":"Method: POST, Uri: https://test.azurewebsites.net/api/o365/webhook","_log":null,"_binder":null,"_context":"5d941e00-5413-45ea-932a-684e78fbfc6a","_logger":null,"$return":"response"}' },
        EndTime: { '$': 'Edm.DateTime', _: '2017-12-21T10:39:00.011Z' },
        ErrorDetails: { _: 'Unable to fetch content: O365 fetch content Error: Too many requests. Method=GetBlob, PublisherId=00000000-0000-0000-0000-000000000000' },
        FunctionInstanceHeartbeatExpiry: { '$': 'Edm.DateTime', _: '2017-12-21T10:41:58.749Z' },
        FunctionName: { _: 'Updater' },
        LogOutput: { _: 'Unable to fetch content: O365 fetch content Error: Too many requests. Method=GetBlob, PublisherId=00000000-0000-0000-0000-000000000000\r\nparsedData:  [ { message_ts: 1513739921,\n    record_type: \'15\',\n    message: \'{"CreationTime":"2017-12-20T03:18:41","Id":"d405d9d9-f3b7-4c4b-bc22-b39ea7e45d26","Operation":"UserLoggedIn","OrganizationId":"bf8d32d3-1c13-4487-af02-80dba2236485","RecordType":15,"ResultStatus":"Succeeded","UserKey":"1003BFFD991C0527@alazurealertlogic.onmicrosoft.com","UserType":0,"Version":1,"Workload":"AzureActiveDirectory","ClientIP":"204.110.219.5","ObjectId":"797f4846-ba00-4fd7-ba43-dac1f8f63013","UserId":"azure_se_logcollection@alazurealertlogic.onmicrosoft.com","AzureActiveDirectoryEventType":1,"ExtendedProperties":[{"Name":"UserAuthenticationMethod","Value":"1"},{"Name":"RequestType","Value":"OAuth2:Token"},{"Name":"ResultStatusDetail","Value":"Success"}],"Actor":[{"ID":"62c77c61-11d0-47cc-9e86-a2f33c69037a","Type":0},{"ID":"azure_se_logcollection@alazurealertlogic.onmicrosoft.com","Type":5},{"ID":"1003BFFD991C0527","Type":3}],"ActorContextId":"bf8d32d3-1c13-4487-af02-80dba2236485","ActorIpAddress":"204.110.219.5","InterSystemsId":"68381b98-e142-43ae-8cf4-8c8d636a3def","IntraSystemId":"e8546ad8-ed8c-4b59-89a6-197afc2f0100","Target":[{"ID":"797f4846-ba00-4fd7-ba43-dac1f8f63013","Type":0}],"TargetContextId":"bf8d32d3-1c13-4487-af02-80dba2236485","ApplicationId":"04b07795-8ddb-461a-bbee-02f9e1bf7b46"}\' } ]\r\nparsedData:  [ { message_ts: 1513666223,\n    record_type: \'15\',\n    message: \'{"CreationTime":"2017-12-19T06:50:23","Id":"72253d17-6292-4c2e-8eb7-85506e78d4f7","Operation":"UserLoginFailed","OrganizationId":"bf8d32d3-1c13-4487-af02-80dba2236485","RecordType":15,"ResultStatus":"Failed","UserKey":"Not Available","UserType":0,"Version":1,"Workload":"AzureActiveDirectory","ClientIP":"204.110.219.5","ObjectId":"797f4846-ba00-4fd7-ba43-dac1f8f63013","UserId":"testuser@alazurealertlogic.onmicrosoft.com","AzureActiveDirectoryEventType":1,"ExtendedProper…' },
        StartTime: { '$': 'Edm.DateTime', _: '2017-12-21T10:38:59.386Z' },
        TriggerReason: { _: 'This function was programmatically called via the host APIs.' },
        '.metadata': { etag: 'W/"datetime\'2017-12-21T10%3A39%3A43.7137248Z\'"' } }
    ]
};
    
module.exports = {
    AZURE_TOKEN_MOCK: AZURE_TOKEN_MOCK,
    AL_CID: AL_CID,
    AL_KEY_ID: AL_KEY_ID,
    AL_SECRET: AL_SECRET,
    AL_TOKEN_CACHE_FILENAME: AL_TOKEN_CACHE_FILENAME,
    AL_API_ENDPOINT: AL_API_ENDPOINT,
    INGEST_API_ENDPOINT: INGEST_API_ENDPOINT,
    AZCOLLECT_API_ENDPOINT: AZCOLLECT_API_ENDPOINT,
    DEFAULT_FUNCTION_CONTEXT: DEFAULT_FUNCTION_CONTEXT,
    FAKE_INVOCATION_STATS: FAKE_INVOCATION_STATS,
    COLLECTOR_INVOCATION_LOGS: COLLECTOR_INVOCATION_LOGS,
    MASTER_INVOCATION_LOGS: MASTER_INVOCATION_LOGS,
    UPDATER_INVOCATION_LOGS: UPDATER_INVOCATION_LOGS,
    getAzureWebApp: getAzureWebApp,
    getAuthResp: getAuthResp
};