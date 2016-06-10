'use strict'

const mbotApi = require('../mbot/mbot');  

let deviceBle = null,
	encoder = new TextEncoder();

function initBle(){
	return new Promise(function(resolve, reject){
		navigator.bluetooth.requestDevice({ 
			filters: [{ name: mbotApi.DEVICE_NAME }], optionalServices: [mbotApi.SERVICE_UUID]
		})
		.then(function(device) {
		   deviceBle = device;
		   console.log("Connecting...");
		   return device.gatt.connect();
		 })
		.then(function(server) {
			
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
			resolve(service);			
		}).catch(function(error){
			console.error(error);
			reject(error);
		});
	})
}

function writeCharacteristic(data){
    return getCharacteristic()
    .then(characteristic => characteristic.writeValue(data));
}

function getCharacteristic(){
	return new Promise(function(resolve, reject){
		if (deviceBle){
			deviceBle.gatt.getPrimaryService(mbotApi.SERVICE_UUID)
			.then(service => service.getCharacteristic(mbotApi.CHARACTERISTIC_UUID))
			.then(characteristic => resolve(characteristic));
		}else{
			initBle().then(()=>{
				deviceBle.gatt.getPrimaryService(mbotApi.SERVICE_UUID)
				.then(service => service.getCharacteristic(mbotApi.CHARACTERISTIC_UUID))
				.then(characteristic => resolve(characteristic));
			});
		}
	});
}

function processCharacteristic(type, data, callback){
	writeCharacteristic(data)
    .then(buffer=>{
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
	}).catch(error=>{
		console.error(error);
		if (callback) {

			callback({type : 'error', value : error});
		}
	});
}

function processMotors(valueM1, valueM2){	
	writeCharacteristic(mbotApi.genericControl(mbotApi.TYPE_MOTOR, mbotApi.M_1, 0, valueM1))
	.then(()=>{
		return writeCharacteristic(mbotApi.genericControl(mbotApi.TYPE_MOTOR, mbotApi.M_2, 0, valueM2));
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
    writeCharacteristic(mbotApi.genericControl(mbotApi.TYPE_SOUND, 0, 0, 0))
	.then(()=>{
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

