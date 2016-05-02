'use strict'

var assert = require('chai').assert
var sinon = require('sinon')
var request = require('request')

var Consul = require('../consul')

describe('Consul', function () {
  var mockRes = { statusCode: 200 }
  var mockBody = JSON.stringify([{ Value: 'bW9ja1ZhbHVl' }])
  var prevConsulHost = process.env.CONSUL_HOST
  var consul

  beforeEach(function () {
    sinon.stub(request, 'get').yieldsAsync(null, mockRes, mockBody)
    process.env.CONSUL_HOST = 'somehost'
    consul = new Consul()
  })

  afterEach(function () {
    request.get.restore()
    process.env.CONSUL_HOST = prevConsulHost
  })

  describe('constructor', function () {
    beforeEach(function () {
      delete process.env.CONSUL_HOST
    })

    it('should throw', function () {
      assert.throws(
        function () { return new Consul() }
      )
    })
  })

  describe('_makeRequest', function () {
    it('shoud reach out to a url', function (done) {
      consul._makeRequest('mockUrl', function (err, body) {
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
      consul._makeRequest('mockUrl', function (err) {
        assert.equal(err, error)
        done()
      })
    })

    it('should fail with an error if response in not a JSON', function (done) {
      request.get.yieldsAsync(null, null, 'not-a-josn')
      consul._makeRequest('mockUrl', function (err) {
        assert.equal(err.message, 'Parse Consul response error')
        done()
      })
    })

    it('should fail with an error if reposnse in not a JSON array', function (done) {
      request.get.yieldsAsync(null, null, '{"a":1}')
      consul._makeRequest('mockUrl', function (err) {
        assert.equal(err.message, 'Invalid Consul response')
        done()
      })
    })

    it('should decode values', function (done) {
      consul._makeRequest('mockUrl', function (err, body) {
        assert.isNull(err)
        assert.equal(body[0].Value, 'mockValue')
        done()
      })
    })

    it('should default empty values to emptystring', function (done) {
      request.get.yieldsAsync(null, mockRes, JSON.stringify([{}]))
      consul._makeRequest('mockUrl', function (err, body) {
        assert.isNull(err)
        assert.equal(body[0].Value, '')
        done()
      })
    })
  })

  describe('_getRecursiveKV', function (done) {
    var mockParedBody = [{ Value: 'mockValue' }]
    beforeEach(function () {
      sinon.stub(Consul.prototype, '_makeRequest').yieldsAsync(null, mockParedBody)
    })

    afterEach(function () {
      Consul.prototype._makeRequest.restore()
    })

    it('should call _makeRequest with a correct url', function (done) {
      consul._getRecursiveKV('my/prefix/', function (err, values) {
        assert.isNull(err)
        sinon.assert.calledWithExactly(
          Consul.prototype._makeRequest,
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
      sinon.stub(Consul.prototype, '_getRecursiveKV').yieldsAsync(null, mockParedBody)
    })

    afterEach(function () {
      Consul.prototype._getRecursiveKV.restore()
    })

    it('should get the nodes', function (done) {
      consul.getSwarmNodes(function (err, nodes) {
        assert.isNull(err)
        assert.lengthOf(nodes, 1)
        assert.equal(nodes[0], 'mockValue')
        done()
      })
    })

    it('should pass through any error', function (done) {
      var error = new Error('robot')
      Consul.prototype._getRecursiveKV.yieldsAsync(error)
      consul.getSwarmNodes(function (err, nodes) {
        assert.equal(err, error)
        done()
      })
    })
  })
})
