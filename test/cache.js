'use strict'

var assert = require('chai').assert
var sinon = require('sinon')
var cache = require('../cache')

describe('cache', function () {
  describe('handleCache', function () {
    var cacheTestMethod
    var failCase = new Error('Kaaahhhhnnnn')
    beforeEach(function () {
      cacheTestMethod = sinon.stub()
      cacheTestMethod
        .onFirstCall().yields(null, 'first')
        .onSecondCall().yields(failCase)
      process.env.SWARMERODE_CACHE_LENGTH = 10000
    })

    afterEach(function () {
      delete process.env.SWARMERODE_CACHE_LENGTH
    })

    it('should cache the method', function (done) {
      var count = 0
      var cbTracker = sinon.stub()
      function cb (err, data) {
        cbTracker(err, data)
        count++
        if (count === 2) {
          sinon.assert.calledTwice(cbTracker)
          sinon.assert.calledWith(cbTracker, null, 'first')
          sinon.assert.neverCalledWith(cbTracker, failCase)
          sinon.assert.calledOnce(cacheTestMethod)
          done()
        }
      }
      cache.handleCache('cacheTest', cacheTestMethod, cb)
      cache.handleCache('cacheTest', cacheTestMethod, cb)
    })

    it('should not cache methods if no cache defined', function (done) {
      delete process.env.SWARMERODE_CACHE_LENGTH
      var count = 0
      var cbTracker = sinon.stub()
      function cb (err, data) {
        cbTracker(err, data)
        count++
        if (count === 2) {
          sinon.assert.calledTwice(cbTracker)
          sinon.assert.calledWith(cbTracker, null, 'first')
          sinon.assert.calledWith(cbTracker, failCase)
          sinon.assert.calledTwice(cacheTestMethod)
          done()
        }
      }
      cache.handleCache('cacheTest', cacheTestMethod, cb)
      cache.handleCache('cacheTest', cacheTestMethod, cb)
    })

    it('should expire the cache', function (done) {
      process.env.SWARMERODE_CACHE_LENGTH = 10
      var count = 0
      var cbTracker = sinon.stub()
      function cb (err, data) {
        cbTracker(err, data)
        count++
        if (count === 3) {
          sinon.assert.calledThrice(cbTracker)
          sinon.assert.calledWith(cbTracker, null, 'first')
          assert.equal(cbTracker.lastCall.args[0].message, failCase.message)
          sinon.assert.calledTwice(cacheTestMethod)
          done()
        }
      }
      cache.handleCache('cacheTest2', cacheTestMethod, cb)
      cache.handleCache('cacheTest2', cacheTestMethod, cb)
      setTimeout(function () {
        cache.handleCache('cacheTest2', cacheTestMethod, cb)
      }, 100)
    })
  })
})

