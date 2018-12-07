/* -----------------------------------------------------------------------------
 * @copyright (C) 2018, Alert Logic, Inc
 * @doc
 *
 * Tests for collector utils.
 *
 * @end
 * -----------------------------------------------------------------------------
 */
const assert = require('assert');
const sinon = require('sinon');

const mock = require('./mock');
const m_util = require('../util');

describe('Util tests', function() {
    before(function(){
    });
    after(function(){
    });

    it('verifyObjProps', function(done) {
        var obj = {
            a: '1',
            b: '2',
            c: '3'
        };
        
        assert.equal(false, m_util.verifyObjProps(obj, {a: '1'}));
        assert.deepEqual({a: '1'}, m_util.verifyObjProps(obj, {a: '2'}));
        assert.deepEqual({d: undefined}, m_util.verifyObjProps(obj, {d: '2'}));
        done();
    });

});


