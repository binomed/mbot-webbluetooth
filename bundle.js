(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

angular.module("MbotApp", ['ngMaterial'])
.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('light-blue')
    .accentPalette('orange');
})
.directive('mbotTouchstart', [function() {
    return function(scope, element, attr) {

        element.on('touchstart', function(event) {
        	event.preventDefault();
            scope.$apply(function() { 
                scope.$eval(attr.mbotTouchstart); 
            });
        });
    };
}]).directive('mbotTouchend', [function() {
    return function(scope, element, attr) {

        element.on('touchend', function(event) {
        	event.preventDefault();
            scope.$apply(function() { 
                scope.$eval(attr.mbotTouchend); 
            });
        });
    };
}])
.directive('mbotColorpicker', [function(){
	return function(scope, element, attr){
		var img = new Image();
		img.src = './assets/images/color-wheel.png'
		img.onload = function() {
		  var canvas = document.querySelector('canvas');
		  var context = canvas.getContext('2d');

		  canvas.width = 150 * devicePixelRatio;
		  canvas.height = 150 * devicePixelRatio;
		  canvas.style.width = "150px";
		  canvas.style.height = "150px";
		  canvas.addEventListener('click', function(evt) {
		    // Refresh canvas in case user zooms and devicePixelRatio changes.
		    canvas.width = 150 * devicePixelRatio;
		    canvas.height = 150 * devicePixelRatio;
		    context.drawImage(img, 0, 0, canvas.width, canvas.height);

		    var rect = canvas.getBoundingClientRect();
		    var x = Math.round((evt.clientX - rect.left) * devicePixelRatio);
		    var y = Math.round((evt.clientY - rect.top) * devicePixelRatio);
		    var data = context.getImageData(0, 0, canvas.width, canvas.height).data;

		    var r = data[((canvas.width * y) + x) * 4];
		    var g = data[((canvas.width * y) + x) * 4 + 1];
		    var b = data[((canvas.width * y) + x) * 4 + 2];
		    
		    scope.$eval(attr.mbotColorpicker, {
		    	red:r,
		    	blue:b,
		    	green:g
		    }); 
		    

		    context.beginPath();
		    context.arc(x, y + 2, 10 * devicePixelRatio, 0, 2 * Math.PI, false);
		    context.shadowColor = '#333';
		    context.shadowBlur = 4 * devicePixelRatio;
		    context.fillStyle = 'white';
		    context.fill();
		  });

		  context.drawImage(img, 0, 0, canvas.width, canvas.height);
		}
	};
}])
.directive('app', [ 
	function(){

	return {
		templateUrl: './components/app.html',
		controllerAs : 'bleCtrl',
		bindToController : true,
		controller: require('./sensors/bluetooth')
	}
}]);


function pageLoad(){		
}



window.addEventListener('load', pageLoad);
},{"./sensors/bluetooth":3}],2:[function(require,module,exports){
'use strict'

const DEVICE_NAME = "Makeblock_LE",
	SERVICE_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb",
	CHARACTERISTIC_UUID = "0000ffe3-0000-1000-8000-00805f9b34fb";

const TYPE_MOTOR = 0x0a,
	TYPE_RGB = 0x08,
	TYPE_SOUND = 0x07;


const PORT_1 = 0x01,
	PORT_2 = 0x02,
	PORT_3 = 0x03,
	PORT_4 = 0x04,
	PORT_5 = 0x05,
	PORT_6 = 0x06,
	PORT_7 = 0x07,
	PORT_8 = 0x08,
	M_1 = 0x09,
	M_2 = 0x0a;

function genericControl(type, port, slot, value){
	/*
	ff 55 len idx action device port  slot  data a
	0  1  2   3   4      5      6     7     8
	*/
	//unsigned char a[11]={0xff,0x55,WRITEMODULE,7,0,0,0,0,0,0,'\n'};
    //a[4] = [type intValue];
    //a[5] = (port<<4 & 0xf0)|(slot & 0xf);
    // Static values
	var buf = new ArrayBuffer(16);
	var bufView = new Uint16Array(buf);
	
	var byte0 = 0xff,
		byte1 = 0x55,
		byte2 = 0x09,
		byte3 = 0x00,
		byte4 = 0x02,
		byte5 = type,
		byte6 = port,
		byte7 = slot;
	//dynamics values
	var byte8 = 0x00,
		byte9 = 0x00,
		byte10 = 0x00,
		byte11 = 0x00;
	//End of message
	var byte12 = 0x0a,
		byte13 = 0x00,
		byte14 = 0x00,
		byte15 = 0x00;

	switch(type){
		case TYPE_MOTOR:
			// Motor M1
			// ff:55  09:00  02:0a  09:64  00:00  00:00  0a"
			// 0x55ff;0x0009;0x0a02;0x0964;0x0000;0x0000;0x000a;0x0000;
			//"ff:55:09:00:02:0a:09:00:00:00:00:00:0a"
			// ff:55:09:00:02:0a:09:9c:ff:00:00:00:0a
			// Motor M2
			// ff:55:09:00:02:0a:0a:64:00:00:00:00:0a
			// ff:55:09:00:02:0a:0a:00:00:00:00:00:0a
			// ff:55:09:00:02:0a:0a:9c:ff:00:00:00:0a
			var tempValue = value < 0 ? (parseInt("ffff",16) + Math.max(-255,value)) : Math.min(255, value);
			byte7 = tempValue & 0x00ff;			
			byte8 = 0x00;
			byte8 = tempValue >>8; 

			/*byte5 = 0x0a;
			byte6 = 0x09;
			byte7 = 0x64;
			byte8 = 0x00;*/
			
		break;
		case TYPE_RGB:
			// ff:55  09:00  02:08  06:00  5c:99  6d:00  0a
			// 0x55ff;0x0009;0x0802;0x0006;0x995c;0x006d;0x000a;0x0000;
			byte7 = 0x00;
			byte8 = value>>8 & 0xff;
			byte9 = value>>16 & 0xff;
			byte10 = value>>24 & 0xff;
		break;
		case TYPE_SOUND:
			//ff:55:05:00:02:22:00:00:0a
			//ff:55:05:00:02:22:06:01:0a
			//ff:55:05:00:02:22:ee:01:0a
			//ff:55:05:00:02:22:88:01:0a
			//ff:55:05:00:02:22:b8:01:0a
			//ff:55:05:00:02:22:5d:01:0a
			//ff:55:05:00:02:22:4a:01:0a
			//ff:55:05:00:02:22:26:01:0a
            byte2 = 0x05;
			byte3 = 0x00;
			byte4 = 0x02;
			byte5 = 0x22;
			if (value === 0){
				byte6 = 0x06;
				byte7 = 0x01;
			}else{

				byte6 = 0xee;
				byte7 = 0x01;
			}
			byte8 = 0x0a;
			byte12= 0x00;

		break;
	}

	bufView[0] = byte1<<8 | byte0;
	bufView[1] = byte3<<8 | byte2;
	bufView[2] = byte5<<8 | byte4;
	bufView[3] = byte7<<8 | byte6;
	bufView[4] = byte9<<8 | byte8;
	bufView[5] = byte11<<8 | byte10;
	bufView[6] = byte13<<8 | byte12;
	bufView[7] = byte15<<8 | byte14;
	console.log(
			byte0.toString(16)+":"+
			byte1.toString(16)+":"+
			byte2.toString(16)+":"+
			byte3.toString(16)+":"+
			byte4.toString(16)+":"+
			byte5.toString(16)+":"+
			byte6.toString(16)+":"+
			byte7.toString(16)+":"+
			byte8.toString(16)+":"+
			byte9.toString(16)+":"+
			byte10.toString(16)+":"+
			byte11.toString(16)+":"+
			byte12.toString(16)+":"+
			byte13.toString(16)+":"+
			byte14.toString(16)+":"+
			byte15.toString(16)+":"
			);
	console.log(
			bufView[0].toString(16)+":"+
			bufView[1].toString(16)+":"+
			bufView[2].toString(16)+":"+
			bufView[3].toString(16)+":"+
			bufView[4].toString(16)+":"+
			bufView[5].toString(16)+":"+
			bufView[6].toString(16)+":"+
			bufView[7].toString(16)
			);
	return buf;
}


module.exports = {
	'DEVICE_NAME' : DEVICE_NAME,
	'SERVICE_UUID' : SERVICE_UUID,
	'CHARACTERISTIC_UUID' : CHARACTERISTIC_UUID,
	'TYPE_MOTOR' : TYPE_MOTOR,
	'TYPE_RGB' : TYPE_RGB,
	'TYPE_SOUND' : TYPE_SOUND,
	'PORT_1' : PORT_1,
	'PORT_2' : PORT_2,
	'PORT_3' : PORT_3,
	'PORT_4' : PORT_4,
	'PORT_5' : PORT_5,
	'PORT_6' : PORT_6,
	'PORT_7' : PORT_7,
	'PORT_8' : PORT_8,
	'M_1' : M_1,
	'M_2' : M_2,
	'genericControl' : genericControl
};
},{}],3:[function(require,module,exports){
'use strict'

const mbotApi = require('../mbot/mbot');  

var serverGATT = null,
	serviceGATT = null,
	characteristicGATT = null,
	encoder = new TextEncoder();

function initBle(){
	return new Promise(function(resolve, reject){
		navigator.bluetooth.requestDevice({ 
			filters: [{ name: mbotApi.DEVICE_NAME }], optionalServices: [mbotApi.SERVICE_UUID]
		})
		.then(function(device) {
		   console.log("Connecting...");
		   return device.connectGATT();
		 })
		.then(function(server) {
			serverGATT = server;
			//return server.getPrimaryService(serviceUUID);
		   // FIXME: Remove this timeout when GattServices property works as intended.
		   // crbug.com/560277
		   return new Promise(function(resolveService, rejectService) {
		     setTimeout(function() {
		     	try{
		     		console.log("Try to get Service");
		       		resolveService(server.getPrimaryService(mbotApi.SERVICE_UUID));
		     	}catch(err){
		     		rejectService(err);
		     	}
		     }, 2e3);
		   })
		}).then(function(service){
			serviceGATT = service;
			resolve(service);			
		}).catch(function(error){
			console.error(error);
			reject(error);
		});
	})
}


function getService(){
	return new Promise(function(resolve, reject){
		if (serverGATT && serverGATT.connected && serviceGATT){
			resolve(serviceGATT);
		}else{
			initBle()
			.then(function(service){
				resolve(service);
			})
			.catch(function(error){
				reject(error);
			});
		}
	});
}

function getCharacteristic(){
	return new Promise(function(resolve, reject){
		if (characteristicGATT){
			resolve(characteristicGATT);
		}else{
			getService()
			.then(function(service){
				console.log("Try to get Characteritic : %O",service);
				return service.getCharacteristic(mbotApi.CHARACTERISTIC_UUID);
			})
			.then(function(characteritic){
				characteristicGATT = characteritic;
				resolve(characteritic);
			}).catch(function(error){
				reject(error);
			});
		}
	});
}

function processCharacteristic(type, data, callback){
	getCharacteristic()
	.then(function(characteristic){
		if (type === 'write'){			
			console.log("Try to write value : %O",characteristic);
			return characteristic.writeValue(data);
		}
	}).then(function(buffer){
		if (type === 'write'){
			if(callback){
				callback({type: 'write', value : true});			
			}
			console.info("Write datas ! ");
		}else{
			let data = new DataView(buffer);
		    let dataDecrypt = data.getUint8(0);
		    callback({type: 'read' , value : dataDecrypt});
		    console.log('ReceiveDatas %s', dataDecrypt);
		}
	}).catch(function(error){
		console.error(error);
		if (callback) {

			callback({type : 'error', value : error});
		}
	});
}

function processMotors(valueM1, valueM2){
	getCharacteristic()
	.then(characteristic =>{
		return characteristic.writeValue(mbotApi.genericControl(mbotApi.TYPE_MOTOR, mbotApi.M_1, 0, valueM1));
	}).then(()=>{
		return characteristicGATT.writeValue(mbotApi.genericControl(mbotApi.TYPE_MOTOR, mbotApi.M_2, 0, valueM2));
	}).then(()=>{
		if(callback){
			callback({type: 'write', value : true});			
		}
		console.info("Write datas ! ");
	}).catch(error =>{
		console.error(error);
		if (callback) {
			callback({type : 'error', value : error});
		}
	});
}

function processBuzzer(){
    getCharacteristic()
	.then(characteristic =>{
		return characteristic.writeValue(mbotApi.genericControl(mbotApi.TYPE_SOUND, 0, 0, 0));
	}).then(()=>{
		console.info("Write datas ! ");
	}).catch(error =>{
		console.error(error);		
	});
}


function BleController(){

	this.currentTimer = null;
	this.power = 125;
	this.red = 0;

	
	this.connect = function(){
		processCharacteristic('write', "on");
	}

	this.up = function(event){
		console.log("up");
		processMotors(-100,100);
	}

	this.down = function(){
		console.log("down");
		processMotors(100,-100);
	}
	
	this.left = function(){
		console.log("left");
		processMotors(100,100);
	};

	this.right = function(){
		console.log("right");
		processMotors(-100,-100);
	};
    
    this.buzz = function(){
		console.log("buzz");
		processBuzzer();
	};

	this.stop = function(){
		console.log("stop");
		processMotors(0,0);
	}

	this.changeColor = function(red,blue,green){ 
		console.log("Change Color : %d,%d,%d",red,green,blue);
		var rHex = red<<8;
		var gHex = green<<16;
		var bHex = blue<<24;
		var value = rHex | gHex | bHex;
		processCharacteristic('write', mbotApi.genericControl(mbotApi.TYPE_RGB,mbotApi.PORT_6,0,value));
	};


}


module.exports = BleController;


},{"../mbot/mbot":2}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzY3JpcHRzL2FwcC5qcyIsInNjcmlwdHMvbWJvdC9tYm90LmpzIiwic2NyaXB0cy9zZW5zb3JzL2JsdWV0b290aC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0J1xuXG5hbmd1bGFyLm1vZHVsZShcIk1ib3RBcHBcIiwgWyduZ01hdGVyaWFsJ10pXG4uY29uZmlnKGZ1bmN0aW9uKCRtZFRoZW1pbmdQcm92aWRlcikge1xuICAkbWRUaGVtaW5nUHJvdmlkZXIudGhlbWUoJ2RlZmF1bHQnKVxuICAgIC5wcmltYXJ5UGFsZXR0ZSgnbGlnaHQtYmx1ZScpXG4gICAgLmFjY2VudFBhbGV0dGUoJ29yYW5nZScpO1xufSlcbi5kaXJlY3RpdmUoJ21ib3RUb3VjaHN0YXJ0JywgW2Z1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cikge1xuXG4gICAgICAgIGVsZW1lbnQub24oJ3RvdWNoc3RhcnQnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7IFxuICAgICAgICAgICAgICAgIHNjb3BlLiRldmFsKGF0dHIubWJvdFRvdWNoc3RhcnQpOyBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xufV0pLmRpcmVjdGl2ZSgnbWJvdFRvdWNoZW5kJywgW2Z1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cikge1xuXG4gICAgICAgIGVsZW1lbnQub24oJ3RvdWNoZW5kJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgXHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgc2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkgeyBcbiAgICAgICAgICAgICAgICBzY29wZS4kZXZhbChhdHRyLm1ib3RUb3VjaGVuZCk7IFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG59XSlcbi5kaXJlY3RpdmUoJ21ib3RDb2xvcnBpY2tlcicsIFtmdW5jdGlvbigpe1xuXHRyZXR1cm4gZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHIpe1xuXHRcdHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRpbWcuc3JjID0gJy4vYXNzZXRzL2ltYWdlcy9jb2xvci13aGVlbC5wbmcnXG5cdFx0aW1nLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdCAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2NhbnZhcycpO1xuXHRcdCAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuXHRcdCAgY2FudmFzLndpZHRoID0gMTUwICogZGV2aWNlUGl4ZWxSYXRpbztcblx0XHQgIGNhbnZhcy5oZWlnaHQgPSAxNTAgKiBkZXZpY2VQaXhlbFJhdGlvO1xuXHRcdCAgY2FudmFzLnN0eWxlLndpZHRoID0gXCIxNTBweFwiO1xuXHRcdCAgY2FudmFzLnN0eWxlLmhlaWdodCA9IFwiMTUwcHhcIjtcblx0XHQgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2dCkge1xuXHRcdCAgICAvLyBSZWZyZXNoIGNhbnZhcyBpbiBjYXNlIHVzZXIgem9vbXMgYW5kIGRldmljZVBpeGVsUmF0aW8gY2hhbmdlcy5cblx0XHQgICAgY2FudmFzLndpZHRoID0gMTUwICogZGV2aWNlUGl4ZWxSYXRpbztcblx0XHQgICAgY2FudmFzLmhlaWdodCA9IDE1MCAqIGRldmljZVBpeGVsUmF0aW87XG5cdFx0ICAgIGNvbnRleHQuZHJhd0ltYWdlKGltZywgMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblxuXHRcdCAgICB2YXIgcmVjdCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHQgICAgdmFyIHggPSBNYXRoLnJvdW5kKChldnQuY2xpZW50WCAtIHJlY3QubGVmdCkgKiBkZXZpY2VQaXhlbFJhdGlvKTtcblx0XHQgICAgdmFyIHkgPSBNYXRoLnJvdW5kKChldnQuY2xpZW50WSAtIHJlY3QudG9wKSAqIGRldmljZVBpeGVsUmF0aW8pO1xuXHRcdCAgICB2YXIgZGF0YSA9IGNvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCkuZGF0YTtcblxuXHRcdCAgICB2YXIgciA9IGRhdGFbKChjYW52YXMud2lkdGggKiB5KSArIHgpICogNF07XG5cdFx0ICAgIHZhciBnID0gZGF0YVsoKGNhbnZhcy53aWR0aCAqIHkpICsgeCkgKiA0ICsgMV07XG5cdFx0ICAgIHZhciBiID0gZGF0YVsoKGNhbnZhcy53aWR0aCAqIHkpICsgeCkgKiA0ICsgMl07XG5cdFx0ICAgIFxuXHRcdCAgICBzY29wZS4kZXZhbChhdHRyLm1ib3RDb2xvcnBpY2tlciwge1xuXHRcdCAgICBcdHJlZDpyLFxuXHRcdCAgICBcdGJsdWU6Yixcblx0XHQgICAgXHRncmVlbjpnXG5cdFx0ICAgIH0pOyBcblx0XHQgICAgXG5cblx0XHQgICAgY29udGV4dC5iZWdpblBhdGgoKTtcblx0XHQgICAgY29udGV4dC5hcmMoeCwgeSArIDIsIDEwICogZGV2aWNlUGl4ZWxSYXRpbywgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcblx0XHQgICAgY29udGV4dC5zaGFkb3dDb2xvciA9ICcjMzMzJztcblx0XHQgICAgY29udGV4dC5zaGFkb3dCbHVyID0gNCAqIGRldmljZVBpeGVsUmF0aW87XG5cdFx0ICAgIGNvbnRleHQuZmlsbFN0eWxlID0gJ3doaXRlJztcblx0XHQgICAgY29udGV4dC5maWxsKCk7XG5cdFx0ICB9KTtcblxuXHRcdCAgY29udGV4dC5kcmF3SW1hZ2UoaW1nLCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXHRcdH1cblx0fTtcbn1dKVxuLmRpcmVjdGl2ZSgnYXBwJywgWyBcblx0ZnVuY3Rpb24oKXtcblxuXHRyZXR1cm4ge1xuXHRcdHRlbXBsYXRlVXJsOiAnLi9jb21wb25lbnRzL2FwcC5odG1sJyxcblx0XHRjb250cm9sbGVyQXMgOiAnYmxlQ3RybCcsXG5cdFx0YmluZFRvQ29udHJvbGxlciA6IHRydWUsXG5cdFx0Y29udHJvbGxlcjogcmVxdWlyZSgnLi9zZW5zb3JzL2JsdWV0b290aCcpXG5cdH1cbn1dKTtcblxuXG5mdW5jdGlvbiBwYWdlTG9hZCgpe1x0XHRcbn1cblxuXG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgcGFnZUxvYWQpOyIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBERVZJQ0VfTkFNRSA9IFwiTWFrZWJsb2NrX0xFXCIsXG5cdFNFUlZJQ0VfVVVJRCA9IFwiMDAwMGZmZTEtMDAwMC0xMDAwLTgwMDAtMDA4MDVmOWIzNGZiXCIsXG5cdENIQVJBQ1RFUklTVElDX1VVSUQgPSBcIjAwMDBmZmUzLTAwMDAtMTAwMC04MDAwLTAwODA1ZjliMzRmYlwiO1xuXG5jb25zdCBUWVBFX01PVE9SID0gMHgwYSxcblx0VFlQRV9SR0IgPSAweDA4LFxuXHRUWVBFX1NPVU5EID0gMHgwNztcblxuXG5jb25zdCBQT1JUXzEgPSAweDAxLFxuXHRQT1JUXzIgPSAweDAyLFxuXHRQT1JUXzMgPSAweDAzLFxuXHRQT1JUXzQgPSAweDA0LFxuXHRQT1JUXzUgPSAweDA1LFxuXHRQT1JUXzYgPSAweDA2LFxuXHRQT1JUXzcgPSAweDA3LFxuXHRQT1JUXzggPSAweDA4LFxuXHRNXzEgPSAweDA5LFxuXHRNXzIgPSAweDBhO1xuXG5mdW5jdGlvbiBnZW5lcmljQ29udHJvbCh0eXBlLCBwb3J0LCBzbG90LCB2YWx1ZSl7XG5cdC8qXG5cdGZmIDU1IGxlbiBpZHggYWN0aW9uIGRldmljZSBwb3J0ICBzbG90ICBkYXRhIGFcblx0MCAgMSAgMiAgIDMgICA0ICAgICAgNSAgICAgIDYgICAgIDcgICAgIDhcblx0Ki9cblx0Ly91bnNpZ25lZCBjaGFyIGFbMTFdPXsweGZmLDB4NTUsV1JJVEVNT0RVTEUsNywwLDAsMCwwLDAsMCwnXFxuJ307XG4gICAgLy9hWzRdID0gW3R5cGUgaW50VmFsdWVdO1xuICAgIC8vYVs1XSA9IChwb3J0PDw0ICYgMHhmMCl8KHNsb3QgJiAweGYpO1xuICAgIC8vIFN0YXRpYyB2YWx1ZXNcblx0dmFyIGJ1ZiA9IG5ldyBBcnJheUJ1ZmZlcigxNik7XG5cdHZhciBidWZWaWV3ID0gbmV3IFVpbnQxNkFycmF5KGJ1Zik7XG5cdFxuXHR2YXIgYnl0ZTAgPSAweGZmLFxuXHRcdGJ5dGUxID0gMHg1NSxcblx0XHRieXRlMiA9IDB4MDksXG5cdFx0Ynl0ZTMgPSAweDAwLFxuXHRcdGJ5dGU0ID0gMHgwMixcblx0XHRieXRlNSA9IHR5cGUsXG5cdFx0Ynl0ZTYgPSBwb3J0LFxuXHRcdGJ5dGU3ID0gc2xvdDtcblx0Ly9keW5hbWljcyB2YWx1ZXNcblx0dmFyIGJ5dGU4ID0gMHgwMCxcblx0XHRieXRlOSA9IDB4MDAsXG5cdFx0Ynl0ZTEwID0gMHgwMCxcblx0XHRieXRlMTEgPSAweDAwO1xuXHQvL0VuZCBvZiBtZXNzYWdlXG5cdHZhciBieXRlMTIgPSAweDBhLFxuXHRcdGJ5dGUxMyA9IDB4MDAsXG5cdFx0Ynl0ZTE0ID0gMHgwMCxcblx0XHRieXRlMTUgPSAweDAwO1xuXG5cdHN3aXRjaCh0eXBlKXtcblx0XHRjYXNlIFRZUEVfTU9UT1I6XG5cdFx0XHQvLyBNb3RvciBNMVxuXHRcdFx0Ly8gZmY6NTUgIDA5OjAwICAwMjowYSAgMDk6NjQgIDAwOjAwICAwMDowMCAgMGFcIlxuXHRcdFx0Ly8gMHg1NWZmOzB4MDAwOTsweDBhMDI7MHgwOTY0OzB4MDAwMDsweDAwMDA7MHgwMDBhOzB4MDAwMDtcblx0XHRcdC8vXCJmZjo1NTowOTowMDowMjowYTowOTowMDowMDowMDowMDowMDowYVwiXG5cdFx0XHQvLyBmZjo1NTowOTowMDowMjowYTowOTo5YzpmZjowMDowMDowMDowYVxuXHRcdFx0Ly8gTW90b3IgTTJcblx0XHRcdC8vIGZmOjU1OjA5OjAwOjAyOjBhOjBhOjY0OjAwOjAwOjAwOjAwOjBhXG5cdFx0XHQvLyBmZjo1NTowOTowMDowMjowYTowYTowMDowMDowMDowMDowMDowYVxuXHRcdFx0Ly8gZmY6NTU6MDk6MDA6MDI6MGE6MGE6OWM6ZmY6MDA6MDA6MDA6MGFcblx0XHRcdHZhciB0ZW1wVmFsdWUgPSB2YWx1ZSA8IDAgPyAocGFyc2VJbnQoXCJmZmZmXCIsMTYpICsgTWF0aC5tYXgoLTI1NSx2YWx1ZSkpIDogTWF0aC5taW4oMjU1LCB2YWx1ZSk7XG5cdFx0XHRieXRlNyA9IHRlbXBWYWx1ZSAmIDB4MDBmZjtcdFx0XHRcblx0XHRcdGJ5dGU4ID0gMHgwMDtcblx0XHRcdGJ5dGU4ID0gdGVtcFZhbHVlID4+ODsgXG5cblx0XHRcdC8qYnl0ZTUgPSAweDBhO1xuXHRcdFx0Ynl0ZTYgPSAweDA5O1xuXHRcdFx0Ynl0ZTcgPSAweDY0O1xuXHRcdFx0Ynl0ZTggPSAweDAwOyovXG5cdFx0XHRcblx0XHRicmVhaztcblx0XHRjYXNlIFRZUEVfUkdCOlxuXHRcdFx0Ly8gZmY6NTUgIDA5OjAwICAwMjowOCAgMDY6MDAgIDVjOjk5ICA2ZDowMCAgMGFcblx0XHRcdC8vIDB4NTVmZjsweDAwMDk7MHgwODAyOzB4MDAwNjsweDk5NWM7MHgwMDZkOzB4MDAwYTsweDAwMDA7XG5cdFx0XHRieXRlNyA9IDB4MDA7XG5cdFx0XHRieXRlOCA9IHZhbHVlPj44ICYgMHhmZjtcblx0XHRcdGJ5dGU5ID0gdmFsdWU+PjE2ICYgMHhmZjtcblx0XHRcdGJ5dGUxMCA9IHZhbHVlPj4yNCAmIDB4ZmY7XG5cdFx0YnJlYWs7XG5cdFx0Y2FzZSBUWVBFX1NPVU5EOlxuXHRcdFx0Ly9mZjo1NTowNTowMDowMjoyMjowMDowMDowYVxuXHRcdFx0Ly9mZjo1NTowNTowMDowMjoyMjowNjowMTowYVxuXHRcdFx0Ly9mZjo1NTowNTowMDowMjoyMjplZTowMTowYVxuXHRcdFx0Ly9mZjo1NTowNTowMDowMjoyMjo4ODowMTowYVxuXHRcdFx0Ly9mZjo1NTowNTowMDowMjoyMjpiODowMTowYVxuXHRcdFx0Ly9mZjo1NTowNTowMDowMjoyMjo1ZDowMTowYVxuXHRcdFx0Ly9mZjo1NTowNTowMDowMjoyMjo0YTowMTowYVxuXHRcdFx0Ly9mZjo1NTowNTowMDowMjoyMjoyNjowMTowYVxuICAgICAgICAgICAgYnl0ZTIgPSAweDA1O1xuXHRcdFx0Ynl0ZTMgPSAweDAwO1xuXHRcdFx0Ynl0ZTQgPSAweDAyO1xuXHRcdFx0Ynl0ZTUgPSAweDIyO1xuXHRcdFx0aWYgKHZhbHVlID09PSAwKXtcblx0XHRcdFx0Ynl0ZTYgPSAweDA2O1xuXHRcdFx0XHRieXRlNyA9IDB4MDE7XG5cdFx0XHR9ZWxzZXtcblxuXHRcdFx0XHRieXRlNiA9IDB4ZWU7XG5cdFx0XHRcdGJ5dGU3ID0gMHgwMTtcblx0XHRcdH1cblx0XHRcdGJ5dGU4ID0gMHgwYTtcblx0XHRcdGJ5dGUxMj0gMHgwMDtcblxuXHRcdGJyZWFrO1xuXHR9XG5cblx0YnVmVmlld1swXSA9IGJ5dGUxPDw4IHwgYnl0ZTA7XG5cdGJ1ZlZpZXdbMV0gPSBieXRlMzw8OCB8IGJ5dGUyO1xuXHRidWZWaWV3WzJdID0gYnl0ZTU8PDggfCBieXRlNDtcblx0YnVmVmlld1szXSA9IGJ5dGU3PDw4IHwgYnl0ZTY7XG5cdGJ1ZlZpZXdbNF0gPSBieXRlOTw8OCB8IGJ5dGU4O1xuXHRidWZWaWV3WzVdID0gYnl0ZTExPDw4IHwgYnl0ZTEwO1xuXHRidWZWaWV3WzZdID0gYnl0ZTEzPDw4IHwgYnl0ZTEyO1xuXHRidWZWaWV3WzddID0gYnl0ZTE1PDw4IHwgYnl0ZTE0O1xuXHRjb25zb2xlLmxvZyhcblx0XHRcdGJ5dGUwLnRvU3RyaW5nKDE2KStcIjpcIitcblx0XHRcdGJ5dGUxLnRvU3RyaW5nKDE2KStcIjpcIitcblx0XHRcdGJ5dGUyLnRvU3RyaW5nKDE2KStcIjpcIitcblx0XHRcdGJ5dGUzLnRvU3RyaW5nKDE2KStcIjpcIitcblx0XHRcdGJ5dGU0LnRvU3RyaW5nKDE2KStcIjpcIitcblx0XHRcdGJ5dGU1LnRvU3RyaW5nKDE2KStcIjpcIitcblx0XHRcdGJ5dGU2LnRvU3RyaW5nKDE2KStcIjpcIitcblx0XHRcdGJ5dGU3LnRvU3RyaW5nKDE2KStcIjpcIitcblx0XHRcdGJ5dGU4LnRvU3RyaW5nKDE2KStcIjpcIitcblx0XHRcdGJ5dGU5LnRvU3RyaW5nKDE2KStcIjpcIitcblx0XHRcdGJ5dGUxMC50b1N0cmluZygxNikrXCI6XCIrXG5cdFx0XHRieXRlMTEudG9TdHJpbmcoMTYpK1wiOlwiK1xuXHRcdFx0Ynl0ZTEyLnRvU3RyaW5nKDE2KStcIjpcIitcblx0XHRcdGJ5dGUxMy50b1N0cmluZygxNikrXCI6XCIrXG5cdFx0XHRieXRlMTQudG9TdHJpbmcoMTYpK1wiOlwiK1xuXHRcdFx0Ynl0ZTE1LnRvU3RyaW5nKDE2KStcIjpcIlxuXHRcdFx0KTtcblx0Y29uc29sZS5sb2coXG5cdFx0XHRidWZWaWV3WzBdLnRvU3RyaW5nKDE2KStcIjpcIitcblx0XHRcdGJ1ZlZpZXdbMV0udG9TdHJpbmcoMTYpK1wiOlwiK1xuXHRcdFx0YnVmVmlld1syXS50b1N0cmluZygxNikrXCI6XCIrXG5cdFx0XHRidWZWaWV3WzNdLnRvU3RyaW5nKDE2KStcIjpcIitcblx0XHRcdGJ1ZlZpZXdbNF0udG9TdHJpbmcoMTYpK1wiOlwiK1xuXHRcdFx0YnVmVmlld1s1XS50b1N0cmluZygxNikrXCI6XCIrXG5cdFx0XHRidWZWaWV3WzZdLnRvU3RyaW5nKDE2KStcIjpcIitcblx0XHRcdGJ1ZlZpZXdbN10udG9TdHJpbmcoMTYpXG5cdFx0XHQpO1xuXHRyZXR1cm4gYnVmO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHQnREVWSUNFX05BTUUnIDogREVWSUNFX05BTUUsXG5cdCdTRVJWSUNFX1VVSUQnIDogU0VSVklDRV9VVUlELFxuXHQnQ0hBUkFDVEVSSVNUSUNfVVVJRCcgOiBDSEFSQUNURVJJU1RJQ19VVUlELFxuXHQnVFlQRV9NT1RPUicgOiBUWVBFX01PVE9SLFxuXHQnVFlQRV9SR0InIDogVFlQRV9SR0IsXG5cdCdUWVBFX1NPVU5EJyA6IFRZUEVfU09VTkQsXG5cdCdQT1JUXzEnIDogUE9SVF8xLFxuXHQnUE9SVF8yJyA6IFBPUlRfMixcblx0J1BPUlRfMycgOiBQT1JUXzMsXG5cdCdQT1JUXzQnIDogUE9SVF80LFxuXHQnUE9SVF81JyA6IFBPUlRfNSxcblx0J1BPUlRfNicgOiBQT1JUXzYsXG5cdCdQT1JUXzcnIDogUE9SVF83LFxuXHQnUE9SVF84JyA6IFBPUlRfOCxcblx0J01fMScgOiBNXzEsXG5cdCdNXzInIDogTV8yLFxuXHQnZ2VuZXJpY0NvbnRyb2wnIDogZ2VuZXJpY0NvbnRyb2xcbn07IiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IG1ib3RBcGkgPSByZXF1aXJlKCcuLi9tYm90L21ib3QnKTsgIFxuXG52YXIgc2VydmVyR0FUVCA9IG51bGwsXG5cdHNlcnZpY2VHQVRUID0gbnVsbCxcblx0Y2hhcmFjdGVyaXN0aWNHQVRUID0gbnVsbCxcblx0ZW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuXG5mdW5jdGlvbiBpbml0QmxlKCl7XG5cdHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuXHRcdG5hdmlnYXRvci5ibHVldG9vdGgucmVxdWVzdERldmljZSh7IFxuXHRcdFx0ZmlsdGVyczogW3sgbmFtZTogbWJvdEFwaS5ERVZJQ0VfTkFNRSB9XSwgb3B0aW9uYWxTZXJ2aWNlczogW21ib3RBcGkuU0VSVklDRV9VVUlEXVxuXHRcdH0pXG5cdFx0LnRoZW4oZnVuY3Rpb24oZGV2aWNlKSB7XG5cdFx0ICAgY29uc29sZS5sb2coXCJDb25uZWN0aW5nLi4uXCIpO1xuXHRcdCAgIHJldHVybiBkZXZpY2UuY29ubmVjdEdBVFQoKTtcblx0XHQgfSlcblx0XHQudGhlbihmdW5jdGlvbihzZXJ2ZXIpIHtcblx0XHRcdHNlcnZlckdBVFQgPSBzZXJ2ZXI7XG5cdFx0XHQvL3JldHVybiBzZXJ2ZXIuZ2V0UHJpbWFyeVNlcnZpY2Uoc2VydmljZVVVSUQpO1xuXHRcdCAgIC8vIEZJWE1FOiBSZW1vdmUgdGhpcyB0aW1lb3V0IHdoZW4gR2F0dFNlcnZpY2VzIHByb3BlcnR5IHdvcmtzIGFzIGludGVuZGVkLlxuXHRcdCAgIC8vIGNyYnVnLmNvbS81NjAyNzdcblx0XHQgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZVNlcnZpY2UsIHJlamVjdFNlcnZpY2UpIHtcblx0XHQgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0ICAgICBcdHRyeXtcblx0XHQgICAgIFx0XHRjb25zb2xlLmxvZyhcIlRyeSB0byBnZXQgU2VydmljZVwiKTtcblx0XHQgICAgICAgXHRcdHJlc29sdmVTZXJ2aWNlKHNlcnZlci5nZXRQcmltYXJ5U2VydmljZShtYm90QXBpLlNFUlZJQ0VfVVVJRCkpO1xuXHRcdCAgICAgXHR9Y2F0Y2goZXJyKXtcblx0XHQgICAgIFx0XHRyZWplY3RTZXJ2aWNlKGVycik7XG5cdFx0ICAgICBcdH1cblx0XHQgICAgIH0sIDJlMyk7XG5cdFx0ICAgfSlcblx0XHR9KS50aGVuKGZ1bmN0aW9uKHNlcnZpY2Upe1xuXHRcdFx0c2VydmljZUdBVFQgPSBzZXJ2aWNlO1xuXHRcdFx0cmVzb2x2ZShzZXJ2aWNlKTtcdFx0XHRcblx0XHR9KS5jYXRjaChmdW5jdGlvbihlcnJvcil7XG5cdFx0XHRjb25zb2xlLmVycm9yKGVycm9yKTtcblx0XHRcdHJlamVjdChlcnJvcik7XG5cdFx0fSk7XG5cdH0pXG59XG5cblxuZnVuY3Rpb24gZ2V0U2VydmljZSgpe1xuXHRyZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcblx0XHRpZiAoc2VydmVyR0FUVCAmJiBzZXJ2ZXJHQVRULmNvbm5lY3RlZCAmJiBzZXJ2aWNlR0FUVCl7XG5cdFx0XHRyZXNvbHZlKHNlcnZpY2VHQVRUKTtcblx0XHR9ZWxzZXtcblx0XHRcdGluaXRCbGUoKVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oc2VydmljZSl7XG5cdFx0XHRcdHJlc29sdmUoc2VydmljZSk7XG5cdFx0XHR9KVxuXHRcdFx0LmNhdGNoKGZ1bmN0aW9uKGVycm9yKXtcblx0XHRcdFx0cmVqZWN0KGVycm9yKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fSk7XG59XG5cbmZ1bmN0aW9uIGdldENoYXJhY3RlcmlzdGljKCl7XG5cdHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuXHRcdGlmIChjaGFyYWN0ZXJpc3RpY0dBVFQpe1xuXHRcdFx0cmVzb2x2ZShjaGFyYWN0ZXJpc3RpY0dBVFQpO1xuXHRcdH1lbHNle1xuXHRcdFx0Z2V0U2VydmljZSgpXG5cdFx0XHQudGhlbihmdW5jdGlvbihzZXJ2aWNlKXtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJUcnkgdG8gZ2V0IENoYXJhY3Rlcml0aWMgOiAlT1wiLHNlcnZpY2UpO1xuXHRcdFx0XHRyZXR1cm4gc2VydmljZS5nZXRDaGFyYWN0ZXJpc3RpYyhtYm90QXBpLkNIQVJBQ1RFUklTVElDX1VVSUQpO1xuXHRcdFx0fSlcblx0XHRcdC50aGVuKGZ1bmN0aW9uKGNoYXJhY3Rlcml0aWMpe1xuXHRcdFx0XHRjaGFyYWN0ZXJpc3RpY0dBVFQgPSBjaGFyYWN0ZXJpdGljO1xuXHRcdFx0XHRyZXNvbHZlKGNoYXJhY3Rlcml0aWMpO1xuXHRcdFx0fSkuY2F0Y2goZnVuY3Rpb24oZXJyb3Ipe1xuXHRcdFx0XHRyZWplY3QoZXJyb3IpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9KTtcbn1cblxuZnVuY3Rpb24gcHJvY2Vzc0NoYXJhY3RlcmlzdGljKHR5cGUsIGRhdGEsIGNhbGxiYWNrKXtcblx0Z2V0Q2hhcmFjdGVyaXN0aWMoKVxuXHQudGhlbihmdW5jdGlvbihjaGFyYWN0ZXJpc3RpYyl7XG5cdFx0aWYgKHR5cGUgPT09ICd3cml0ZScpe1x0XHRcdFxuXHRcdFx0Y29uc29sZS5sb2coXCJUcnkgdG8gd3JpdGUgdmFsdWUgOiAlT1wiLGNoYXJhY3RlcmlzdGljKTtcblx0XHRcdHJldHVybiBjaGFyYWN0ZXJpc3RpYy53cml0ZVZhbHVlKGRhdGEpO1xuXHRcdH1cblx0fSkudGhlbihmdW5jdGlvbihidWZmZXIpe1xuXHRcdGlmICh0eXBlID09PSAnd3JpdGUnKXtcblx0XHRcdGlmKGNhbGxiYWNrKXtcblx0XHRcdFx0Y2FsbGJhY2soe3R5cGU6ICd3cml0ZScsIHZhbHVlIDogdHJ1ZX0pO1x0XHRcdFxuXHRcdFx0fVxuXHRcdFx0Y29uc29sZS5pbmZvKFwiV3JpdGUgZGF0YXMgISBcIik7XG5cdFx0fWVsc2V7XG5cdFx0XHRsZXQgZGF0YSA9IG5ldyBEYXRhVmlldyhidWZmZXIpO1xuXHRcdCAgICBsZXQgZGF0YURlY3J5cHQgPSBkYXRhLmdldFVpbnQ4KDApO1xuXHRcdCAgICBjYWxsYmFjayh7dHlwZTogJ3JlYWQnICwgdmFsdWUgOiBkYXRhRGVjcnlwdH0pO1xuXHRcdCAgICBjb25zb2xlLmxvZygnUmVjZWl2ZURhdGFzICVzJywgZGF0YURlY3J5cHQpO1xuXHRcdH1cblx0fSkuY2F0Y2goZnVuY3Rpb24oZXJyb3Ipe1xuXHRcdGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuXHRcdGlmIChjYWxsYmFjaykge1xuXG5cdFx0XHRjYWxsYmFjayh7dHlwZSA6ICdlcnJvcicsIHZhbHVlIDogZXJyb3J9KTtcblx0XHR9XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBwcm9jZXNzTW90b3JzKHZhbHVlTTEsIHZhbHVlTTIpe1xuXHRnZXRDaGFyYWN0ZXJpc3RpYygpXG5cdC50aGVuKGNoYXJhY3RlcmlzdGljID0+e1xuXHRcdHJldHVybiBjaGFyYWN0ZXJpc3RpYy53cml0ZVZhbHVlKG1ib3RBcGkuZ2VuZXJpY0NvbnRyb2wobWJvdEFwaS5UWVBFX01PVE9SLCBtYm90QXBpLk1fMSwgMCwgdmFsdWVNMSkpO1xuXHR9KS50aGVuKCgpPT57XG5cdFx0cmV0dXJuIGNoYXJhY3RlcmlzdGljR0FUVC53cml0ZVZhbHVlKG1ib3RBcGkuZ2VuZXJpY0NvbnRyb2wobWJvdEFwaS5UWVBFX01PVE9SLCBtYm90QXBpLk1fMiwgMCwgdmFsdWVNMikpO1xuXHR9KS50aGVuKCgpPT57XG5cdFx0aWYoY2FsbGJhY2spe1xuXHRcdFx0Y2FsbGJhY2soe3R5cGU6ICd3cml0ZScsIHZhbHVlIDogdHJ1ZX0pO1x0XHRcdFxuXHRcdH1cblx0XHRjb25zb2xlLmluZm8oXCJXcml0ZSBkYXRhcyAhIFwiKTtcblx0fSkuY2F0Y2goZXJyb3IgPT57XG5cdFx0Y29uc29sZS5lcnJvcihlcnJvcik7XG5cdFx0aWYgKGNhbGxiYWNrKSB7XG5cdFx0XHRjYWxsYmFjayh7dHlwZSA6ICdlcnJvcicsIHZhbHVlIDogZXJyb3J9KTtcblx0XHR9XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBwcm9jZXNzQnV6emVyKCl7XG4gICAgZ2V0Q2hhcmFjdGVyaXN0aWMoKVxuXHQudGhlbihjaGFyYWN0ZXJpc3RpYyA9Pntcblx0XHRyZXR1cm4gY2hhcmFjdGVyaXN0aWMud3JpdGVWYWx1ZShtYm90QXBpLmdlbmVyaWNDb250cm9sKG1ib3RBcGkuVFlQRV9TT1VORCwgMCwgMCwgMCkpO1xuXHR9KS50aGVuKCgpPT57XG5cdFx0Y29uc29sZS5pbmZvKFwiV3JpdGUgZGF0YXMgISBcIik7XG5cdH0pLmNhdGNoKGVycm9yID0+e1xuXHRcdGNvbnNvbGUuZXJyb3IoZXJyb3IpO1x0XHRcblx0fSk7XG59XG5cblxuZnVuY3Rpb24gQmxlQ29udHJvbGxlcigpe1xuXG5cdHRoaXMuY3VycmVudFRpbWVyID0gbnVsbDtcblx0dGhpcy5wb3dlciA9IDEyNTtcblx0dGhpcy5yZWQgPSAwO1xuXG5cdFxuXHR0aGlzLmNvbm5lY3QgPSBmdW5jdGlvbigpe1xuXHRcdHByb2Nlc3NDaGFyYWN0ZXJpc3RpYygnd3JpdGUnLCBcIm9uXCIpO1xuXHR9XG5cblx0dGhpcy51cCA9IGZ1bmN0aW9uKGV2ZW50KXtcblx0XHRjb25zb2xlLmxvZyhcInVwXCIpO1xuXHRcdHByb2Nlc3NNb3RvcnMoLTEwMCwxMDApO1xuXHR9XG5cblx0dGhpcy5kb3duID0gZnVuY3Rpb24oKXtcblx0XHRjb25zb2xlLmxvZyhcImRvd25cIik7XG5cdFx0cHJvY2Vzc01vdG9ycygxMDAsLTEwMCk7XG5cdH1cblx0XG5cdHRoaXMubGVmdCA9IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc29sZS5sb2coXCJsZWZ0XCIpO1xuXHRcdHByb2Nlc3NNb3RvcnMoMTAwLDEwMCk7XG5cdH07XG5cblx0dGhpcy5yaWdodCA9IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc29sZS5sb2coXCJyaWdodFwiKTtcblx0XHRwcm9jZXNzTW90b3JzKC0xMDAsLTEwMCk7XG5cdH07XG4gICAgXG4gICAgdGhpcy5idXp6ID0gZnVuY3Rpb24oKXtcblx0XHRjb25zb2xlLmxvZyhcImJ1enpcIik7XG5cdFx0cHJvY2Vzc0J1enplcigpO1xuXHR9O1xuXG5cdHRoaXMuc3RvcCA9IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc29sZS5sb2coXCJzdG9wXCIpO1xuXHRcdHByb2Nlc3NNb3RvcnMoMCwwKTtcblx0fVxuXG5cdHRoaXMuY2hhbmdlQ29sb3IgPSBmdW5jdGlvbihyZWQsYmx1ZSxncmVlbil7IFxuXHRcdGNvbnNvbGUubG9nKFwiQ2hhbmdlIENvbG9yIDogJWQsJWQsJWRcIixyZWQsZ3JlZW4sYmx1ZSk7XG5cdFx0dmFyIHJIZXggPSByZWQ8PDg7XG5cdFx0dmFyIGdIZXggPSBncmVlbjw8MTY7XG5cdFx0dmFyIGJIZXggPSBibHVlPDwyNDtcblx0XHR2YXIgdmFsdWUgPSBySGV4IHwgZ0hleCB8IGJIZXg7XG5cdFx0cHJvY2Vzc0NoYXJhY3RlcmlzdGljKCd3cml0ZScsIG1ib3RBcGkuZ2VuZXJpY0NvbnRyb2wobWJvdEFwaS5UWVBFX1JHQixtYm90QXBpLlBPUlRfNiwwLHZhbHVlKSk7XG5cdH07XG5cblxufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gQmxlQ29udHJvbGxlcjtcblxuIl19
