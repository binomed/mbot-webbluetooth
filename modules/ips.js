'use strict'

var os = require('os');
var ifaces=os.networkInterfaces();
var jsonNetWork = [];
var index = 0;
for (var networkName in ifaces) {
  ifaces[networkName].forEach(function(details){
    if (details.family=='IPv4') {
        jsonNetWork.push({
           name:networkName,
            ip : details.address
        });
      console.log(networkName+':'+details.address);
    }
  });
}

module.exports = jsonNetWork;