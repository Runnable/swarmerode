'use strict'

var assert = require('chai').assert
var clone = require('101/clone')
var sinon = require('sinon')

var exampleHosts = [ '10.0.0.1:4242', '10.0.0.2:4242', '10.0.0.3:4242' ]
var swarmInfoMock = require('./fixtures/swarm-info')
var testInfo = swarmInfoMock([{ host: exampleHosts[0] }, { host: exampleHosts[1] }, { host: exampleHosts[2] }])
var Swarmerode = require('../')

describe('Swarmerode', function () {
  var MockClass
  var instance
  beforeEach(function () {
    MockClass = function () {}
    MockClass.prototype.info = function (cb) { cb(null, clone(testInfo)) }
    MockClass = Swarmerode(MockClass)
    instance = new MockClass()
  })

  it('should extend a given class', function () {
    assert.isFunction(MockClass.prototype.swarmHosts)
    assert.isFunction(MockClass.prototype.swarmHostExists)
    assert.isFunction(instance.swarmHosts)
    assert.isFunction(instance.swarmHostExists)
  })

  it('should not allow being instantiate directly', function () {
    var SwarmerodeClass = Swarmerode._Swarmerode
    assert.throws(
      function () { return new SwarmerodeClass() },
      Error,
      /cannot instantiate swarmerode directly/i
    )
  })

  it('should not override existing prototype properties', function () {
    var sampleObject = { foo: 'bar' }
    var SampleClass = function () {}
    SampleClass.prototype.swarmHostExists = sampleObject
    SampleClass = Swarmerode(SampleClass)
    var sampleInstance = new SampleClass()
    assert.isObject(sampleInstance.swarmHostExists)
    assert.equal(sampleInstance.swarmHostExists, sampleObject)
  })

  it('should not override existing prototype functions', function () {
    var sampleFunction = function () {}
    var SampleClass = function () {}
    SampleClass.prototype.swarmHostExists = sampleFunction
    SampleClass = Swarmerode(SampleClass)
    var sampleInstance = new SampleClass()
    assert.isFunction(sampleInstance.swarmHostExists)
    assert.equal(sampleInstance.swarmHostExists, sampleFunction)
  })

  it('should not override existing class properties', function () {
    var sampleObject = { foo: 'bar' }
    var SampleClass = function () {}
    SampleClass.swarmHostExists = sampleObject
    SampleClass = Swarmerode(SampleClass)
    assert.isObject(SampleClass.swarmHostExists)
    assert.equal(SampleClass.swarmHostExists, sampleObject)
  })

  it('should not override existing class functions', function () {
    var sampleFunction = function () {}
    var SampleClass = function () {}
    SampleClass.swarmHostExists = sampleFunction
    SampleClass = Swarmerode(SampleClass)
    assert.isFunction(SampleClass.swarmHostExists)
    assert.equal(SampleClass.swarmHostExists, sampleFunction)
  })

  describe('swarmHosts', function () {
    it('should return any error from docker', function (done) {
      var error = new Error('robot')
      sinon.stub(MockClass.prototype, 'info').yieldsAsync(error)
      instance.swarmHosts(function (err) {
        assert.equal(err, error)
        done()
      })
    })

    it('should return a list of swarm hosts', function (done) {
      instance.swarmHosts(function (err, hosts) {
        assert.isNull(err)
        assert.lengthOf(hosts, 3)
        assert.includeMembers(hosts, exampleHosts)
        done()
      })
    })
  })

  describe('swarmHostExists', function () {
    it('should return any error from docker', function (done) {
      var error = new Error('robot')
      sinon.stub(MockClass.prototype, 'info').yieldsAsync(error)
      instance.swarmHostExists('10.0.0.1:4242', function (err) {
        assert.equal(err, error)
        done()
      })
    })

    it('should return a boolean if host in swarm (true)', function (done) {
      instance.swarmHostExists('10.0.0.1:4242', function (err, exists) {
        assert.isNull(err)
        assert.isTrue(exists)
        done()
      })
    })

    it('should return a boolean if host in swarm (false)', function (done) {
      instance.swarmHostExists('10.0.0.4:4242', function (err, exists) {
        assert.isNull(err)
        assert.isFalse(exists)
        done()
      })
    })
  })

  describe('_parseSwarmSystemStatus', function () {
    it('should format SystemStatus correctly', function (done) {
      var coolNode = {
        Labels: 'env=test, hd=ssd',
        Containers: 100,
        nodeName: 'cool.node',
        host: '10.42.42.42:4242'
      }
      var uncoolNode = {
        Labels: 'env=prod, hd=disk',
        Containers: 4,
        nodeName: 'un.cool.node',
        host: '10.7.7.7:4242'
      }
      var testHosts = swarmInfoMock([coolNode, uncoolNode])

      var out = Swarmerode._Swarmerode._parseSwarmSystemStatus(testHosts.SystemStatus)
      assert.equal(out.Role, 'primary')
      assert.equal(out.Strategy, 'spread')
      assert.equal(out.Filters, 'health, port, dependency, affinity, constraint')
      assert.isNumber(out.Nodes)
      assert.equal(out.Nodes, 2)

      assert.equal(out.ParsedNodes['cool.node'].Host, coolNode.host)
      assert.isNumber(out.ParsedNodes['cool.node'].Containers)
      assert.equal(out.ParsedNodes['cool.node'].ReservedCpus, '0 / 1')
      assert.equal(out.ParsedNodes['cool.node'].ReservedMem, '10 GiB / 1.021 GiB')
      assert.equal(out.ParsedNodes['cool.node'].Error, '(none)')
      assert.equal(out.ParsedNodes['cool.node'].UpdatedAt, '2016-03-08T19:02:41Z')
      assert.equal(out.ParsedNodes['cool.node'].Labels.env, 'test')
      assert.equal(out.ParsedNodes['cool.node'].Labels.hd, 'ssd')

      assert.equal(out.ParsedNodes['un.cool.node'].Host, uncoolNode.host)
      assert.isNumber(out.ParsedNodes['un.cool.node'].Containers)
      assert.equal(out.ParsedNodes['un.cool.node'].ReservedCpus, '0 / 1')
      assert.equal(out.ParsedNodes['un.cool.node'].ReservedMem, '10 GiB / 1.021 GiB')
      assert.equal(out.ParsedNodes['un.cool.node'].Error, '(none)')
      assert.equal(out.ParsedNodes['un.cool.node'].UpdatedAt, '2016-03-08T19:02:41Z')
      assert.equal(out.ParsedNodes['un.cool.node'].Labels.env, 'prod')
      assert.equal(out.ParsedNodes['un.cool.node'].Labels.hd, 'disk')
      done()
    })
  }) // end _parseSwarmSystemStatus
})
