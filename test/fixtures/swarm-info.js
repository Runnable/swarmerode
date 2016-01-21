'use strict'

var index = 0

function hostEntry (host) {
  var hostIndex = index++
  var labelString = [
    'executiondriver=native-0.2',
    'kernelversion=4.1.13-boot2docker',
    'operatingsystem=Boot2Docker 1.9.1 (TCL 6.4.1); master : ' +
      'cef800b - Fri Nov 20 19:33:59 UTC 2015',
    'provider=virtualbox',
    'storagedriver=aufs'
  ].join(', ')
  return [
    [ 'swarm-agent-0' + hostIndex, host ],
    [ ' └ Containers', '12' ],
    [ ' └ Reserved CPUs', '0 / 1' ],
    [ ' └ Reserved Memory', '10 GiB / 1.021 GiB' ],
    [ ' └ Labels', labelString ]
  ]
}

module.exports = function (testHosts) {
  if (!Array.isArray(testHosts) || testHosts.length <= 0) {
    throw new Error('swarm-info requires a list of hosts')
  }
  var driverStatus = [
    [ '\bRole', 'primary' ],
    [ '\bStrategy', 'spread' ],
    [ '\bFilters', 'health, port, dependency, affinity, constraint' ],
    [ '\bNodes', testHosts.length.toString() ]
  ]
  testHosts.forEach(function (host) {
    driverStatus.push.apply(driverStatus, hostEntry(host))
  })
  return {
    ID: '',
    Containers: 16,
    Driver: '',
    DriverStatus: driverStatus,
    ExecutionDriver: '',
    Images: 7,
    KernelVersion: '',
    OperatingSystem: '',
    NCPU: testHosts.length,
    MemTotal: 3290421657,
    Name: 'f0877b9fe8c1',
    Labels: null,
    Debug: false,
    NFd: 0,
    NGoroutines: 0,
    SystemTime: '2015-12-11T00:30:01.504395876Z',
    NEventsListener: 0,
    InitPath: '',
    InitSha1: '',
    IndexServerAddress: '',
    MemoryLimit: true,
    SwapLimit: true,
    IPv4Forwarding: true,
    BridgeNfIptables: true,
    BridgeNfIp6tables: true,
    DockerRootDir: '',
    HttpProxy: '',
    HttpsProxy: '',
    NoProxy: ''
  }
}
