'use strict'

var clone = require('101/clone')
var debug = require('debug')('swarmerode')
var exists = require('101/exists')

/*
 * Swarmerode Class constructor. Not really to be used but as a placeholder for
 * the functions with which we want to extend dockerode.
 */
function Swarmerode () {
  throw new Error('Cannot instantiate Swarmerode directly')
}

/**
 * Return a list of swarm hosts (e.g. `[ '10.0.0.1:2375', '10.0.0.2:2375' ]`).
 * @param {Function} cb Callback with signature (err, hosts).
 */
Swarmerode.prototype.swarmHosts = function (cb) {
  this.swarmInfo(function (err, data) {
    if (err) { return cb(err) }
    var nodes = data.parsedSystemStatus.ParsedNodes
    var hosts = Object.keys(nodes)
      .map(function (key) {
        return nodes[key].Host
      })
    cb(null, hosts)
  })
}

/**
 * Return a formated list of swarm nodes
 * @param {Function} cb Callback with signature (err, nodes).
 */
Swarmerode.prototype.swarmInfo = function (cb) {
  this.info(function (err, info) {
    if (err) { return cb(err) }
    info.parsedSystemStatus = Swarmerode._parseSwarmSystemStatus(info.SystemStatus)
    debug('swarm info %j', info)
    cb(null, info)
  })
}

/**
 * Return a boolean indicating if a swarm host exists.
 * @param {String} host Host address (e.g. `10.0.0.1:2375`).
 * @param {Function} cb Callback with signature (err, hostExists).
 */
Swarmerode.prototype.swarmHostExists = function (host, cb) {
  this.swarmHosts(function (err, hosts) {
    if (err) { return cb(err) }
    var index = hosts.indexOf(host)
    cb(null, index !== -1)
  })
}

/**
 * Parse and transform raw swarm data into the proper JSON.
 * format: {
 *   Role: 'primary'
 *   Strategy: 'spread'
 *   Filters: 'health, port, dependency, affinity, constraint'
 *   Nodes: 42
 *   ParsedNodes: {
 *     <nodeHostname>: {
 *       Host: '10.0.0.1:4242,
 *       Containers: 5,
 *       ReservedCpus: '0 / 1',
 *       ReservedMem: '10 GiB / 1.021 GiB',
 *       Labels: {
 *         env: 'prod',
 *         provider: 'virtualbox'
 *       },
 *       Error: '(none)',
 *       UpdatedAt: '2016-03-08T19:02:41Z'
 *     }
 *   }
 * }
 * @param {Array} - array data response from swarm info
 * @return array of json objects with swarm data for each node
 */
Swarmerode._parseSwarmSystemStatus = function (systemStatus) {
  systemStatus = clone(systemStatus)
  // the first 4 fields are Role, Strategy, Filters, Nodes respectively
  var formatted = {
    Role: systemStatus.shift()[1],
    Strategy: systemStatus.shift()[1],
    Filters: systemStatus.shift()[1],
    Nodes: parseInt(systemStatus.shift()[1], 10),
    ParsedNodes: {}
  }

  for (var i = 0; i < formatted.Nodes; i++) {
    formatted.ParsedNodes[systemStatus[0][0].trim()] = {
      Host: systemStatus.shift()[1],
      Status: systemStatus.shift()[1],
      Containers: parseInt(systemStatus.shift()[1], 10),
      ReservedCpus: systemStatus.shift()[1],
      ReservedMem: systemStatus.shift()[1],
      Labels: parseLabels(systemStatus.shift()[1]),
      Error: systemStatus.shift()[1],
      UpdatedAt: systemStatus.shift()[1]
    }
  }

  function parseLabels (labelString) {
    var labelsTokens = labelString.split(',')
    var labels = {}
    labelsTokens.forEach(function (labelToken) {
      var pair = labelToken.split('=').map(function (s) {
        return s.trim()
      })
      labels[pair[0]] = pair[1]
    })
    return labels
  }

  return formatted
}

/**
 * Extend a given Class's prototype with the swarm functions.
 * @param {Function} Class A 'Class' of which to extend the prototype
 * @returns {Function} The given Class with swarm functions.
 */
module.exports = function (Class) {
  Object.getOwnPropertyNames(Swarmerode.prototype).forEach(function (key) {
    if (key === 'constructor') { return }
    if (exists(Class.prototype[key])) { return }
    Class.prototype[key] = Swarmerode.prototype[key]
  })
  return Class
}

// exposing the class for testing purposes only
module.exports._Swarmerode = Swarmerode
