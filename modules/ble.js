'use strict'

var electronic = require('./electronic'),
	bleno = require('bleno'),
    io = require('socket.io-client'),
    StringDecoder = require('string_decoder').StringDecoder;


/*
BLE Service
*/

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

// Characteristic

const uuidCharacteristic = '11111111222233334444000000000010';
const decoder = new StringDecoder('utf-8');

// new characteristic added to the service
var CharTest = new bleno.Characteristic({
    uuid : uuidCharacteristic,
    properties : ['read','writeWithoutResponse'],
    descriptors:[
    	new bleno.Descriptor({
    		uuid:'2901',
    		value: 'test Descriptor ! '
    	})
    ],
    onReadRequest : function(offset, callback) {
    	if (offset){
    		callback(bleno.Characteristic.RESULT_ATTR_NOT_LONG, null);
    	}else{
    		var data = new Buffer(1);
		    data.writeUInt8(1, 0);
		    callback(this.RESULT_SUCCESS, data);
    	}
    },
    onWriteRequest : function(newData, offset, withoutResponse, callback) {
        if(offset > 0) {
            callback(bleno.Characteristic.RESULT_INVALID_OFFSET);
        } else {

            var action = decoder.write(newData);
            console.log(`${action}!`);
            if (action === 'on'){
                electronic.on();                
            }else if (action === 'blink'){
                electronic.blink();
            }else if (action === 'off'){
                electronic.stop();
            }else if (action.indexOf('bright') != -1){
                var power = Math.min(255, Math.max(+action.substr(action.indexOf(":")+1, action.length))); 
                electronic.brightness(power);
            }            
            callback(bleno.Characteristic.RESULT_SUCCESS);
        }
    }
})

// Service

const uuidService = '11111111222233334444000000000000';

var myTestService =  new bleno.PrimaryService({
    uuid : uuidService,
    characteristics : [
        CharTest
    ]
});

// Bleno

const deviceName = electronic.isRaspberry() ? "RpiJefLedDevice" : "JefLedDevice";

function configureBleno(){
    bleno.on('advertisingStart', function(error) {
        if(error){ console.log("Adv error",error); }
        if (!error) {
            console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));
            bleno.setServices([myTestService]);
        }else{
            bleno.stopAdvertising();
            bleno.startAdvertising(deviceName,[uuidService]);
        }    
    });


    bleno.startAdvertising(deviceName,[uuidService]);

}

var localServer = false;
var directBle = false
if (process.argv.length > 2){
    localServer = process.argv[2] === "-l";
    directBle = process.argv[2] === "-d";
}

var eddystoneBeacon = null;
if (!directBle){
    eddystoneBeacon = require('eddystone-beacon');
}
var socket = localServer ? io("http://localhost:8000") : io("https://binomed.fr:8000");

socket.on('connect', function () { console.log("socket connected"); });

socket.on('sensor', function(message){
    if (message.type === 'ble' && message.action === "stopPhysicalWeb"){
        console.log('Receive stop PhysicalWeb Instruction ! ');
        bleno.stopAdvertising(function(){
            console.log("stop adversiting");
        });
        configureBleno();
    }
});

bleno.on('stateChange', function(state) {
    console.log('on -> stateChange: ' + state);
    if (state === 'poweredOn') {        
        if (!directBle){
            var url = 'https://goo.gl/F0N5Ke'; // https://binomed.fr:8000/addon.index_app.html
            //url = 'https://goo.gl/A7vNiK';  //https://rawgit.com/binomed/binomed_docs/gh-pages/Tests/addon/index_app.html

            eddystoneBeacon.advertiseUrl(url);
        }else{
            configureBleno();
        }
    } else {
        bleno.stopAdvertising();
    }
});
