'use strict'

var request = require('request')

var SWARM_PREFIX = 'swarm/docker/swarm/nodes/'

function Consul () {
  this.CONSUL_HOST = process.env.CONSUL_HOST
  if (!this.CONSUL_HOST) {
    throw new Error('CONSUL_HOST must be defined')
  }
}

Consul.prototype._makeRequest = function (url, cb) {
  request.get(url, {}, function (err, res, body) {
    if (err) { return cb(err) }
    try {
      body = JSON.parse(body)
    } catch (parseErr) {
      return cb(new Error('Parse Consul response error', { originalErr: parseErr }))
    }
    if (!Array.isArray(body)) {
      return cb(new Error('Invalid Consul response'))
    }
    body = body.map(function (v) {
      v.Value = v.Value ? (new Buffer(v.Value, 'base64')).toString('utf-8') : ''
      return v
    })
    cb(null, body)
  })
}

Consul.prototype._getRecursiveKV = function (prefix, cb) {
  this._makeRequest('http://' + this.CONSUL_HOST + '/v1/kv/' + prefix + '?recurse=true', cb)
}

Consul.prototype.getSwarmNodes = function (cb) {
  this._getRecursiveKV(SWARM_PREFIX, function (err, hosts) {
    if (err) { return cb(err) }
    hosts = hosts.map(function (p) {
      return p.Key.substr(SWARM_PREFIX.length)
    })
    cb(null, hosts)
  })
}

module.exports = Consul
