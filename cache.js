'use strict'

var Promise = require('bluebird')
var exists = require('101/exists')
var cache = {}


/**
 * Utility function for caching
 * @param {String} key - Key to match the cache on
 * @param {Function} cacheFetch - Function which will be executed to fill cache, expects async callback style
 * @param {Function} cb - Callback to return the cached results
 */
module.exports = {
  handleCache: function handleCache (key, cacheFetch, cb) {
    // If SWARMERODE_CACHE_LENGTH is not set we don't want to cache anything
    if (!exists(process.env.SWARMERODE_CACHE_LENGTH)) {
      return cacheFetch(cb)
    }

    if (!cache[ key ]) {
      cache[ key ] = Promise.fromCallback(cacheFetch)
      cache[ key ]
        .catch(function () {}) // Eat the errors
        .delay(process.env.SWARMERODE_CACHE_LENGTH)
        .then(function () {
          delete cache[ key ]
        })
    }
    cache[ key ].asCallback(cb)
  }
}
