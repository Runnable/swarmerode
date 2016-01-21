'use strict'

var exists = require('101/exists')
var pluck = require('101/pluck')

/*
 * Swarmerode Class constructor. Not really to be used but as a placeholder for
 * the functions with which we want to extend dockerode.
 */
function Swarmerode () {
  throw new Error('Cannot instanciate Swarmerode directly')
}

/**
 * Return a list of swarm hosts (e.g. `[ '10.0.0.1:2375', '10.0.0.2:2375' ]`).
 * @param {Function} cb Callback with signature (err, hosts).
 */
Swarmerode.prototype.swarmHosts = function (cb) {
  var ipRegex = new RegExp('^(?:[0-9]{1,3}\.){3}[0-9]{1,3}:[0-9]{1,5}$')
  this.info(function (err, data) {
    if (err) { return cb(err) }
    var hosts = data.DriverStatus
      .map(pluck(1))
      .filter(ipRegex.test.bind(ipRegex))
    cb(null, hosts)
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
