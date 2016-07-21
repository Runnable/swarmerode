'use strict'

var index = 0

function hostEntry (hostInfo) {
  var hostIndex = index++
  var labelString = [
    'executiondriver=native-0.2',
    'kernelversion=4.1.13-boot2docker',
    'operatingsystem=Boot2Docker 1.9.1 (TCL 6.4.1); master : ' +
      'cef800b - Fri Nov 20 19:33:59 UTC 2015',
    'provider=virtualbox',
    'storagedriver=aufs'
  ].join(', ')
  if (hostInfo.Labels) {
    labelString += ', ' + hostInfo.Labels
  }
  var nodeName = hostInfo.nodeName || (' ip-swarm-agent-0' + hostIndex)
  var host = hostInfo.host || ('10.0.0.' + hostIndex + ':4242')
  var numContainers = hostInfo.Containers || '1'

  return [
    [ nodeName, host ],
    [ '  └ ID', '' + Math.random() ],
    [ '  └ Status', 'Healthy' ],
    [ '  └ Containers', numContainers ],
    [ '  └ Reserved CPUs', '0 / 1' ],
    [ '  └ Reserved Memory', '10 GiB / 1.021 GiB' ],
    [ '  └ Labels', labelString ],
    [ '  └ Error', '(none)' ],
    [ '  └ UpdatedAt', '2016-03-08T19:02:41Z' ],
    [ '  └ ServerVersion', '1.10.2' ]
  ]
}

module.exports = function (testHosts) {
  if (!Array.isArray(testHosts) || testHosts.length <= 0) {
    throw new Error('swarm-info requires a list of hosts')
  }
  var SystemStatus = [
    [ 'Role', 'primary' ],
    [ 'Strategy', 'spread' ],
    [ 'Filters', 'health, port, dependency, affinity, constraint' ],
    [ 'Nodes', testHosts.length.toString() ]
  ]
  testHosts.forEach(function (hostInfo) {
    SystemStatus.push.apply(SystemStatus, hostEntry(hostInfo))
  })

  return {
    ServerVersion: 'swarm/1.1.2',
    ID: '',
    Containers: 25,
    ContainersRunning: 5,
    ContainersPaused: 0,
    ContainersStopped: 20,
    Images: 46,
    Driver: '',
    DriverStatus: null,
    Plugins: { Volume: null, Network: null, Authorization: null },
    MemoryLimit: true,
    SwapLimit: true,
    CpuCfsPeriod: true,
    CpuCfsQuota: true,
    CPUShares: true,
    CPUSet: true,
    IPv4Forwarding: true,
    BridgeNfIptables: true,
    BridgeNfIp6tables: true,
    Debug: false,
    NFd: 0,
    OomKillDisable: true,
    NGoroutines: 0,
    SystemTime: '2016-03-08T19:02:46.450133201Z',
    ExecutionDriver: '',
    LoggingDriver: '',
    NEventsListener: 1,
    KernelVersion: '3.13.0-77-generic',
    OperatingSystem: 'linux',
    OSType: '',
    Architecture: 'amd64',
    IndexServerAddress: '',
    RegistryConfig: null,
    NCPU: 4,
    MemTotal: 17580879052,
    DockerRootDir: '',
    HttpProxy: '',
    HttpsProxy: '',
    NoProxy: '',
    Name: '005f6adac88b',
    Labels: null,
    ExperimentalBuild: false,
    ClusterStore: '',
    ClusterAdvertise: '',
    SystemStatus: SystemStatus
  }
}
