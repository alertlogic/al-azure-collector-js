/* -----------------------------------------------------------------------------
 * @copyright (C) 2018, Alert Logic, Inc
 * @doc
 *
 * Helper classes and function for Azure function based collectors.
 *
 * @end
 * -----------------------------------------------------------------------------
 */

module.exports = {
    Updater: require('./updater')
    Master: require('./master'),
    Collector: require('./collector'),
    Scaler: require('./scaler')
};

