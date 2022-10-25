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
process.env.APP_STATS_QUEUE_NAME = 'alertlogic-stats';

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
const AL_FILTERJSON = '{"Filter": "test1"}';
const AL_FILTERREGEX = '^Filter.*';

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

const INVOCATION_STATS = {
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

const EMPTY_INVOCATION_STATS = {
  statistics: [
      {'Master':
          {'invocations':0,'errors':0}
      },
      {'Collector':
          {'invocations':0,'errors':0}
      },
      {'Updater':
          {'invocations':0,'errors':0}
      }
  ]
};

const CHECKIN_RESPONSE_OK = {
    id: 'checkin-source-id',
    host: {
        id: 'checkin-host-id'
    }
};

const DEFAULT_FUNCTION_CONTEXT = {
    executionContext: {
        invocationId: 'invocation-id',
    },
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

function setKustoQuery(functionName) {
  return {
    "query": `requests
    | where operation_Name =~ "${functionName}"
    | where timestamp >= ago(15m)
    | order by timestamp desc
    | where success == "True" or success == "False"
    | summarize errors = countif(success == "False"),invocations = countif(success == "True" or success == "False") by operation_Name
    | extend details = pack_all()
    | summarize Result = make_list(details)`
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

var COLLECTOR_INVOCATION_LOGS_CONTD = {
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
        '.metadata': { etag: 'W/"datetime\'2017-12-22T10%3A05%3A30.6667953Z\'"' }
      }
    ],
    continuationToken: 'cont-token'
};

var COLLECTOR_INVOCATION_FILTERJSON_LOGS = [
  { PartitionKey: { '$': 'Edm.String', _: 'I' },
    RowKey: { '$': 'Edm.String', _: '1bcef7c9-e0c3-4728-a704-b2b4c6e0f375' },
    Timestamp: { '$': 'Edm.DateTime', _: '2017-12-22T10:05:30.666Z' },
    ArgumentsJson: { _: '{"req":"Method: POST, Uri: https://test.azurewebsites.net/api/o365/webhook","_log":null,"_binder":null,"_context":"1bcef7c9-e0c3-4728-a704-b2b4c6e0f375","_logger":null,"$return":"response"}' },
    EndTime: { '$': 'Edm.DateTime', _: '2017-12-22T10:04:47.760Z' },
    FunctionInstanceHeartbeatExpiry: { '$': 'Edm.DateTime', _: '2017-12-22T10:07:45.676Z' },
    FunctionName: { _: 'O365WebHook' },
    Filter: 'test1',
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
];

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

var APPINSIGHTS_MASTER_INVOCATION_LOGS = {
  "Master": {
    "invocations": 5,
    "errors": 3
  }
};

var APPINSIGHTS_COLLECTOR_INVOCATION_LOGS = {
  "Collector": {
    "invocations": 50,
    "errors": 5
  }
};

var APPINSIGHTS_UPDATER_INVOCATION_LOGS = {
  "Updater": {
    "invocations": 15,
    "errors": 10
  }
};

var UNPARSED_APPINSIGHTS_UPDATER_INVOCATION_LOGS = {
  "tables": [
      {
          "name": "PrimaryResult",
          "columns": [
              {
                  "name": "Result",
                  "type": "dynamic"
              }
          ],
          "rows": [
              [
                  "[{\"operation_Name\":\"Updater\",\"errors\":10,\"invocations\":15}]"
              ]
          ]
      }
  ]
};

var UNPARSED_APPINSIGHTS_COLLECTOR_INVOCATION_LOGS = {
  "tables": [
      {
          "name": "PrimaryResult",
          "columns": [
              {
                  "name": "Result",
                  "type": "dynamic"
              }
          ],
          "rows": [
              [
                  "[{\"operation_Name\":\"Collector\",\"errors\":5,\"invocations\":50}]"
              ]
          ]
      }
  ]
};

var UNPARSED_APPINSIGHTS_MASTER_INVOCATION_LOGS = {
  "tables": [
      {
          "name": "PrimaryResult",
          "columns": [
              {
                  "name": "Result",
                  "type": "dynamic"
              }
          ],
          "rows": [
              [
                  "[{\"operation_Name\":\"Master\",\"errors\":3,\"invocations\":5}]"
              ]
          ]
      }
  ]
};

var UPDATER_INVOCATION_LOGS_CONTD = {
        continuationToken: 'cont-token',
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

var statsQueueMetadataHeaders = function(approxNumOfMessages = '0') {
    return [ 'Cache-Control',
        'no-cache',
        'Content-Length',
        '0',
        'Server',
        'Windows-Azure-Queue/1.0 Microsoft-HTTPAPI/2.0',
        'x-ms-request-id',
        '998e5a8b-6003-00b8-0bd6-dfe919000000',
        'x-ms-version',
        '2018-03-28',
        'x-ms-approximate-messages-count',
        approxNumOfMessages,
        'Date',
        'Thu, 21 Mar 2019 11:09:45 GMT' ];
};

// Contains 10 bytes and 15 events
const statsMessage = "﻿<?xml version=\"1.0\" encoding=\"utf-8\"?><QueueMessagesList><QueueMessage><MessageId>3b6915a7-373f-42ae-b40c-2ab8d49bce29</MessageId><InsertionTime>Thu, 21 Mar 2019 11:09:45 GMT</InsertionTime><ExpirationTime>Thu, 28 Mar 2019 11:09:45 GMT</ExpirationTime><PopReceipt>AgAAAAMAAAAAAAAAo1dBStff1AE=</PopReceipt><TimeNextVisible>Thu, 21 Mar 2019 11:14:45 GMT</TimeNextVisible><DequeueCount>1</DequeueCount><MessageText>{&amp;quot;invocationId&amp;quot;:&amp;quot;invocation-id&amp;quot;,&amp;quot;type&amp;quot;:1,&amp;quot;bytes&amp;quot;:10,&amp;quot;events&amp;quot;:15}</MessageText></QueueMessage></QueueMessagesList>";

// Consists of two messages with 10 bytes and 15 events each. Total 20 bytes and 30 events
const statsMessages = "﻿<?xml version=\"1.0\" encoding=\"utf-8\"?><QueueMessagesList><QueueMessage><MessageId>3b6915a7-373f-42ae-b40c-2ab8d49bce29</MessageId><InsertionTime>Thu, 21 Mar 2019 11:09:45 GMT</InsertionTime><ExpirationTime>Thu, 28 Mar 2019 11:09:45 GMT</ExpirationTime><PopReceipt>AgAAAAMAAAAAAAAAo1dBStff1AE=</PopReceipt><TimeNextVisible>Thu, 21 Mar 2019 11:14:45 GMT</TimeNextVisible><DequeueCount>1</DequeueCount><MessageText>{&amp;quot;invocationId&amp;quot;:&amp;quot;invocation-id&amp;quot;,&amp;quot;type&amp;quot;:1,&amp;quot;bytes&amp;quot;:10,&amp;quot;events&amp;quot;:15}</MessageText></QueueMessage><QueueMessage><MessageId>3b6915a7-373f-42ae-b40c-2ab8d49bce29</MessageId><InsertionTime>Thu, 21 Mar 2019 11:09:45 GMT</InsertionTime><ExpirationTime>Thu, 28 Mar 2019 11:09:45 GMT</ExpirationTime><PopReceipt>AgAAAAMAAAAAAAAAo1dBStff1AE=</PopReceipt><TimeNextVisible>Thu, 21 Mar 2019 11:14:45 GMT</TimeNextVisible><DequeueCount>1</DequeueCount><MessageText>{&amp;quot;invocationId&amp;quot;:&amp;quot;invocation-id&amp;quot;,&amp;quot;type&amp;quot;:1,&amp;quot;bytes&amp;quot;:10,&amp;quot;events&amp;quot;:15}</MessageText></QueueMessage></QueueMessagesList>";

const statsQueue403 = "﻿<?xml version=\"1.0\" encoding=\"utf-8\"?><Error><Code>AuthenticationFailed</Code><Message>Server failed to authenticate the request. Make sure the value of Authorization header is formed correctly including the signature.\nRequestId:e3304c9c-b003-0012-72e8-e2c90f000000\nTime:2019-03-25T08:52:07.6793162Z</Message><AuthenticationErrorDetail>Request date header too old: 'Thu, 01 Jan 1970 00:00:00 GMT'</AuthenticationErrorDetail></Error>";
const statsQueue403Headers = [ 'Content-Length',
    '435',
    'Content-Type',
    'application/xml',
    'Server',
    'Microsoft-HTTPAPI/2.0',
    'x-ms-request-id',
    'e3304c9c-b003-0012-72e8-e2c90f000000',
    'x-ms-error-code',
    'AuthenticationFailed',
    'Date',
    'Mon, 25 Mar 2019 08:52:07 GMT' ];

const statsQueue404 = "﻿<?xml version=\"1.0\" encoding=\"utf-8\"?><Error><Code>QueueNotFound</Code><Message>The specified queue does not exist.\nRequestId:08c66f19-b003-0060-6fee-e2ce40000000\nTime:2019-03-25T09:38:08.2935978Z</Message></Error>";
const statsQueue404Headers = [ 'Content-Length',
    '217',
    'Content-Type',
    'application/xml',
    'Server',
    'Windows-Azure-Queue/1.0 Microsoft-HTTPAPI/2.0',
    'x-ms-request-id',
    '08c66f19-b003-0060-6fee-e2ce40000000',
    'x-ms-version',
    '2018-03-28',
    'x-ms-error-code',
    'QueueNotFound',
    'Date',
    'Mon, 25 Mar 2019 09:38:07 GMT' ];

const LIST_CONTAINER_BLOBS = function(blobName = 'kktestdl/ehubgeneral/2019-01-23T15-53-09Z') {
    return "<?xml version=\"1.0\" encoding=\"utf-8\"?><EnumerationResults ServiceEndpoint=\"https://kktestdl.blob.core.windows.net/\" ContainerName=\"alertlogic-dl\"><Prefix>kktestdl</Prefix><MaxResults>100</MaxResults><Blobs><Blob><Name>kktestdl/ehubgeneral/2019-01-23T15-53-06Z</Name><Properties><Creation-Time>Wed, 23 Jan 2019 15:53:09 GMT</Creation-Time><Last-Modified>Wed, 23 Jan 2019 15:53:09 GMT</Last-Modified><Etag>0x8D6814ADF284F6B</Etag><Content-Length>2224</Content-Length><Content-Type>application/octet-stream</Content-Type><Content-Encoding /><Content-Language /><Content-MD5>awDMbdCbE2Ug/pjWSIIaxg==</Content-MD5><Cache-Control /><Content-Disposition /><BlobType>BlockBlob</BlobType><LeaseStatus>unlocked</LeaseStatus><LeaseState>available</LeaseState><ServerEncrypted>true</ServerEncrypted></Properties></Blob><Blob><Name>" + blobName + "</Name><Properties><Creation-Time>Wed, 23 Jan 2019 15:53:09 GMT</Creation-Time><Last-Modified>Wed, 23 Jan 2019 15:53:09 GMT</Last-Modified><Etag>0x8D6814ADF282853</Etag><Content-Length>4121</Content-Length><Content-Type>application/octet-stream</Content-Type><Content-Encoding /><Content-Language /><Content-MD5>QtJ4ADhiTaTaXiBVqf9jcQ==</Content-MD5><Cache-Control /><Content-Disposition /><BlobType>BlockBlob</BlobType><LeaseStatus>unlocked</LeaseStatus><LeaseState>available</LeaseState><ServerEncrypted>true</ServerEncrypted></Properties></Blob><Blob><Name>kktestdl/ehubgeneral/2019-01-23T15-53-14Z</Name><Properties><Creation-Time>Wed, 23 Jan 2019 15:53:15 GMT</Creation-Time><Last-Modified>Wed, 23 Jan 2019 15:53:15 GMT</Last-Modified><Etag>0x8D6814AE2F971D2</Etag><Content-Length>2127</Content-Length><Content-Type>application/octet-stream</Content-Type><Content-Encoding /><Content-Language /><Content-MD5>5O/1TeQD6wJd+ZrL4e8Stw==</Content-MD5><Cache-Control /><Content-Disposition /><BlobType>BlockBlob</BlobType><LeaseStatus>unlocked</LeaseStatus><LeaseState>available</LeaseState><ServerEncrypted>true</ServerEncrypted></Properties></Blob><Blob><Name>kktestdl/ehubgeneral/2019-01-23T15-56-35Z</Name><Properties><Creation-Time>Wed, 23 Jan 2019 15:56:35 GMT</Creation-Time><Last-Modified>Wed, 23 Jan 2019 15:56:35 GMT</Last-Modified><Etag>0x8D6814B5A562BE6</Etag><Content-Length>4257</Content-Length><Content-Type>application/octet-stream</Content-Type><Content-Encoding /><Content-Language /><Content-MD5>3Y2UHwlL2FrCoPzm49uwJA==</Content-MD5><Cache-Control /><Content-Disposition /><BlobType>BlockBlob</BlobType><LeaseStatus>unlocked</LeaseStatus><LeaseState>available</LeaseState><ServerEncrypted>true</ServerEncrypted></Properties></Blob><Blob><Name>kktestdl/ehubgeneral/2019-01-23T15-44-58Z</Name><Properties><Creation-Time>Wed, 23 Jan 2019 15:44:58 GMT</Creation-Time><Last-Modified>Wed, 23 Jan 2019 15:44:58 GMT</Last-Modified><Etag>0x8D68149BA8F82AB</Etag><Content-Length>1193</Content-Length><Content-Type>application/octet-stream</Content-Type><Content-Encoding /><Content-Language /><Content-MD5>oUA31BVNzFFVTtqrTwBGCg==</Content-MD5><Cache-Control /><Content-Disposition /><BlobType>BlockBlob</BlobType><LeaseStatus>unlocked</LeaseStatus><LeaseState>available</LeaseState><ServerEncrypted>true</ServerEncrypted></Properties></Blob><Blob><Name>kktestdl/ehubgeneral/2019-01-23T15-45-04Z</Name><Properties><Creation-Time>Wed, 23 Jan 2019 15:45:04 GMT</Creation-Time><Last-Modified>Wed, 23 Jan 2019 15:45:04 GMT</Last-Modified><Etag>0x8D68149BE34839A</Etag><Content-Length>1193</Content-Length><Content-Type>application/octet-stream</Content-Type><Content-Encoding /><Content-Language /><Content-MD5>oUA31BVNzFFVTtqrTwBGCg==</Content-MD5><Cache-Control /><Content-Disposition /><BlobType>BlockBlob</BlobType><LeaseStatus>unlocked</LeaseStatus><LeaseState>available</LeaseState><ServerEncrypted>true</ServerEncrypted></Properties></Blob></Blobs><NextMarker /></EnumerationResults>";
};

const LIST_CONTAINER_BLOBS_EMPTY = function(blobName = 'kktestdl/ehubgeneral/2019-01-23T15-53-09Z') {
    return "<?xml version=\"1.0\" encoding=\"utf-8\"?><EnumerationResults ServiceEndpoint=\"https://kktestdl.blob.core.windows.net/\" ContainerName=\"alertlogic-dl\"><Prefix>kktestdl</Prefix><MaxResults>100</MaxResults><Blobs></Blobs><NextMarker /></EnumerationResults>";
};

const GET_BLOB_CONTENT_TEXT = [{
        "records": [
            {
              "properties": {
                "serviceRequestId": "e0a5d4a5-e4b7-4ee7-b56c-59261e237a74",
                "statusCode": "OK"
              },
              "location": "global",
              "level": "Information",
              "identity": {
                "claims": {
                  "wids": "62e90394-69f5-4237-9190-012177145e10",
                  "ver": "1.0",
                  "uti": "123",
                  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn": "kkuzmin@alazurealertlogic.onmicrosoft.com",
                  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": "kkuzmin@alazurealertlogic.onmicrosoft.com",
                  "http://schemas.microsoft.com/identity/claims/tenantid": "bf8d32d3-1c13-4487-af02-80dba2236485",
                  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": "123",
                  "http://schemas.microsoft.com/identity/claims/scope": "user_impersonation",
                  "puid": "10030000A19F1B13",
                  "http://schemas.microsoft.com/claims/authnmethodsreferences": "pwd",
                  "aio": "123",
                  "http://schemas.microsoft.com/claims/authnclassreference": "1",
                  "exp": "1548260145",
                  "nbf": "1548256245",
                  "iat": "1548256245",
                  "iss": "https://sts.windows.net/bf8d32d3-1c13-4487-af02-80dba2236485/",
                  "aud": "https://management.core.windows.net/",
                  "appid": "c44b4083-3bb0-49c1-b47d-974e53cbdf3c",
                  "appidacr": "2",
                  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname": "Kuzmin",
                  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname": "Konstantin",
                  "groups": "a8d70315-c07f-412e-a5f7-50beea4b7981",
                  "ipaddr": "165.225.81.22",
                  "name": "Konstantin Kuzmin",
                  "http://schemas.microsoft.com/identity/claims/objectidentifier": "bea5cb4c-0348-49e4-b225-8acf2623d1ea"
                },
                "authorization": {
                  "evidence": {
                    "role": "Subscription Admin"
                  },
                  "action": "Microsoft.Web/sites/config/write",
                  "scope": "/subscriptions/05dcd414-c680-4f2c-8716-058cd058974b/resourceGroups/kktestdl/providers/Microsoft.Web/sites/kktestdl/config/appSettings"
                }
              },
              "correlationId": "4fa74760-07f2-4439-9c97-ded92ce726c2",
              "time": "2019-01-23T15:36:57.079Z",
              "resourceId": "/SUBSCRIPTIONS/05DCD414-C680-4F2C-8716-058CD058974B/RESOURCEGROUPS/KKTESTDL/PROVIDERS/MICROSOFT.WEB/SITES/KKTESTDL/CONFIG/APPSETTINGS",
              "operationName": "MICROSOFT.WEB/SITES/CONFIG/WRITE",
              "category": "Write",
              "resultType": "Success",
              "resultSignature": "Succeeded.OK",
              "durationMs": 2347,
              "callerIpAddress": "165.225.81.22"
            }
          ]
        }];

const CONTAINER_NOT_FOUND = "﻿<?xml version=\"1.0\" encoding=\"utf-8\"?><Error><Code>ContainerNotFound</Code><Message>The specified container does not exist.\nRequestId:3d918968-601e-012a-452a-b7aebb000000\nTime:2019-01-28T16:59:40.0095030Z</Message></Error>";

module.exports = {
    AZURE_TOKEN_MOCK: AZURE_TOKEN_MOCK,
    AL_CID: AL_CID,
    AL_KEY_ID: AL_KEY_ID,
    AL_SECRET: AL_SECRET,
    AL_TOKEN_CACHE_FILENAME: AL_TOKEN_CACHE_FILENAME,
    AL_API_ENDPOINT: AL_API_ENDPOINT,
    AL_FILTERJSON: AL_FILTERJSON,
    AL_FILTERREGEX: AL_FILTERREGEX,
    INGEST_API_ENDPOINT: INGEST_API_ENDPOINT,
    AZCOLLECT_API_ENDPOINT: AZCOLLECT_API_ENDPOINT,
    DEFAULT_FUNCTION_CONTEXT: DEFAULT_FUNCTION_CONTEXT,
    INVOCATION_STATS: INVOCATION_STATS,
    EMPTY_INVOCATION_STATS:EMPTY_INVOCATION_STATS,
    COLLECTOR_INVOCATION_LOGS: COLLECTOR_INVOCATION_LOGS,
    COLLECTOR_INVOCATION_LOGS_CONTD: COLLECTOR_INVOCATION_LOGS_CONTD,
    COLLECTOR_INVOCATION_FILTERJSON_LOGS: COLLECTOR_INVOCATION_FILTERJSON_LOGS,
    MASTER_INVOCATION_LOGS: MASTER_INVOCATION_LOGS,
    UPDATER_INVOCATION_LOGS: UPDATER_INVOCATION_LOGS,
    UPDATER_INVOCATION_LOGS_CONTD: UPDATER_INVOCATION_LOGS_CONTD,
    APPINSIGHTS_MASTER_INVOCATION_LOGS:APPINSIGHTS_MASTER_INVOCATION_LOGS,
    APPINSIGHTS_COLLECTOR_INVOCATION_LOGS:APPINSIGHTS_COLLECTOR_INVOCATION_LOGS,
    APPINSIGHTS_UPDATER_INVOCATION_LOGS:APPINSIGHTS_UPDATER_INVOCATION_LOGS,
    UNPARSED_APPINSIGHTS_COLLECTOR_INVOCATION_LOGS:UNPARSED_APPINSIGHTS_COLLECTOR_INVOCATION_LOGS,
    UNPARSED_APPINSIGHTS_MASTER_INVOCATION_LOGS:UNPARSED_APPINSIGHTS_MASTER_INVOCATION_LOGS,
    UNPARSED_APPINSIGHTS_UPDATER_INVOCATION_LOGS:UNPARSED_APPINSIGHTS_UPDATER_INVOCATION_LOGS,
    CHECKIN_RESPONSE_OK: CHECKIN_RESPONSE_OK,
    getAzureWebApp: getAzureWebApp,
    getAuthResp: getAuthResp,
    statsQueueMetadataHeaders: statsQueueMetadataHeaders,
    statsMessage: statsMessage,
    statsMessages: statsMessages,
    statsQueue403: statsQueue403,
    statsQueue403Headers: statsQueue403Headers,
    statsQueue404: statsQueue404,
    statsQueue404Headers: statsQueue404Headers,
    setKustoQuery:setKustoQuery,
    LIST_CONTAINER_BLOBS: LIST_CONTAINER_BLOBS,
    LIST_CONTAINER_BLOBS_EMPTY: LIST_CONTAINER_BLOBS_EMPTY,
    GET_BLOB_CONTENT_TEXT: GET_BLOB_CONTENT_TEXT,
    CONTAINER_NOT_FOUND: CONTAINER_NOT_FOUND
};
