/* -----------------------------------------------------------------------------
 * @copyright (C) 2018, Alert Logic, Inc
 * @doc
 *
 * Predefined constants for the tests.
 *
 * @end
 * -----------------------------------------------------------------------------
 */

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

module.exports = {
    AZURE_TOKEN_MOCK: AZURE_TOKEN_MOCK,
    AL_CID: AL_CID,
    AL_KEY_ID: AL_KEY_ID,
    AL_SECRET: AL_SECRET,
    AL_TOKEN_CACHE_FILENAME: AL_TOKEN_CACHE_FILENAME,
    AL_API_ENDPOINT: AL_API_ENDPOINT,
    INGEST_API_ENDPOINT: INGEST_API_ENDPOINT,
    getAuthResp: getAuthResp
};