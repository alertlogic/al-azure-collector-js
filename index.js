/* -----------------------------------------------------------------------------
 * @copyright (C) 2018, Alert Logic, Inc
 * @doc
 *
 * Helper classes and function for Azure function based collectors.
 *
 * @end
 * -----------------------------------------------------------------------------
 */
var exports = module.exports;

/**
 * Master exports
 * 
 */
var master = require('./master');
exports.AlAzureMaster = master.AlAzureMaster;


/**
 * Updater exports
 * 
 */
var updater = require('./updater');
exports.AlAzureUpdater = updater.AlAzureUpdater;

/**
 * Collector exports
 * 
 */
var collector = require('./collector');
exports.AlAzureCollector = collector.AlAzureCollector;

