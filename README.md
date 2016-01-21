# swarmerode

[![Build Status](https://img.shields.io/travis/Runnable/swarmerode/master.svg?style=flat-square)](https://travis-ci.org/Runnable/swarmerode)
[![Dependency Status](https://img.shields.io/david/Runnable/swarmerode.svg?style=flat-square)](https://david-dm.org/Runnable/swarmerode)
[![devDependency Status](https://img.shields.io/david/dev/Runnable/swarmerode.svg?style=flat-square)](https://david-dm.org/Runnable/swarmerode#info=devDependencies)
[![Test Coverage](https://img.shields.io/coveralls/Runnable/swarmerode.svg?style=flat-square)](https://coveralls.io/github/Runnable/swarmerode)

Swarmerode is a tool to extend [`dockerode`](https://www.npmjs.com/package/dockerode) with nice swarm helper functions.

## Example

```javascript
var Swarmerode = require('swarmerode')
var Dockerode = require('dockerode')

// extend Dockerode w/ Swarm functions.
Dockerode = Swarmerode(Dockerode)

var swarmClient = new Dockerode(/* opts */)
swarmClient.swarmHostExists('10.0.0.1:2375', function (err, hostExists) {
  if (err) { throw err }
  console.log(
    hostExists
      ? 'The given host exists!'
      : 'The given host was not found.'
  )
})
```
