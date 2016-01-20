'use strict'

module.exports = function (testHosts) {
  var host1 = testHosts[0] || '192.168.99.102:2376'
  var host2 = testHosts[1] || '192.168.99.103:2376'
  var host3 = testHosts[2] || '192.168.99.101:2376'
  return {
    ID: '',
    Containers: 16,
    Driver: '',
    DriverStatus: [
      [ '\bRole', 'primary' ],
      [ '\bStrategy', 'spread' ],
      [ '\bFilters', 'health, port, dependency, affinity, constraint' ],
      [ '\bNodes', '3' ],
      [ 'swarm-agent-00', host1 ],
      [ ' └ Containers', '12' ],
      [ ' └ Reserved CPUs', '0 / 1' ],
      [ ' └ Reserved Memory', '10 GiB / 1.021 GiB' ],
      [ ' └ Labels', 'executiondriver=native-0.2, kernelversion=4.1.13-boot2docker, operatingsystem=Boot2Docker 1.9.1 (TCL 6.4.1); master : cef800b - Fri Nov 20 19:33:59 UTC 2015, provider=virtualbox, storagedriver=aufs' ],
      [ 'swarm-agent-01', host2 ],
      [ ' └ Containers', '2' ],
      [ ' └ Reserved CPUs', '0 / 1' ],
      [ ' └ Reserved Memory', '0 B / 1.021 GiB' ],
      [ ' └ Labels', 'executiondriver=native-0.2, kernelversion=4.1.13-boot2docker, operatingsystem=Boot2Docker 1.9.1 (TCL 6.4.1); master : cef800b - Fri Nov 20 19:33:59 UTC 2015, provider=virtualbox, storagedriver=aufs' ],
      [ 'swarm-master', host3 ],
      [ ' └ Containers', '2' ],
      [ ' └ Reserved CPUs', '0 / 1' ],
      [ ' └ Reserved Memory', '0 B / 1.021 GiB' ],
      [ ' └ Labels', 'executiondriver=native-0.2, kernelversion=4.1.13-boot2docker, operatingsystem=Boot2Docker 1.9.1 (TCL 6.4.1); master : cef800b - Fri Nov 20 19:33:59 UTC 2015, provider=virtualbox, storagedriver=aufs' ]
    ],
    ExecutionDriver: '',
    Images: 7,
    KernelVersion: '',
    OperatingSystem: '',
    NCPU: 3,
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
