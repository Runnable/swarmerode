'use strict'

var sinon = require('sinon')
var cache = require('../cache')

describe('cache', function () {
  describe('handleCache', function () {
    var cacheTestMethod
    beforeEach(function () {
      cacheTestMethod = sinon.stub()
      cacheTestMethod
        .onFirstCall().yields(null, 'first')
        .onSecondCall().yields(null, 'second')
      process.env.SWARMERODE_CACHE_LENGTH = 10000
    })

    afterEach(function () {
      delete process.env.SWARMERODE_CACHE_LENGTH
    })

    it('should cache the method', function (done) {
      var count = 0;
      function cb () {
        count++
        if (count == 2) {
          sinon.assert.calledTwice(cb)
          sinon.assert.calledWith(cb, null, 'first')
          sinon.assert.calledWith(cb, null, 'first')
          sinon.assert.calledOnce(cacheTestMethod)
          done()
        }
      }
      cb = sinon.spy(cb)
      cache.handleCache('cacheTest', cacheTestMethod, cb)
      cache.handleCache('cacheTest', cacheTestMethod, cb)
    })

    it('should not cache methods if no cache defined', function (done) {
      delete process.env.SWARMERODE_CACHE_LENGTH
      var count = 0;
      function cb () {
        count++
        if (count == 2) {
          sinon.assert.calledTwice(cb)
          sinon.assert.calledWith(cb, null, 'first')
          sinon.assert.calledWith(cb, null, 'second')
          sinon.assert.calledTwice(cacheTestMethod)
          done()
        }
      }
      cb = sinon.spy(cb)
      cache.handleCache('cacheTest', cacheTestMethod, cb)
      cache.handleCache('cacheTest', cacheTestMethod, cb)
    })
  })
})

