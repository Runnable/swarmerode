'use strict'

var assert = require('chai').assert
var sinon = require('sinon')
var request = require('request')

var Consul = require('../consul')

describe('Consul', function () {
  var mockRes = { statusCode: 200 }
  var mockBody = JSON.stringify([{ Value: 'bW9ja1ZhbHVl' }])

  beforeEach(function () {
    sinon.stub(request, 'get').yieldsAsync(null, mockRes, mockBody)
  })

  afterEach(function () {
    request.get.restore()
  })

  describe('_makeRequest', function () {
    it('shoud reach out to a url', function (done) {
      Consul._makeRequest('mockUrl', function (err, body) {
        assert.isNull(err)
        sinon.assert.calledOnce(request.get)
        sinon.assert.calledWithExactly(
          request.get,
          'mockUrl',
          {},
          sinon.match.func
        )
        done()
      })
    })

    it('should pass through any error', function (done) {
      var error = new Error('yup')
      request.get.yieldsAsync(error)
      Consul._makeRequest('mockUrl', function (err) {
        assert.equal(err, error)
        done()
      })
    })

    it('should decode values', function (done) {
      Consul._makeRequest('mockUrl', function (err, body) {
        assert.isNull(err)
        assert.equal(body[0].Value, 'mockValue')
        done()
      })
    })
  })

  describe('_getRecursiveKV', function (done) {
    var mockParedBody = [{ Value: 'mockValue' }]
    beforeEach(function () {
      sinon.stub(Consul, '_makeRequest').yieldsAsync(null, mockParedBody)
    })

    afterEach(function () {
      Consul._makeRequest.restore()
    })

    it('should call _makeRequest with a correct url', function (done) {
      Consul._getRecursiveKV('my/prefix/', function (err, values) {
        assert.isNull(err)
        sinon.assert.calledWithExactly(
          Consul._makeRequest,
          sinon.match(/.+my\/prefix\/.+recurse=true$/),
          sinon.match.func
        )
        assert.equal(values, mockParedBody)
        done()
      })
    })
  })

  describe('getSwarmNodes', function (done) {
    var mockParedBody = [{ Key: 'swarm/docker/swarm/nodes/mockValue' }]
    beforeEach(function () {
      sinon.stub(Consul, '_getRecursiveKV').yieldsAsync(null, mockParedBody)
    })

    afterEach(function () {
      Consul._getRecursiveKV.restore()
    })

    it('should get the nodes', function (done) {
      Consul.getSwarmNodes(function (err, nodes) {
        assert.isNull(err)
        assert.lengthOf(nodes, 1)
        assert.equal(nodes[0], 'mockValue')
        done()
      })
    })

    it('should pass through any error', function (done) {
      var error = new Error('robot')
      Consul._getRecursiveKV.yieldsAsync(error)
      Consul.getSwarmNodes(function (err, nodes) {
        assert.equal(err, error)
        done()
      })
    })
  })
})
