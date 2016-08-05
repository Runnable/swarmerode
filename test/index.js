'use strict'

var assert = require('chai').assert
var clone = require('101/clone')
var sinon = require('sinon')

var exampleHosts = [ '10.0.0.1:4242', '10.0.0.2:4242', '10.0.0.3:4242' ]
var swarmInfoMock = require('./fixtures/swarm-info')
var testInfo = swarmInfoMock([
  { host: exampleHosts[0] },
  { host: exampleHosts[1] },
  { host: exampleHosts[2] }
])

var Consul = require('../consul')

var Swarmerode = require('../')

describe('Swarmerode', function () {
  var MockClass
  var instance
  var prevConsulHost = process.env.CONSUL_HOST

  beforeEach(function () {
    process.env.CONSUL_HOST = 'somehost'
    MockClass = function () {}
    MockClass.prototype.info = function (cb) { cb(null, clone(testInfo)) }
    MockClass = Swarmerode(MockClass)
    instance = new MockClass()
    sinon.stub(Consul.prototype, 'getSwarmNodes').yieldsAsync(null, exampleHosts)
  })

  afterEach(function () {
    Consul.prototype.getSwarmNodes.restore()
    process.env.CONSUL_HOST = prevConsulHost
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
    it('should return any error from consul', function (done) {
      var error = new Error('robot')
      Consul.prototype.getSwarmNodes.yieldsAsync(error)
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

  describe('swarmInfo', function () {
    it('should call the class info function', function (done) {
      sinon.spy(MockClass.prototype, 'info')
      instance.swarmInfo(function (err) {
        assert.isNull(err)
        sinon.assert.calledOnce(MockClass.prototype.info)
        done()
      })
    })

    it('should pass through any info error', function (done) {
      var error = new Error('foobar')
      sinon.stub(MockClass.prototype, 'info').yieldsAsync(error)
      instance.swarmInfo(function (err) {
        assert.equal(err, error)
        done()
      })
    })
  })

  describe('swarmHostExists', function () {
    it('should return any error from consul', function (done) {
      var error = new Error('robot')
      Consul.prototype.getSwarmNodes.yieldsAsync(error)
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
    it('should not parse node that has incorrect nodename', function (done) {
      var coolNode = {
        Labels: 'env=test, hd=ssd',
        Containers: 100,
        nodeName: '  cool.node',
        host: '10.42.42.42:4242'
      }
      var uncoolNode = {
        Labels: 'env=prod, hd=disk',
        Containers: 4,
        nodeName: '  un.cool.node',
        host: '10.7.7.7:4242'
      }
      var testHosts = swarmInfoMock([coolNode, uncoolNode])

      var out = Swarmerode._Swarmerode._parseSwarmSystemStatus(testHosts.SystemStatus)
      assert.equal(out.Role, 'primary')
      assert.equal(out.Strategy, 'spread')
      assert.equal(out.Filters, 'health, port, dependency, affinity, constraint')
      assert.isNumber(out.Nodes)
      assert.equal(out.Nodes, 2)
      assert.equal(Object.keys(out.ParsedNodes).length, 0)
      done()
    })

    it('should parse node with `(unknown)` nodename', function (done) {
      var firstNode = {
        Labels: 'env=test, hd=ssd',
        Containers: 100,
        nodeName: '(unknown)',
        host: '10.42.42.42:4242'
      }
      var secondNode = {
        Containers: 4,
        nodeName: '(unknown)',
        host: '10.7.7.7:4242'
      }
      var testHosts = swarmInfoMock([firstNode, secondNode])
      delete testHosts.SystemStatus[18]
      var out = Swarmerode._Swarmerode._parseSwarmSystemStatus(testHosts.SystemStatus)
      assert.equal(out.Role, 'primary')
      assert.equal(out.Strategy, 'spread')
      assert.equal(out.Filters, 'health, port, dependency, affinity, constraint')
      assert.isNumber(out.Nodes)
      assert.equal(out.Nodes, 2)
      assert.equal(Object.keys(out.ParsedNodes).length, 2)
      assert.equal(out.ParsedNodes['10.42.42.42:4242'].Host, firstNode.host)
      assert.isNumber(out.ParsedNodes['10.42.42.42:4242'].Containers)
      assert.isString(out.ParsedNodes['10.42.42.42:4242'].ID)
      assert.equal(out.ParsedNodes['10.42.42.42:4242'].Containers, 100)
      assert.equal(out.ParsedNodes['10.42.42.42:4242'].Status, 'Healthy')
      assert.equal(out.ParsedNodes['10.42.42.42:4242'].ReservedCpus, '0 / 1')
      assert.equal(out.ParsedNodes['10.42.42.42:4242'].ReservedMem, '10 GiB / 1.021 GiB')
      assert.equal(out.ParsedNodes['10.42.42.42:4242'].UpdatedAt, '2016-03-08T19:02:41Z')
      assert.equal(out.ParsedNodes['10.42.42.42:4242'].Labels.env, 'test')
      assert.equal(out.ParsedNodes['10.42.42.42:4242'].Labels.hd, 'ssd')

      assert.equal(out.ParsedNodes['10.7.7.7:4242'].Host, secondNode.host)
      assert.isNumber(out.ParsedNodes['10.7.7.7:4242'].Containers)
      assert.isString(out.ParsedNodes['10.7.7.7:4242'].ID)
      assert.equal(out.ParsedNodes['10.7.7.7:4242'].Containers, 4)
      assert.equal(out.ParsedNodes['10.7.7.7:4242'].Status, 'Healthy')
      assert.equal(out.ParsedNodes['10.7.7.7:4242'].ReservedCpus, '0 / 1')
      assert.isUndefined(out.ParsedNodes['10.7.7.7:4242'].ReservedMem)
      assert.equal(out.ParsedNodes['10.7.7.7:4242'].UpdatedAt, '2016-03-08T19:02:41Z')

      done()
    })

    it('should parse node with `(unknown)` nodename and error', function (done) {
      var firstNode = {
        Labels: 'env=test, hd=ssd',
        Containers: 100,
        nodeName: '(unknown)',
        host: '10.42.42.42:4242'
      }
      var secondNode = {
        Containers: 4,
        nodeName: '(unknown)',
        host: '10.7.7.7:4242'
      }
      var isError = true
      var testHosts = swarmInfoMock([firstNode, secondNode], isError)
      var out = Swarmerode._Swarmerode._parseSwarmSystemStatus(testHosts.SystemStatus)
      assert.equal(out.Role, 'primary')
      assert.equal(out.Strategy, 'spread')
      assert.equal(out.Filters, 'health, port, dependency, affinity, constraint')
      assert.isNumber(out.Nodes)
      assert.equal(out.Nodes, 2)
      assert.equal(Object.keys(out.ParsedNodes).length, 2)
      assert.equal(out.ParsedNodes['10.42.42.42:4242'].Host, firstNode.host)
      assert.isNumber(out.ParsedNodes['10.42.42.42:4242'].Containers)
      assert.isString(out.ParsedNodes['10.42.42.42:4242'].ID)
      assert.equal(out.ParsedNodes['10.42.42.42:4242'].Containers, 100)
      assert.equal(out.ParsedNodes['10.42.42.42:4242'].Status, 'Pending')
      assert.equal(out.ParsedNodes['10.42.42.42:4242'].Error, 'Docker daemon is unavailable')
      assert.equal(out.ParsedNodes['10.42.42.42:4242'].ReservedCpus, '0 / 1')
      assert.equal(out.ParsedNodes['10.42.42.42:4242'].ReservedMem, '10 GiB / 1.021 GiB')
      assert.equal(out.ParsedNodes['10.42.42.42:4242'].UpdatedAt, '2016-03-08T19:02:41Z')
      assert.equal(out.ParsedNodes['10.42.42.42:4242'].Labels.env, 'test')
      assert.equal(out.ParsedNodes['10.42.42.42:4242'].Labels.hd, 'ssd')

      assert.equal(out.ParsedNodes['10.7.7.7:4242'].Host, secondNode.host)
      assert.isNumber(out.ParsedNodes['10.7.7.7:4242'].Containers)
      assert.isString(out.ParsedNodes['10.7.7.7:4242'].ID)
      assert.equal(out.ParsedNodes['10.7.7.7:4242'].Containers, 4)
      assert.equal(out.ParsedNodes['10.7.7.7:4242'].Status, 'Pending')
      assert.equal(out.ParsedNodes['10.7.7.7:4242'].Error, 'Docker daemon is unavailable')
      assert.equal(out.ParsedNodes['10.7.7.7:4242'].ReservedCpus, '0 / 1')
      assert.equal(out.ParsedNodes['10.7.7.7:4242'].UpdatedAt, '2016-03-08T19:02:41Z')

      done()
    })
  }) // end _parseSwarmSystemStatus
})
