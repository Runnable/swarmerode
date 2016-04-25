'use strict'

var request = require('request')

var CONSUL_HOST = process.env.CONSUL_HOST
var SWARM_PREFIX = 'swarm/docker/swarm/nodes/'

function Consul () {
  if (!CONSUL_HOST) {
    throw new Error('CONSUL_HOST must be defined')
  }
}

Consul._makeRequest = function (url, cb) {
  request.get(url, {}, function (err, res, body) {
    if (err) { return cb(err) }
    body = JSON.parse(body)
    body = body.map(function (v) {
      v.Value = v.Value ? (new Buffer(v.Value, 'base64')).toString('utf-8') : ''
      return v
    })
    cb(null, body)
  })
}

Consul._getRecursiveKV = function (prefix, cb) {
  Consul._makeRequest('http://' + CONSUL_HOST + '/v1/kv/' + prefix + '?recurse=true', cb)
}

Consul.getSwarmNodes = function (cb) {
  Consul._getRecursiveKV(SWARM_PREFIX, function (err, hosts) {
    if (err) { return cb(err) }
    hosts = hosts.map(function (p) {
      return p.Key.substr(SWARM_PREFIX.length)
    })
    cb(null, hosts)
  })
}

module.exports = Consul

