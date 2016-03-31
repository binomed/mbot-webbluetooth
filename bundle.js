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
		controllerAs : 'app',
		bindToController : true,
		controller: require('./sensors/bluetooth')/*function(){
			this.actions = [
				{label : "Bluetooth", icon : 'fa-bluetooth', idAction: 'ble'}
			];

					

			this.openDialog = function(event, type){
				console.log('Open Dialog');
				if (type === 'ble'){
					$mdDialog.show({
						controllerAs : 'bleCtrl',
						templateUrl: './components/bluetooth.html',
						controller: require('./sensors/bluetooth'),
						parent : angular.element(document.querySelector('#mainContainer')),
						targetEvent : event,
						fullScreen : true
					});
				}
			}
		}*/
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
			byte3 = 0x05;
			byte4 = 0x00;
			byte5 = 0x02;
			byte6 = 0x22;
			if (value === 0){
				byte7 = 0x00;
				byte8 = 0x00;
			}else{

				byte7 = 0xee;
				byte8 = 0x01;
			}
			byte9 = 0x0a;
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzY3JpcHRzL2FwcC5qcyIsInNjcmlwdHMvbWJvdC9tYm90LmpzIiwic2NyaXB0cy9zZW5zb3JzL2JsdWV0b290aC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnXG5cbmFuZ3VsYXIubW9kdWxlKFwiTWJvdEFwcFwiLCBbJ25nTWF0ZXJpYWwnXSlcbi5jb25maWcoZnVuY3Rpb24oJG1kVGhlbWluZ1Byb3ZpZGVyKSB7XG4gICRtZFRoZW1pbmdQcm92aWRlci50aGVtZSgnZGVmYXVsdCcpXG4gICAgLnByaW1hcnlQYWxldHRlKCdsaWdodC1ibHVlJylcbiAgICAuYWNjZW50UGFsZXR0ZSgnb3JhbmdlJyk7XG59KVxuLmRpcmVjdGl2ZSgnbWJvdFRvdWNoc3RhcnQnLCBbZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRyKSB7XG5cbiAgICAgICAgZWxlbWVudC5vbigndG91Y2hzdGFydCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHsgXG4gICAgICAgICAgICAgICAgc2NvcGUuJGV2YWwoYXR0ci5tYm90VG91Y2hzdGFydCk7IFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG59XSkuZGlyZWN0aXZlKCdtYm90VG91Y2hlbmQnLCBbZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRyKSB7XG5cbiAgICAgICAgZWxlbWVudC5vbigndG91Y2hlbmQnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7IFxuICAgICAgICAgICAgICAgIHNjb3BlLiRldmFsKGF0dHIubWJvdFRvdWNoZW5kKTsgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn1dKVxuLmRpcmVjdGl2ZSgnbWJvdENvbG9ycGlja2VyJywgW2Z1bmN0aW9uKCl7XG5cdHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cil7XG5cdFx0dmFyIGltZyA9IG5ldyBJbWFnZSgpO1xuXHRcdGltZy5zcmMgPSAnLi9hc3NldHMvaW1hZ2VzL2NvbG9yLXdoZWVsLnBuZydcblx0XHRpbWcub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0ICB2YXIgY2FudmFzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignY2FudmFzJyk7XG5cdFx0ICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG5cdFx0ICBjYW52YXMud2lkdGggPSAxNTAgKiBkZXZpY2VQaXhlbFJhdGlvO1xuXHRcdCAgY2FudmFzLmhlaWdodCA9IDE1MCAqIGRldmljZVBpeGVsUmF0aW87XG5cdFx0ICBjYW52YXMuc3R5bGUud2lkdGggPSBcIjE1MHB4XCI7XG5cdFx0ICBjYW52YXMuc3R5bGUuaGVpZ2h0ID0gXCIxNTBweFwiO1xuXHRcdCAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZ0KSB7XG5cdFx0ICAgIC8vIFJlZnJlc2ggY2FudmFzIGluIGNhc2UgdXNlciB6b29tcyBhbmQgZGV2aWNlUGl4ZWxSYXRpbyBjaGFuZ2VzLlxuXHRcdCAgICBjYW52YXMud2lkdGggPSAxNTAgKiBkZXZpY2VQaXhlbFJhdGlvO1xuXHRcdCAgICBjYW52YXMuaGVpZ2h0ID0gMTUwICogZGV2aWNlUGl4ZWxSYXRpbztcblx0XHQgICAgY29udGV4dC5kcmF3SW1hZ2UoaW1nLCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXG5cdFx0ICAgIHZhciByZWN0ID0gY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdCAgICB2YXIgeCA9IE1hdGgucm91bmQoKGV2dC5jbGllbnRYIC0gcmVjdC5sZWZ0KSAqIGRldmljZVBpeGVsUmF0aW8pO1xuXHRcdCAgICB2YXIgeSA9IE1hdGgucm91bmQoKGV2dC5jbGllbnRZIC0gcmVjdC50b3ApICogZGV2aWNlUGl4ZWxSYXRpbyk7XG5cdFx0ICAgIHZhciBkYXRhID0gY29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KS5kYXRhO1xuXG5cdFx0ICAgIHZhciByID0gZGF0YVsoKGNhbnZhcy53aWR0aCAqIHkpICsgeCkgKiA0XTtcblx0XHQgICAgdmFyIGcgPSBkYXRhWygoY2FudmFzLndpZHRoICogeSkgKyB4KSAqIDQgKyAxXTtcblx0XHQgICAgdmFyIGIgPSBkYXRhWygoY2FudmFzLndpZHRoICogeSkgKyB4KSAqIDQgKyAyXTtcblx0XHQgICAgXG5cdFx0ICAgIHNjb3BlLiRldmFsKGF0dHIubWJvdENvbG9ycGlja2VyLCB7XG5cdFx0ICAgIFx0cmVkOnIsXG5cdFx0ICAgIFx0Ymx1ZTpiLFxuXHRcdCAgICBcdGdyZWVuOmdcblx0XHQgICAgfSk7IFxuXHRcdCAgICBcblxuXHRcdCAgICBjb250ZXh0LmJlZ2luUGF0aCgpO1xuXHRcdCAgICBjb250ZXh0LmFyYyh4LCB5ICsgMiwgMTAgKiBkZXZpY2VQaXhlbFJhdGlvLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuXHRcdCAgICBjb250ZXh0LnNoYWRvd0NvbG9yID0gJyMzMzMnO1xuXHRcdCAgICBjb250ZXh0LnNoYWRvd0JsdXIgPSA0ICogZGV2aWNlUGl4ZWxSYXRpbztcblx0XHQgICAgY29udGV4dC5maWxsU3R5bGUgPSAnd2hpdGUnO1xuXHRcdCAgICBjb250ZXh0LmZpbGwoKTtcblx0XHQgIH0pO1xuXG5cdFx0ICBjb250ZXh0LmRyYXdJbWFnZShpbWcsIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cdFx0fVxuXHR9O1xufV0pXG4uZGlyZWN0aXZlKCdhcHAnLCBbIFxuXHRmdW5jdGlvbigpe1xuXG5cdHJldHVybiB7XG5cdFx0dGVtcGxhdGVVcmw6ICcuL2NvbXBvbmVudHMvYXBwLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXJBcyA6ICdhcHAnLFxuXHRcdGJpbmRUb0NvbnRyb2xsZXIgOiB0cnVlLFxuXHRcdGNvbnRyb2xsZXI6IHJlcXVpcmUoJy4vc2Vuc29ycy9ibHVldG9vdGgnKS8qZnVuY3Rpb24oKXtcblx0XHRcdHRoaXMuYWN0aW9ucyA9IFtcblx0XHRcdFx0e2xhYmVsIDogXCJCbHVldG9vdGhcIiwgaWNvbiA6ICdmYS1ibHVldG9vdGgnLCBpZEFjdGlvbjogJ2JsZSd9XG5cdFx0XHRdO1xuXG5cdFx0XHRcdFx0XG5cblx0XHRcdHRoaXMub3BlbkRpYWxvZyA9IGZ1bmN0aW9uKGV2ZW50LCB0eXBlKXtcblx0XHRcdFx0Y29uc29sZS5sb2coJ09wZW4gRGlhbG9nJyk7XG5cdFx0XHRcdGlmICh0eXBlID09PSAnYmxlJyl7XG5cdFx0XHRcdFx0JG1kRGlhbG9nLnNob3coe1xuXHRcdFx0XHRcdFx0Y29udHJvbGxlckFzIDogJ2JsZUN0cmwnLFxuXHRcdFx0XHRcdFx0dGVtcGxhdGVVcmw6ICcuL2NvbXBvbmVudHMvYmx1ZXRvb3RoLmh0bWwnLFxuXHRcdFx0XHRcdFx0Y29udHJvbGxlcjogcmVxdWlyZSgnLi9zZW5zb3JzL2JsdWV0b290aCcpLFxuXHRcdFx0XHRcdFx0cGFyZW50IDogYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYWluQ29udGFpbmVyJykpLFxuXHRcdFx0XHRcdFx0dGFyZ2V0RXZlbnQgOiBldmVudCxcblx0XHRcdFx0XHRcdGZ1bGxTY3JlZW4gOiB0cnVlXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9Ki9cblx0fVxufV0pO1xuXG5cbmZ1bmN0aW9uIHBhZ2VMb2FkKCl7XHRcdFxufVxuXG5cblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBwYWdlTG9hZCk7IiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IERFVklDRV9OQU1FID0gXCJNYWtlYmxvY2tfTEVcIixcblx0U0VSVklDRV9VVUlEID0gXCIwMDAwZmZlMS0wMDAwLTEwMDAtODAwMC0wMDgwNWY5YjM0ZmJcIixcblx0Q0hBUkFDVEVSSVNUSUNfVVVJRCA9IFwiMDAwMGZmZTMtMDAwMC0xMDAwLTgwMDAtMDA4MDVmOWIzNGZiXCI7XG5cbmNvbnN0IFRZUEVfTU9UT1IgPSAweDBhLFxuXHRUWVBFX1JHQiA9IDB4MDgsXG5cdFRZUEVfU09VTkQgPSAweDA3O1xuXG5cbmNvbnN0IFBPUlRfMSA9IDB4MDEsXG5cdFBPUlRfMiA9IDB4MDIsXG5cdFBPUlRfMyA9IDB4MDMsXG5cdFBPUlRfNCA9IDB4MDQsXG5cdFBPUlRfNSA9IDB4MDUsXG5cdFBPUlRfNiA9IDB4MDYsXG5cdFBPUlRfNyA9IDB4MDcsXG5cdFBPUlRfOCA9IDB4MDgsXG5cdE1fMSA9IDB4MDksXG5cdE1fMiA9IDB4MGE7XG5cbmZ1bmN0aW9uIGdlbmVyaWNDb250cm9sKHR5cGUsIHBvcnQsIHNsb3QsIHZhbHVlKXtcblx0Lypcblx0ZmYgNTUgbGVuIGlkeCBhY3Rpb24gZGV2aWNlIHBvcnQgIHNsb3QgIGRhdGEgYVxuXHQwICAxICAyICAgMyAgIDQgICAgICA1ICAgICAgNiAgICAgNyAgICAgOFxuXHQqL1xuXHQvL3Vuc2lnbmVkIGNoYXIgYVsxMV09ezB4ZmYsMHg1NSxXUklURU1PRFVMRSw3LDAsMCwwLDAsMCwwLCdcXG4nfTtcbiAgICAvL2FbNF0gPSBbdHlwZSBpbnRWYWx1ZV07XG4gICAgLy9hWzVdID0gKHBvcnQ8PDQgJiAweGYwKXwoc2xvdCAmIDB4Zik7XG4gICAgLy8gU3RhdGljIHZhbHVlc1xuXHR2YXIgYnVmID0gbmV3IEFycmF5QnVmZmVyKDE2KTtcblx0dmFyIGJ1ZlZpZXcgPSBuZXcgVWludDE2QXJyYXkoYnVmKTtcblx0XG5cdHZhciBieXRlMCA9IDB4ZmYsXG5cdFx0Ynl0ZTEgPSAweDU1LFxuXHRcdGJ5dGUyID0gMHgwOSxcblx0XHRieXRlMyA9IDB4MDAsXG5cdFx0Ynl0ZTQgPSAweDAyLFxuXHRcdGJ5dGU1ID0gdHlwZSxcblx0XHRieXRlNiA9IHBvcnQsXG5cdFx0Ynl0ZTcgPSBzbG90O1xuXHQvL2R5bmFtaWNzIHZhbHVlc1xuXHR2YXIgYnl0ZTggPSAweDAwLFxuXHRcdGJ5dGU5ID0gMHgwMCxcblx0XHRieXRlMTAgPSAweDAwLFxuXHRcdGJ5dGUxMSA9IDB4MDA7XG5cdC8vRW5kIG9mIG1lc3NhZ2Vcblx0dmFyIGJ5dGUxMiA9IDB4MGEsXG5cdFx0Ynl0ZTEzID0gMHgwMCxcblx0XHRieXRlMTQgPSAweDAwLFxuXHRcdGJ5dGUxNSA9IDB4MDA7XG5cblx0c3dpdGNoKHR5cGUpe1xuXHRcdGNhc2UgVFlQRV9NT1RPUjpcblx0XHRcdC8vIE1vdG9yIE0xXG5cdFx0XHQvLyBmZjo1NSAgMDk6MDAgIDAyOjBhICAwOTo2NCAgMDA6MDAgIDAwOjAwICAwYVwiXG5cdFx0XHQvLyAweDU1ZmY7MHgwMDA5OzB4MGEwMjsweDA5NjQ7MHgwMDAwOzB4MDAwMDsweDAwMGE7MHgwMDAwO1xuXHRcdFx0Ly9cImZmOjU1OjA5OjAwOjAyOjBhOjA5OjAwOjAwOjAwOjAwOjAwOjBhXCJcblx0XHRcdC8vIGZmOjU1OjA5OjAwOjAyOjBhOjA5OjljOmZmOjAwOjAwOjAwOjBhXG5cdFx0XHQvLyBNb3RvciBNMlxuXHRcdFx0Ly8gZmY6NTU6MDk6MDA6MDI6MGE6MGE6NjQ6MDA6MDA6MDA6MDA6MGFcblx0XHRcdC8vIGZmOjU1OjA5OjAwOjAyOjBhOjBhOjAwOjAwOjAwOjAwOjAwOjBhXG5cdFx0XHQvLyBmZjo1NTowOTowMDowMjowYTowYTo5YzpmZjowMDowMDowMDowYVxuXHRcdFx0dmFyIHRlbXBWYWx1ZSA9IHZhbHVlIDwgMCA/IChwYXJzZUludChcImZmZmZcIiwxNikgKyBNYXRoLm1heCgtMjU1LHZhbHVlKSkgOiBNYXRoLm1pbigyNTUsIHZhbHVlKTtcblx0XHRcdGJ5dGU3ID0gdGVtcFZhbHVlICYgMHgwMGZmO1x0XHRcdFxuXHRcdFx0Ynl0ZTggPSAweDAwO1xuXHRcdFx0Ynl0ZTggPSB0ZW1wVmFsdWUgPj44OyBcblxuXHRcdFx0LypieXRlNSA9IDB4MGE7XG5cdFx0XHRieXRlNiA9IDB4MDk7XG5cdFx0XHRieXRlNyA9IDB4NjQ7XG5cdFx0XHRieXRlOCA9IDB4MDA7Ki9cblx0XHRcdFxuXHRcdGJyZWFrO1xuXHRcdGNhc2UgVFlQRV9SR0I6XG5cdFx0XHQvLyBmZjo1NSAgMDk6MDAgIDAyOjA4ICAwNjowMCAgNWM6OTkgIDZkOjAwICAwYVxuXHRcdFx0Ly8gMHg1NWZmOzB4MDAwOTsweDA4MDI7MHgwMDA2OzB4OTk1YzsweDAwNmQ7MHgwMDBhOzB4MDAwMDtcblx0XHRcdGJ5dGU3ID0gMHgwMDtcblx0XHRcdGJ5dGU4ID0gdmFsdWU+PjggJiAweGZmO1xuXHRcdFx0Ynl0ZTkgPSB2YWx1ZT4+MTYgJiAweGZmO1xuXHRcdFx0Ynl0ZTEwID0gdmFsdWU+PjI0ICYgMHhmZjtcblx0XHRicmVhaztcblx0XHRjYXNlIFRZUEVfU09VTkQ6XG5cdFx0XHQvL2ZmOjU1OjA1OjAwOjAyOjIyOjAwOjAwOjBhXG5cdFx0XHQvL2ZmOjU1OjA1OjAwOjAyOjIyOjA2OjAxOjBhXG5cdFx0XHQvL2ZmOjU1OjA1OjAwOjAyOjIyOmVlOjAxOjBhXG5cdFx0XHQvL2ZmOjU1OjA1OjAwOjAyOjIyOjg4OjAxOjBhXG5cdFx0XHQvL2ZmOjU1OjA1OjAwOjAyOjIyOmI4OjAxOjBhXG5cdFx0XHQvL2ZmOjU1OjA1OjAwOjAyOjIyOjVkOjAxOjBhXG5cdFx0XHQvL2ZmOjU1OjA1OjAwOjAyOjIyOjRhOjAxOjBhXG5cdFx0XHQvL2ZmOjU1OjA1OjAwOjAyOjIyOjI2OjAxOjBhXG5cdFx0XHRieXRlMyA9IDB4MDU7XG5cdFx0XHRieXRlNCA9IDB4MDA7XG5cdFx0XHRieXRlNSA9IDB4MDI7XG5cdFx0XHRieXRlNiA9IDB4MjI7XG5cdFx0XHRpZiAodmFsdWUgPT09IDApe1xuXHRcdFx0XHRieXRlNyA9IDB4MDA7XG5cdFx0XHRcdGJ5dGU4ID0gMHgwMDtcblx0XHRcdH1lbHNle1xuXG5cdFx0XHRcdGJ5dGU3ID0gMHhlZTtcblx0XHRcdFx0Ynl0ZTggPSAweDAxO1xuXHRcdFx0fVxuXHRcdFx0Ynl0ZTkgPSAweDBhO1xuXHRcdFx0Ynl0ZTEyPSAweDAwO1xuXG5cdFx0YnJlYWs7XG5cdH1cblxuXHRidWZWaWV3WzBdID0gYnl0ZTE8PDggfCBieXRlMDtcblx0YnVmVmlld1sxXSA9IGJ5dGUzPDw4IHwgYnl0ZTI7XG5cdGJ1ZlZpZXdbMl0gPSBieXRlNTw8OCB8IGJ5dGU0O1xuXHRidWZWaWV3WzNdID0gYnl0ZTc8PDggfCBieXRlNjtcblx0YnVmVmlld1s0XSA9IGJ5dGU5PDw4IHwgYnl0ZTg7XG5cdGJ1ZlZpZXdbNV0gPSBieXRlMTE8PDggfCBieXRlMTA7XG5cdGJ1ZlZpZXdbNl0gPSBieXRlMTM8PDggfCBieXRlMTI7XG5cdGJ1ZlZpZXdbN10gPSBieXRlMTU8PDggfCBieXRlMTQ7XG5cdGNvbnNvbGUubG9nKFxuXHRcdFx0Ynl0ZTAudG9TdHJpbmcoMTYpK1wiOlwiK1xuXHRcdFx0Ynl0ZTEudG9TdHJpbmcoMTYpK1wiOlwiK1xuXHRcdFx0Ynl0ZTIudG9TdHJpbmcoMTYpK1wiOlwiK1xuXHRcdFx0Ynl0ZTMudG9TdHJpbmcoMTYpK1wiOlwiK1xuXHRcdFx0Ynl0ZTQudG9TdHJpbmcoMTYpK1wiOlwiK1xuXHRcdFx0Ynl0ZTUudG9TdHJpbmcoMTYpK1wiOlwiK1xuXHRcdFx0Ynl0ZTYudG9TdHJpbmcoMTYpK1wiOlwiK1xuXHRcdFx0Ynl0ZTcudG9TdHJpbmcoMTYpK1wiOlwiK1xuXHRcdFx0Ynl0ZTgudG9TdHJpbmcoMTYpK1wiOlwiK1xuXHRcdFx0Ynl0ZTkudG9TdHJpbmcoMTYpK1wiOlwiK1xuXHRcdFx0Ynl0ZTEwLnRvU3RyaW5nKDE2KStcIjpcIitcblx0XHRcdGJ5dGUxMS50b1N0cmluZygxNikrXCI6XCIrXG5cdFx0XHRieXRlMTIudG9TdHJpbmcoMTYpK1wiOlwiK1xuXHRcdFx0Ynl0ZTEzLnRvU3RyaW5nKDE2KStcIjpcIitcblx0XHRcdGJ5dGUxNC50b1N0cmluZygxNikrXCI6XCIrXG5cdFx0XHRieXRlMTUudG9TdHJpbmcoMTYpK1wiOlwiXG5cdFx0XHQpO1xuXHRjb25zb2xlLmxvZyhcblx0XHRcdGJ1ZlZpZXdbMF0udG9TdHJpbmcoMTYpK1wiOlwiK1xuXHRcdFx0YnVmVmlld1sxXS50b1N0cmluZygxNikrXCI6XCIrXG5cdFx0XHRidWZWaWV3WzJdLnRvU3RyaW5nKDE2KStcIjpcIitcblx0XHRcdGJ1ZlZpZXdbM10udG9TdHJpbmcoMTYpK1wiOlwiK1xuXHRcdFx0YnVmVmlld1s0XS50b1N0cmluZygxNikrXCI6XCIrXG5cdFx0XHRidWZWaWV3WzVdLnRvU3RyaW5nKDE2KStcIjpcIitcblx0XHRcdGJ1ZlZpZXdbNl0udG9TdHJpbmcoMTYpK1wiOlwiK1xuXHRcdFx0YnVmVmlld1s3XS50b1N0cmluZygxNilcblx0XHRcdCk7XG5cdHJldHVybiBidWY7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdCdERVZJQ0VfTkFNRScgOiBERVZJQ0VfTkFNRSxcblx0J1NFUlZJQ0VfVVVJRCcgOiBTRVJWSUNFX1VVSUQsXG5cdCdDSEFSQUNURVJJU1RJQ19VVUlEJyA6IENIQVJBQ1RFUklTVElDX1VVSUQsXG5cdCdUWVBFX01PVE9SJyA6IFRZUEVfTU9UT1IsXG5cdCdUWVBFX1JHQicgOiBUWVBFX1JHQixcblx0J1RZUEVfU09VTkQnIDogVFlQRV9TT1VORCxcblx0J1BPUlRfMScgOiBQT1JUXzEsXG5cdCdQT1JUXzInIDogUE9SVF8yLFxuXHQnUE9SVF8zJyA6IFBPUlRfMyxcblx0J1BPUlRfNCcgOiBQT1JUXzQsXG5cdCdQT1JUXzUnIDogUE9SVF81LFxuXHQnUE9SVF82JyA6IFBPUlRfNixcblx0J1BPUlRfNycgOiBQT1JUXzcsXG5cdCdQT1JUXzgnIDogUE9SVF84LFxuXHQnTV8xJyA6IE1fMSxcblx0J01fMicgOiBNXzIsXG5cdCdnZW5lcmljQ29udHJvbCcgOiBnZW5lcmljQ29udHJvbFxufTsiLCIndXNlIHN0cmljdCdcblxuY29uc3QgbWJvdEFwaSA9IHJlcXVpcmUoJy4uL21ib3QvbWJvdCcpOyAgXG5cbnZhciBzZXJ2ZXJHQVRUID0gbnVsbCxcblx0c2VydmljZUdBVFQgPSBudWxsLFxuXHRjaGFyYWN0ZXJpc3RpY0dBVFQgPSBudWxsLFxuXHRlbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG5cbmZ1bmN0aW9uIGluaXRCbGUoKXtcblx0cmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG5cdFx0bmF2aWdhdG9yLmJsdWV0b290aC5yZXF1ZXN0RGV2aWNlKHsgXG5cdFx0XHRmaWx0ZXJzOiBbeyBuYW1lOiBtYm90QXBpLkRFVklDRV9OQU1FIH1dLCBvcHRpb25hbFNlcnZpY2VzOiBbbWJvdEFwaS5TRVJWSUNFX1VVSURdXG5cdFx0fSlcblx0XHQudGhlbihmdW5jdGlvbihkZXZpY2UpIHtcblx0XHQgICBjb25zb2xlLmxvZyhcIkNvbm5lY3RpbmcuLi5cIik7XG5cdFx0ICAgcmV0dXJuIGRldmljZS5jb25uZWN0R0FUVCgpO1xuXHRcdCB9KVxuXHRcdC50aGVuKGZ1bmN0aW9uKHNlcnZlcikge1xuXHRcdFx0c2VydmVyR0FUVCA9IHNlcnZlcjtcblx0XHRcdC8vcmV0dXJuIHNlcnZlci5nZXRQcmltYXJ5U2VydmljZShzZXJ2aWNlVVVJRCk7XG5cdFx0ICAgLy8gRklYTUU6IFJlbW92ZSB0aGlzIHRpbWVvdXQgd2hlbiBHYXR0U2VydmljZXMgcHJvcGVydHkgd29ya3MgYXMgaW50ZW5kZWQuXG5cdFx0ICAgLy8gY3JidWcuY29tLzU2MDI3N1xuXHRcdCAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlU2VydmljZSwgcmVqZWN0U2VydmljZSkge1xuXHRcdCAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHQgICAgIFx0dHJ5e1xuXHRcdCAgICAgXHRcdGNvbnNvbGUubG9nKFwiVHJ5IHRvIGdldCBTZXJ2aWNlXCIpO1xuXHRcdCAgICAgICBcdFx0cmVzb2x2ZVNlcnZpY2Uoc2VydmVyLmdldFByaW1hcnlTZXJ2aWNlKG1ib3RBcGkuU0VSVklDRV9VVUlEKSk7XG5cdFx0ICAgICBcdH1jYXRjaChlcnIpe1xuXHRcdCAgICAgXHRcdHJlamVjdFNlcnZpY2UoZXJyKTtcblx0XHQgICAgIFx0fVxuXHRcdCAgICAgfSwgMmUzKTtcblx0XHQgICB9KVxuXHRcdH0pLnRoZW4oZnVuY3Rpb24oc2VydmljZSl7XG5cdFx0XHRzZXJ2aWNlR0FUVCA9IHNlcnZpY2U7XG5cdFx0XHRyZXNvbHZlKHNlcnZpY2UpO1x0XHRcdFxuXHRcdH0pLmNhdGNoKGZ1bmN0aW9uKGVycm9yKXtcblx0XHRcdGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuXHRcdFx0cmVqZWN0KGVycm9yKTtcblx0XHR9KTtcblx0fSlcbn1cblxuXG5mdW5jdGlvbiBnZXRTZXJ2aWNlKCl7XG5cdHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuXHRcdGlmIChzZXJ2ZXJHQVRUICYmIHNlcnZlckdBVFQuY29ubmVjdGVkICYmIHNlcnZpY2VHQVRUKXtcblx0XHRcdHJlc29sdmUoc2VydmljZUdBVFQpO1xuXHRcdH1lbHNle1xuXHRcdFx0aW5pdEJsZSgpXG5cdFx0XHQudGhlbihmdW5jdGlvbihzZXJ2aWNlKXtcblx0XHRcdFx0cmVzb2x2ZShzZXJ2aWNlKTtcblx0XHRcdH0pXG5cdFx0XHQuY2F0Y2goZnVuY3Rpb24oZXJyb3Ipe1xuXHRcdFx0XHRyZWplY3QoZXJyb3IpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9KTtcbn1cblxuZnVuY3Rpb24gZ2V0Q2hhcmFjdGVyaXN0aWMoKXtcblx0cmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG5cdFx0aWYgKGNoYXJhY3RlcmlzdGljR0FUVCl7XG5cdFx0XHRyZXNvbHZlKGNoYXJhY3RlcmlzdGljR0FUVCk7XG5cdFx0fWVsc2V7XG5cdFx0XHRnZXRTZXJ2aWNlKClcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHNlcnZpY2Upe1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcIlRyeSB0byBnZXQgQ2hhcmFjdGVyaXRpYyA6ICVPXCIsc2VydmljZSk7XG5cdFx0XHRcdHJldHVybiBzZXJ2aWNlLmdldENoYXJhY3RlcmlzdGljKG1ib3RBcGkuQ0hBUkFDVEVSSVNUSUNfVVVJRCk7XG5cdFx0XHR9KVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oY2hhcmFjdGVyaXRpYyl7XG5cdFx0XHRcdGNoYXJhY3RlcmlzdGljR0FUVCA9IGNoYXJhY3Rlcml0aWM7XG5cdFx0XHRcdHJlc29sdmUoY2hhcmFjdGVyaXRpYyk7XG5cdFx0XHR9KS5jYXRjaChmdW5jdGlvbihlcnJvcil7XG5cdFx0XHRcdHJlamVjdChlcnJvcik7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBwcm9jZXNzQ2hhcmFjdGVyaXN0aWModHlwZSwgZGF0YSwgY2FsbGJhY2spe1xuXHRnZXRDaGFyYWN0ZXJpc3RpYygpXG5cdC50aGVuKGZ1bmN0aW9uKGNoYXJhY3RlcmlzdGljKXtcblx0XHRpZiAodHlwZSA9PT0gJ3dyaXRlJyl7XHRcdFx0XG5cdFx0XHRjb25zb2xlLmxvZyhcIlRyeSB0byB3cml0ZSB2YWx1ZSA6ICVPXCIsY2hhcmFjdGVyaXN0aWMpO1xuXHRcdFx0cmV0dXJuIGNoYXJhY3RlcmlzdGljLndyaXRlVmFsdWUoZGF0YSk7XG5cdFx0fVxuXHR9KS50aGVuKGZ1bmN0aW9uKGJ1ZmZlcil7XG5cdFx0aWYgKHR5cGUgPT09ICd3cml0ZScpe1xuXHRcdFx0aWYoY2FsbGJhY2spe1xuXHRcdFx0XHRjYWxsYmFjayh7dHlwZTogJ3dyaXRlJywgdmFsdWUgOiB0cnVlfSk7XHRcdFx0XG5cdFx0XHR9XG5cdFx0XHRjb25zb2xlLmluZm8oXCJXcml0ZSBkYXRhcyAhIFwiKTtcblx0XHR9ZWxzZXtcblx0XHRcdGxldCBkYXRhID0gbmV3IERhdGFWaWV3KGJ1ZmZlcik7XG5cdFx0ICAgIGxldCBkYXRhRGVjcnlwdCA9IGRhdGEuZ2V0VWludDgoMCk7XG5cdFx0ICAgIGNhbGxiYWNrKHt0eXBlOiAncmVhZCcgLCB2YWx1ZSA6IGRhdGFEZWNyeXB0fSk7XG5cdFx0ICAgIGNvbnNvbGUubG9nKCdSZWNlaXZlRGF0YXMgJXMnLCBkYXRhRGVjcnlwdCk7XG5cdFx0fVxuXHR9KS5jYXRjaChmdW5jdGlvbihlcnJvcil7XG5cdFx0Y29uc29sZS5lcnJvcihlcnJvcik7XG5cdFx0aWYgKGNhbGxiYWNrKSB7XG5cblx0XHRcdGNhbGxiYWNrKHt0eXBlIDogJ2Vycm9yJywgdmFsdWUgOiBlcnJvcn0pO1xuXHRcdH1cblx0fSk7XG59XG5cbmZ1bmN0aW9uIHByb2Nlc3NNb3RvcnModmFsdWVNMSwgdmFsdWVNMil7XG5cdGdldENoYXJhY3RlcmlzdGljKClcblx0LnRoZW4oY2hhcmFjdGVyaXN0aWMgPT57XG5cdFx0cmV0dXJuIGNoYXJhY3RlcmlzdGljLndyaXRlVmFsdWUobWJvdEFwaS5nZW5lcmljQ29udHJvbChtYm90QXBpLlRZUEVfTU9UT1IsIG1ib3RBcGkuTV8xLCAwLCB2YWx1ZU0xKSk7XG5cdH0pLnRoZW4oKCk9Pntcblx0XHRyZXR1cm4gY2hhcmFjdGVyaXN0aWNHQVRULndyaXRlVmFsdWUobWJvdEFwaS5nZW5lcmljQ29udHJvbChtYm90QXBpLlRZUEVfTU9UT1IsIG1ib3RBcGkuTV8yLCAwLCB2YWx1ZU0yKSk7XG5cdH0pLnRoZW4oKCk9Pntcblx0XHRpZihjYWxsYmFjayl7XG5cdFx0XHRjYWxsYmFjayh7dHlwZTogJ3dyaXRlJywgdmFsdWUgOiB0cnVlfSk7XHRcdFx0XG5cdFx0fVxuXHRcdGNvbnNvbGUuaW5mbyhcIldyaXRlIGRhdGFzICEgXCIpO1xuXHR9KS5jYXRjaChlcnJvciA9Pntcblx0XHRjb25zb2xlLmVycm9yKGVycm9yKTtcblx0XHRpZiAoY2FsbGJhY2spIHtcblx0XHRcdGNhbGxiYWNrKHt0eXBlIDogJ2Vycm9yJywgdmFsdWUgOiBlcnJvcn0pO1xuXHRcdH1cblx0fSk7XG59XG5cblxuZnVuY3Rpb24gQmxlQ29udHJvbGxlcigpe1xuXG5cdHRoaXMuY3VycmVudFRpbWVyID0gbnVsbDtcblx0dGhpcy5wb3dlciA9IDEyNTtcblx0dGhpcy5yZWQgPSAwO1xuXG5cdFxuXHR0aGlzLmNvbm5lY3QgPSBmdW5jdGlvbigpe1xuXHRcdHByb2Nlc3NDaGFyYWN0ZXJpc3RpYygnd3JpdGUnLCBcIm9uXCIpO1xuXHR9XG5cblx0dGhpcy51cCA9IGZ1bmN0aW9uKGV2ZW50KXtcblx0XHRjb25zb2xlLmxvZyhcInVwXCIpO1xuXHRcdHByb2Nlc3NNb3RvcnMoLTEwMCwxMDApO1xuXHR9XG5cblx0dGhpcy5kb3duID0gZnVuY3Rpb24oKXtcblx0XHRjb25zb2xlLmxvZyhcImRvd25cIik7XG5cdFx0cHJvY2Vzc01vdG9ycygxMDAsLTEwMCk7XG5cdH1cblx0XG5cdHRoaXMubGVmdCA9IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc29sZS5sb2coXCJsZWZ0XCIpO1xuXHRcdHByb2Nlc3NNb3RvcnMoMTAwLDEwMCk7XG5cdH07XG5cblx0dGhpcy5yaWdodCA9IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc29sZS5sb2coXCJyaWdodFwiKTtcblx0XHRwcm9jZXNzTW90b3JzKC0xMDAsLTEwMCk7XG5cdH07XG5cblx0dGhpcy5zdG9wID0gZnVuY3Rpb24oKXtcblx0XHRjb25zb2xlLmxvZyhcInN0b3BcIik7XG5cdFx0cHJvY2Vzc01vdG9ycygwLDApO1xuXHR9XG5cblx0dGhpcy5jaGFuZ2VDb2xvciA9IGZ1bmN0aW9uKHJlZCxibHVlLGdyZWVuKXsgXG5cdFx0Y29uc29sZS5sb2coXCJDaGFuZ2UgQ29sb3IgOiAlZCwlZCwlZFwiLHJlZCxncmVlbixibHVlKTtcblx0XHR2YXIgckhleCA9IHJlZDw8ODtcblx0XHR2YXIgZ0hleCA9IGdyZWVuPDwxNjtcblx0XHR2YXIgYkhleCA9IGJsdWU8PDI0O1xuXHRcdHZhciB2YWx1ZSA9IHJIZXggfCBnSGV4IHwgYkhleDtcblx0XHRwcm9jZXNzQ2hhcmFjdGVyaXN0aWMoJ3dyaXRlJywgbWJvdEFwaS5nZW5lcmljQ29udHJvbChtYm90QXBpLlRZUEVfUkdCLG1ib3RBcGkuUE9SVF82LDAsdmFsdWUpKTtcblx0fTtcblxuXG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBCbGVDb250cm9sbGVyO1xuXG4iXX0=
