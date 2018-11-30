/* -----------------------------------------------------------------------------
 * @copyright (C) 2018, Alert Logic, Inc
 * @doc
 *
 * Scaler function base class
 *
 * @end
 * -----------------------------------------------------------------------------
 */
'use strict';


/**
 * @class
 * Base class for scaling in and out Azure resources.
 *
 * @constructor
 * @param {Object} context - context of Azure function.
 *
 */
class AlAzureScaler {
    constructor(context) {
        throw 'not implemented';
    }
};
module.exports = {
    AlAzureScaler: AlAzureScaler
};

