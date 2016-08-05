'use strict'

var clone = require('101/clone')
var debug = require('debug')('swarmerode')
var exists = require('101/exists')
var Consul = require('./consul')

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
  var consul = new Consul()
  consul.getSwarmNodes(cb)
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
  var consul = new Consul()
  consul.getSwarmNodes(function (err, hosts) {
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
 *       Status: 'Healthy',
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
 * nodeHostname should be in format similar to ip-10.20.10.12 or `(unknown)`
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
  var parsedNodes = systemStatus.reduce(
    function (nodesArray, itemPair) {
      var key = itemPair[0].toLowerCase().trim()
      var value = itemPair[1]
      // when status is pending node will have no IP but will have `(unknown)` key
      if (key.indexOf('ip-') === 0 || key === '(unknown)') {
        nodesArray.push({
          Host: value
        })
      } else {
        // updated the last node
        var normalizedKey = null
        if (key.indexOf('id') > -1) {
          normalizedKey = 'ID'
        } else if (key.indexOf('status') > -1) {
          normalizedKey = 'Status'
        } else if (key.indexOf('containers') > -1) {
          normalizedKey = 'Containers'
        } else if (key.indexOf('reserved cpus') > -1) {
          normalizedKey = 'ReservedCpus'
        } else if (key.indexOf('reserved memory') > -1) {
          normalizedKey = 'ReservedMem'
        } else if (key.indexOf('error') > -1) {
          normalizedKey = 'Error'
        } else if (key.indexOf('updatedat') > -1) {
          normalizedKey = 'UpdatedAt'
        } else if (key.indexOf('labels') > -1) {
          normalizedKey = 'Labels'
        } else if (key.indexOf('ServerVersion') > -1) {
          normalizedKey = 'ServerVersion'
        }
        if (normalizedKey && nodesArray.length > 0 && !nodesArray[nodesArray.length - 1][normalizedKey]) {
          if (normalizedKey === 'Labels') {
            nodesArray[nodesArray.length - 1][normalizedKey] = parseLabels(value)
          } else {
            nodesArray[nodesArray.length - 1][normalizedKey] = value
          }
        }
      }
      return nodesArray
    },
  [])
  // convert array to object indexed by host
  formatted.ParsedNodes = parsedNodes.reduce(
    function (obj, item) {
      obj[item.Host] = item
      return obj
    },
  {})

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
