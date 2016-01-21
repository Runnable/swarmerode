'use strict'

var exists = require('101/exists')
var pluck = require('101/pluck')

function Swarmerode () {
  throw new Error('Cannot instanciate Swarmerode directly')
}

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

Swarmerode.prototype.swarmHostExists = function (host, cb) {
  this.swarmHosts(function (err, hosts) {
    if (err) { return cb(err) }
    var index = hosts.indexOf(host)
    cb(null, index !== -1)
  })
}

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
