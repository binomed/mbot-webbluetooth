(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

function pageLoad() {

    let noBluetooth = document.getElementById("noBluetooth");
    let stepConnect = document.getElementById("stepConnect");
    let stepControl = document.getElementById("stepControl");
    if (navigator.bluetooth == undefined) {
        console.error("No navigator.bluetooth found.");
        stepConnect.style.display = "none";
        noBluetooth.style.display = "flex";
        
        
        
    } else {
        stepConnect.style.display = "flex";
        noBluetooth.style.display = "none";
        let mBot = require("./mbot/mbot");
        
        document.getElementById("connectBtn").addEventListener('click', _=>{            
            mBot.request()
            .then(_=>{
                return mBot.connect();
            })
            .then(_=>{
                stepConnect.style.display = "none";
                stepControl.style.display = "flex";
                
                let Joystick = require('./components/joystick.js');
                new Joystick('joystick');
                
                let partJoystick = document.querySelector('.part-joystick');
                let partBtn = document.querySelector('.part-button');
                let switchParts = document.getElementById('switchParts');
                switchParts.addEventListener('click', function(evt){
                if (this.checked){
                    partBtn.style.display = 'none';
                    partJoystick.style.display = '';
                }else{
                    partBtn.style.display = '';
                    partJoystick.style.display = 'none';
                    
                } 
                });
            })
        });
		
		let ColorPicker = require('./components/colorpicker.js');
		new ColorPicker((rgb) => {
			mBot.processColor(rgb.red, rgb.blue, rgb.green);
		});
        
        
    }
	
}



window.addEventListener('load', pageLoad);
},{"./components/colorpicker.js":2,"./components/joystick.js":3,"./mbot/mbot":4}],2:[function(require,module,exports){

class ColorPicker {
    constructor(callback) {
        this.img = new Image();
        this.img.src = './assets/images/color-wheel.png';
        this.callback = callback;
        this.canvas = document.querySelector('canvas');
        this.context = this.canvas.getContext('2d');
        this.img.onload = this._load.bind(this);
    }


    _load() {
        
        this.canvas.width = 150 * devicePixelRatio;
        this.canvas.height = 150 * devicePixelRatio;
        this.canvas.style.width = "150px";
        this.canvas.style.height = "150px";
        this.canvas.addEventListener('click', this._calculateRgb.bind(this));

        this.context.drawImage(this.img, 0, 0, this.canvas.width, this.canvas.height);
    }


    _calculateRgb(evt) {
        // Refresh canvas in case user zooms and devicePixelRatio changes.
        this.canvas.width = 150 * devicePixelRatio;
        this.canvas.height = 150 * devicePixelRatio;
        this.context.drawImage(this.img, 0, 0, this.canvas.width, this.canvas.height);

        let rect = this.canvas.getBoundingClientRect();
        let x = Math.round((evt.clientX - rect.left) * devicePixelRatio);
        let y = Math.round((evt.clientY - rect.top) * devicePixelRatio);
        let data = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data;

        let r = data[((this.canvas.width * y) + x) * 4];
        let g = data[((this.canvas.width * y) + x) * 4 + 1];
        let b = data[((this.canvas.width * y) + x) * 4 + 2];

        this.callback({
            red: r,
            blue: b,
            green: g
        });


        this.context.beginPath();
        this.context.arc(x, y + 2, 10 * devicePixelRatio, 0, 2 * Math.PI, false);
        this.context.shadowColor = '#333';
        this.context.shadowBlur = 4 * devicePixelRatio;
        this.context.fillStyle = 'white';
        this.context.fill();
    }


}

module.exports = ColorPicker;
},{}],3:[function(require,module,exports){
class Joystick{

    constructor(id){
        this.joystick = nipplejs.create({
            zone:document.getElementById(id),
            mode:'static',
            position:{
                left: '50%',
                top:'50%'
            },
            size:200,
            color:'#3f51b5'
        });
        
        this.joystick.on('move',this._move.bind(this))
    }
    
    _move(evt, data){
        console.debug(data);
        
    }
    
}

module.exports = Joystick;
},{}],4:[function(require,module,exports){
'use strict'

class Config {

    constructor() {
    }

    name() { return "Makeblock_LE"; }
    service() { return "0000ffe1-0000-1000-8000-00805f9b34fb" }
    charateristic() { return "0000ffe3-0000-1000-8000-00805f9b34fb" }
}


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
    

class MBot {
    constructor() {
        this.device = null;
        this.config = new Config();
        this.onDisconnected = this.onDisconnected.bind(this);
    }

    request() {
        let options = {
            "filters": [{
                "name": this.config.name()
            }],
            "optionalServices": [this.config.service()]
        };
        return navigator.bluetooth.requestDevice(options)
            .then(device => {
                this.device = device;
                this.device.addEventListener('gattserverdisconnected', this.onDisconnected);
                return device;
            });
    }

    connect() {
        if (!this.device) {
            return Promise.reject('Device is not connected.');
        } else {
            return this.device.gatt.connect();
        }
    }

    processMotor(valueM1, valueM2) {
        return this._writeCharacteristic(this._genericControl(TYPE_MOTOR, M_1, 0, valueM1))
            .then(() => {
                return this._writeCharacteristic(this._genericControl(TYPE_MOTOR, M_2, 0, valueM2));
            }).catch(error => {
                console.error(error);
            });

    }

    processBuzzer() {
        return this._writeCharacteristic(this._genericControl(TYPE_SOUND, 0, 0, 0))
            .catch(error => {
                console.error(error);
            });
    }
    
    processColor(red,blue,green){
        let rHex = red<<8;
		let gHex = green<<16;
		let bHex = blue<<24;
		let value = rHex | gHex | bHex;
		this._writeCharacteristic(this._genericControl(TYPE_RGB,PORT_6,0,value));
        
    }

    disconnect() {
        if (!this.device) {
            return Promise.reject('Device is not connected.');
        } else {
            return this.device.gatt.disconnect();
        }
    }

    onDisconnected() {
        console.log('Device is disconnected.');
    }


    _genericControl(type, port, slot, value) {
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

        var byte0 = 0xff, // Static header
            byte1 = 0x55, // Static header
            byte2 = 0x09, // len
            byte3 = 0x00, // idx
            byte4 = 0x02, // action
            byte5 = type, // device
            byte6 = port, // port
            byte7 = slot; // slot
        //dynamics values
        var byte8 = 0x00, // data
            byte9 = 0x00, // data
            byte10 = 0x00, // data
            byte11 = 0x00; // data
        //End of message
        var byte12 = 0x0a,
            byte13 = 0x00,
            byte14 = 0x00,
            byte15 = 0x00;

        switch (type) {
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
                var tempValue = value < 0 ? (parseInt("ffff", 16) + Math.max(-255, value)) : Math.min(255, value);
                byte7 = tempValue & 0x00ff;
                byte8 = 0x00;
                byte8 = tempValue >> 8;

                /*byte5 = 0x0a;
                byte6 = 0x09;
                byte7 = 0x64;
                byte8 = 0x00;*/

                break;
            case TYPE_RGB:
                // ff:55  09:00  02:08  06:00  5c:99  6d:00  0a
                // 0x55ff;0x0009;0x0802;0x0006;0x995c;0x006d;0x000a;0x0000;
                byte7 = 0x00;
                byte8 = value >> 8 & 0xff;
                byte9 = value >> 16 & 0xff;
                byte10 = value >> 24 & 0xff;
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
                byte5 = 0x22;
                if (value === 0) {
                    byte6 = 0x00;
                    byte7 = 0x00;
                } else if (value === 1) {
                    byte6 = 0x06;
                    byte7 = 0x01;
                } else if (value === 2) {
                    byte6 = 0xee;
                    byte7 = 0x01;
                } else if (value === 3) {
                    byte6 = 0x88;
                    byte7 = 0x01;
                } else if (value === 4) {
                    byte6 = 0xb8;
                    byte7 = 0x01;
                } else if (value === 5) {
                    byte6 = 0x5d;
                    byte7 = 0x01;
                } else if (value === 6) {
                    byte6 = 0x4a;
                    byte7 = 0x01;
                } else {
                    byte6 = 0x26;
                    byte7 = 0x01;
                }
                byte8 = 0x0a;
                byte12 = 0x00;

                break;
        }

        bufView[0] = byte1 << 8 | byte0;
        bufView[1] = byte3 << 8 | byte2;
        bufView[2] = byte5 << 8 | byte4;
        bufView[3] = byte7 << 8 | byte6;
        bufView[4] = byte9 << 8 | byte8;
        bufView[5] = byte11 << 8 | byte10;
        bufView[6] = byte13 << 8 | byte12;
        bufView[7] = byte15 << 8 | byte14;
        console.log(
            byte0.toString(16) + ":" +
            byte1.toString(16) + ":" +
            byte2.toString(16) + ":" +
            byte3.toString(16) + ":" +
            byte4.toString(16) + ":" +
            byte5.toString(16) + ":" +
            byte6.toString(16) + ":" +
            byte7.toString(16) + ":" +
            byte8.toString(16) + ":" +
            byte9.toString(16) + ":" +
            byte10.toString(16) + ":" +
            byte11.toString(16) + ":" +
            byte12.toString(16) + ":" +
            byte13.toString(16) + ":" +
            byte14.toString(16) + ":" +
            byte15.toString(16) + ":"
        );
        console.log(
            bufView[0].toString(16) + ":" +
            bufView[1].toString(16) + ":" +
            bufView[2].toString(16) + ":" +
            bufView[3].toString(16) + ":" +
            bufView[4].toString(16) + ":" +
            bufView[5].toString(16) + ":" +
            bufView[6].toString(16) + ":" +
            bufView[7].toString(16)
        );
        return buf;
    }

    _writeCharacteristic(value) {
        return this.device.gatt.getPrimaryService(this.config.service())
            .then(service => service.getCharacteristic(this.config.charateristic()))
            .then(characteristic => characteristic.writeValue(value));
    }


}

const DEVICE_NAME = "Makeblock_LE",
    SERVICE_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb",
    CHARACTERISTIC_UUID = "0000ffe3-0000-1000-8000-00805f9b34fb";





let mBot = new MBot();

module.exports = mBot;
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzY3JpcHRzL2FwcC5qcyIsInNjcmlwdHMvY29tcG9uZW50cy9jb2xvcnBpY2tlci5qcyIsInNjcmlwdHMvY29tcG9uZW50cy9qb3lzdGljay5qcyIsInNjcmlwdHMvbWJvdC9tYm90LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCdcblxuZnVuY3Rpb24gcGFnZUxvYWQoKSB7XG5cbiAgICBsZXQgbm9CbHVldG9vdGggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5vQmx1ZXRvb3RoXCIpO1xuICAgIGxldCBzdGVwQ29ubmVjdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RlcENvbm5lY3RcIik7XG4gICAgbGV0IHN0ZXBDb250cm9sID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdGVwQ29udHJvbFwiKTtcbiAgICBpZiAobmF2aWdhdG9yLmJsdWV0b290aCA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIk5vIG5hdmlnYXRvci5ibHVldG9vdGggZm91bmQuXCIpO1xuICAgICAgICBzdGVwQ29ubmVjdC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIG5vQmx1ZXRvb3RoLnN0eWxlLmRpc3BsYXkgPSBcImZsZXhcIjtcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBcbiAgICB9IGVsc2Uge1xuICAgICAgICBzdGVwQ29ubmVjdC5zdHlsZS5kaXNwbGF5ID0gXCJmbGV4XCI7XG4gICAgICAgIG5vQmx1ZXRvb3RoLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgbGV0IG1Cb3QgPSByZXF1aXJlKFwiLi9tYm90L21ib3RcIik7XG4gICAgICAgIFxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbm5lY3RCdG5cIikuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBfPT57ICAgICAgICAgICAgXG4gICAgICAgICAgICBtQm90LnJlcXVlc3QoKVxuICAgICAgICAgICAgLnRoZW4oXz0+e1xuICAgICAgICAgICAgICAgIHJldHVybiBtQm90LmNvbm5lY3QoKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihfPT57XG4gICAgICAgICAgICAgICAgc3RlcENvbm5lY3Quc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgIHN0ZXBDb250cm9sLnN0eWxlLmRpc3BsYXkgPSBcImZsZXhcIjtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBsZXQgSm95c3RpY2sgPSByZXF1aXJlKCcuL2NvbXBvbmVudHMvam95c3RpY2suanMnKTtcbiAgICAgICAgICAgICAgICBuZXcgSm95c3RpY2soJ2pveXN0aWNrJyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbGV0IHBhcnRKb3lzdGljayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wYXJ0LWpveXN0aWNrJyk7XG4gICAgICAgICAgICAgICAgbGV0IHBhcnRCdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucGFydC1idXR0b24nKTtcbiAgICAgICAgICAgICAgICBsZXQgc3dpdGNoUGFydHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3dpdGNoUGFydHMnKTtcbiAgICAgICAgICAgICAgICBzd2l0Y2hQYXJ0cy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2dCl7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2hlY2tlZCl7XG4gICAgICAgICAgICAgICAgICAgIHBhcnRCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgcGFydEpveXN0aWNrLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgcGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIHBhcnRKb3lzdGljay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSk7XG5cdFx0XG5cdFx0bGV0IENvbG9yUGlja2VyID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL2NvbG9ycGlja2VyLmpzJyk7XG5cdFx0bmV3IENvbG9yUGlja2VyKChyZ2IpID0+IHtcblx0XHRcdG1Cb3QucHJvY2Vzc0NvbG9yKHJnYi5yZWQsIHJnYi5ibHVlLCByZ2IuZ3JlZW4pO1xuXHRcdH0pO1xuICAgICAgICBcbiAgICAgICAgXG4gICAgfVxuXHRcbn1cblxuXG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgcGFnZUxvYWQpOyIsIlxuY2xhc3MgQ29sb3JQaWNrZXIge1xuICAgIGNvbnN0cnVjdG9yKGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuaW1nID0gbmV3IEltYWdlKCk7XG4gICAgICAgIHRoaXMuaW1nLnNyYyA9ICcuL2Fzc2V0cy9pbWFnZXMvY29sb3Itd2hlZWwucG5nJztcbiAgICAgICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2NhbnZhcycpO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICB0aGlzLmltZy5vbmxvYWQgPSB0aGlzLl9sb2FkLmJpbmQodGhpcyk7XG4gICAgfVxuXG5cbiAgICBfbG9hZCgpIHtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gMTUwICogZGV2aWNlUGl4ZWxSYXRpbztcbiAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gMTUwICogZGV2aWNlUGl4ZWxSYXRpbztcbiAgICAgICAgdGhpcy5jYW52YXMuc3R5bGUud2lkdGggPSBcIjE1MHB4XCI7XG4gICAgICAgIHRoaXMuY2FudmFzLnN0eWxlLmhlaWdodCA9IFwiMTUwcHhcIjtcbiAgICAgICAgdGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9jYWxjdWxhdGVSZ2IuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LmRyYXdJbWFnZSh0aGlzLmltZywgMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG4gICAgfVxuXG5cbiAgICBfY2FsY3VsYXRlUmdiKGV2dCkge1xuICAgICAgICAvLyBSZWZyZXNoIGNhbnZhcyBpbiBjYXNlIHVzZXIgem9vbXMgYW5kIGRldmljZVBpeGVsUmF0aW8gY2hhbmdlcy5cbiAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSAxNTAgKiBkZXZpY2VQaXhlbFJhdGlvO1xuICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSAxNTAgKiBkZXZpY2VQaXhlbFJhdGlvO1xuICAgICAgICB0aGlzLmNvbnRleHQuZHJhd0ltYWdlKHRoaXMuaW1nLCAwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcblxuICAgICAgICBsZXQgcmVjdCA9IHRoaXMuY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBsZXQgeCA9IE1hdGgucm91bmQoKGV2dC5jbGllbnRYIC0gcmVjdC5sZWZ0KSAqIGRldmljZVBpeGVsUmF0aW8pO1xuICAgICAgICBsZXQgeSA9IE1hdGgucm91bmQoKGV2dC5jbGllbnRZIC0gcmVjdC50b3ApICogZGV2aWNlUGl4ZWxSYXRpbyk7XG4gICAgICAgIGxldCBkYXRhID0gdGhpcy5jb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KS5kYXRhO1xuXG4gICAgICAgIGxldCByID0gZGF0YVsoKHRoaXMuY2FudmFzLndpZHRoICogeSkgKyB4KSAqIDRdO1xuICAgICAgICBsZXQgZyA9IGRhdGFbKCh0aGlzLmNhbnZhcy53aWR0aCAqIHkpICsgeCkgKiA0ICsgMV07XG4gICAgICAgIGxldCBiID0gZGF0YVsoKHRoaXMuY2FudmFzLndpZHRoICogeSkgKyB4KSAqIDQgKyAyXTtcblxuICAgICAgICB0aGlzLmNhbGxiYWNrKHtcbiAgICAgICAgICAgIHJlZDogcixcbiAgICAgICAgICAgIGJsdWU6IGIsXG4gICAgICAgICAgICBncmVlbjogZ1xuICAgICAgICB9KTtcblxuXG4gICAgICAgIHRoaXMuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jb250ZXh0LmFyYyh4LCB5ICsgMiwgMTAgKiBkZXZpY2VQaXhlbFJhdGlvLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICB0aGlzLmNvbnRleHQuc2hhZG93Q29sb3IgPSAnIzMzMyc7XG4gICAgICAgIHRoaXMuY29udGV4dC5zaGFkb3dCbHVyID0gNCAqIGRldmljZVBpeGVsUmF0aW87XG4gICAgICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSAnd2hpdGUnO1xuICAgICAgICB0aGlzLmNvbnRleHQuZmlsbCgpO1xuICAgIH1cblxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sb3JQaWNrZXI7IiwiY2xhc3MgSm95c3RpY2t7XG5cbiAgICBjb25zdHJ1Y3RvcihpZCl7XG4gICAgICAgIHRoaXMuam95c3RpY2sgPSBuaXBwbGVqcy5jcmVhdGUoe1xuICAgICAgICAgICAgem9uZTpkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCksXG4gICAgICAgICAgICBtb2RlOidzdGF0aWMnLFxuICAgICAgICAgICAgcG9zaXRpb246e1xuICAgICAgICAgICAgICAgIGxlZnQ6ICc1MCUnLFxuICAgICAgICAgICAgICAgIHRvcDonNTAlJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNpemU6MjAwLFxuICAgICAgICAgICAgY29sb3I6JyMzZjUxYjUnXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5qb3lzdGljay5vbignbW92ZScsdGhpcy5fbW92ZS5iaW5kKHRoaXMpKVxuICAgIH1cbiAgICBcbiAgICBfbW92ZShldnQsIGRhdGEpe1xuICAgICAgICBjb25zb2xlLmRlYnVnKGRhdGEpO1xuICAgICAgICBcbiAgICB9XG4gICAgXG59XG5cbm1vZHVsZS5leHBvcnRzID0gSm95c3RpY2s7IiwiJ3VzZSBzdHJpY3QnXG5cbmNsYXNzIENvbmZpZyB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICB9XG5cbiAgICBuYW1lKCkgeyByZXR1cm4gXCJNYWtlYmxvY2tfTEVcIjsgfVxuICAgIHNlcnZpY2UoKSB7IHJldHVybiBcIjAwMDBmZmUxLTAwMDAtMTAwMC04MDAwLTAwODA1ZjliMzRmYlwiIH1cbiAgICBjaGFyYXRlcmlzdGljKCkgeyByZXR1cm4gXCIwMDAwZmZlMy0wMDAwLTEwMDAtODAwMC0wMDgwNWY5YjM0ZmJcIiB9XG59XG5cblxuY29uc3QgVFlQRV9NT1RPUiA9IDB4MGEsXG4gICAgVFlQRV9SR0IgPSAweDA4LFxuICAgIFRZUEVfU09VTkQgPSAweDA3O1xuXG5cbmNvbnN0IFBPUlRfMSA9IDB4MDEsXG4gICAgUE9SVF8yID0gMHgwMixcbiAgICBQT1JUXzMgPSAweDAzLFxuICAgIFBPUlRfNCA9IDB4MDQsXG4gICAgUE9SVF81ID0gMHgwNSxcbiAgICBQT1JUXzYgPSAweDA2LFxuICAgIFBPUlRfNyA9IDB4MDcsXG4gICAgUE9SVF84ID0gMHgwOCxcbiAgICBNXzEgPSAweDA5LFxuICAgIE1fMiA9IDB4MGE7XG4gICAgXG5cbmNsYXNzIE1Cb3Qge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmRldmljZSA9IG51bGw7XG4gICAgICAgIHRoaXMuY29uZmlnID0gbmV3IENvbmZpZygpO1xuICAgICAgICB0aGlzLm9uRGlzY29ubmVjdGVkID0gdGhpcy5vbkRpc2Nvbm5lY3RlZC5iaW5kKHRoaXMpO1xuICAgIH1cblxuICAgIHJlcXVlc3QoKSB7XG4gICAgICAgIGxldCBvcHRpb25zID0ge1xuICAgICAgICAgICAgXCJmaWx0ZXJzXCI6IFt7XG4gICAgICAgICAgICAgICAgXCJuYW1lXCI6IHRoaXMuY29uZmlnLm5hbWUoKVxuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICBcIm9wdGlvbmFsU2VydmljZXNcIjogW3RoaXMuY29uZmlnLnNlcnZpY2UoKV1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIG5hdmlnYXRvci5ibHVldG9vdGgucmVxdWVzdERldmljZShvcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oZGV2aWNlID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmRldmljZSA9IGRldmljZTtcbiAgICAgICAgICAgICAgICB0aGlzLmRldmljZS5hZGRFdmVudExpc3RlbmVyKCdnYXR0c2VydmVyZGlzY29ubmVjdGVkJywgdGhpcy5vbkRpc2Nvbm5lY3RlZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRldmljZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbm5lY3QoKSB7XG4gICAgICAgIGlmICghdGhpcy5kZXZpY2UpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgnRGV2aWNlIGlzIG5vdCBjb25uZWN0ZWQuJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kZXZpY2UuZ2F0dC5jb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm9jZXNzTW90b3IodmFsdWVNMSwgdmFsdWVNMikge1xuICAgICAgICByZXR1cm4gdGhpcy5fd3JpdGVDaGFyYWN0ZXJpc3RpYyh0aGlzLl9nZW5lcmljQ29udHJvbChUWVBFX01PVE9SLCBNXzEsIDAsIHZhbHVlTTEpKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl93cml0ZUNoYXJhY3RlcmlzdGljKHRoaXMuX2dlbmVyaWNDb250cm9sKFRZUEVfTU9UT1IsIE1fMiwgMCwgdmFsdWVNMikpO1xuICAgICAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwcm9jZXNzQnV6emVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fd3JpdGVDaGFyYWN0ZXJpc3RpYyh0aGlzLl9nZW5lcmljQ29udHJvbChUWVBFX1NPVU5ELCAwLCAwLCAwKSlcbiAgICAgICAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgcHJvY2Vzc0NvbG9yKHJlZCxibHVlLGdyZWVuKXtcbiAgICAgICAgbGV0IHJIZXggPSByZWQ8PDg7XG5cdFx0bGV0IGdIZXggPSBncmVlbjw8MTY7XG5cdFx0bGV0IGJIZXggPSBibHVlPDwyNDtcblx0XHRsZXQgdmFsdWUgPSBySGV4IHwgZ0hleCB8IGJIZXg7XG5cdFx0dGhpcy5fd3JpdGVDaGFyYWN0ZXJpc3RpYyh0aGlzLl9nZW5lcmljQ29udHJvbChUWVBFX1JHQixQT1JUXzYsMCx2YWx1ZSkpO1xuICAgICAgICBcbiAgICB9XG5cbiAgICBkaXNjb25uZWN0KCkge1xuICAgICAgICBpZiAoIXRoaXMuZGV2aWNlKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ0RldmljZSBpcyBub3QgY29ubmVjdGVkLicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGV2aWNlLmdhdHQuZGlzY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25EaXNjb25uZWN0ZWQoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdEZXZpY2UgaXMgZGlzY29ubmVjdGVkLicpO1xuICAgIH1cblxuXG4gICAgX2dlbmVyaWNDb250cm9sKHR5cGUsIHBvcnQsIHNsb3QsIHZhbHVlKSB7XG4gICAgICAgIC8qXG4gICAgICAgIGZmIDU1IGxlbiBpZHggYWN0aW9uIGRldmljZSBwb3J0ICBzbG90ICBkYXRhIGFcbiAgICAgICAgMCAgMSAgMiAgIDMgICA0ICAgICAgNSAgICAgIDYgICAgIDcgICAgIDhcbiAgICAgICAgKi9cbiAgICAgICAgLy91bnNpZ25lZCBjaGFyIGFbMTFdPXsweGZmLDB4NTUsV1JJVEVNT0RVTEUsNywwLDAsMCwwLDAsMCwnXFxuJ307XG4gICAgICAgIC8vYVs0XSA9IFt0eXBlIGludFZhbHVlXTtcbiAgICAgICAgLy9hWzVdID0gKHBvcnQ8PDQgJiAweGYwKXwoc2xvdCAmIDB4Zik7XG4gICAgICAgIC8vIFN0YXRpYyB2YWx1ZXNcbiAgICAgICAgdmFyIGJ1ZiA9IG5ldyBBcnJheUJ1ZmZlcigxNik7XG4gICAgICAgIHZhciBidWZWaWV3ID0gbmV3IFVpbnQxNkFycmF5KGJ1Zik7XG5cbiAgICAgICAgdmFyIGJ5dGUwID0gMHhmZiwgLy8gU3RhdGljIGhlYWRlclxuICAgICAgICAgICAgYnl0ZTEgPSAweDU1LCAvLyBTdGF0aWMgaGVhZGVyXG4gICAgICAgICAgICBieXRlMiA9IDB4MDksIC8vIGxlblxuICAgICAgICAgICAgYnl0ZTMgPSAweDAwLCAvLyBpZHhcbiAgICAgICAgICAgIGJ5dGU0ID0gMHgwMiwgLy8gYWN0aW9uXG4gICAgICAgICAgICBieXRlNSA9IHR5cGUsIC8vIGRldmljZVxuICAgICAgICAgICAgYnl0ZTYgPSBwb3J0LCAvLyBwb3J0XG4gICAgICAgICAgICBieXRlNyA9IHNsb3Q7IC8vIHNsb3RcbiAgICAgICAgLy9keW5hbWljcyB2YWx1ZXNcbiAgICAgICAgdmFyIGJ5dGU4ID0gMHgwMCwgLy8gZGF0YVxuICAgICAgICAgICAgYnl0ZTkgPSAweDAwLCAvLyBkYXRhXG4gICAgICAgICAgICBieXRlMTAgPSAweDAwLCAvLyBkYXRhXG4gICAgICAgICAgICBieXRlMTEgPSAweDAwOyAvLyBkYXRhXG4gICAgICAgIC8vRW5kIG9mIG1lc3NhZ2VcbiAgICAgICAgdmFyIGJ5dGUxMiA9IDB4MGEsXG4gICAgICAgICAgICBieXRlMTMgPSAweDAwLFxuICAgICAgICAgICAgYnl0ZTE0ID0gMHgwMCxcbiAgICAgICAgICAgIGJ5dGUxNSA9IDB4MDA7XG5cbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFRZUEVfTU9UT1I6XG4gICAgICAgICAgICAgICAgLy8gTW90b3IgTTFcbiAgICAgICAgICAgICAgICAvLyBmZjo1NSAgMDk6MDAgIDAyOjBhICAwOTo2NCAgMDA6MDAgIDAwOjAwICAwYVwiXG4gICAgICAgICAgICAgICAgLy8gMHg1NWZmOzB4MDAwOTsweDBhMDI7MHgwOTY0OzB4MDAwMDsweDAwMDA7MHgwMDBhOzB4MDAwMDtcbiAgICAgICAgICAgICAgICAvL1wiZmY6NTU6MDk6MDA6MDI6MGE6MDk6MDA6MDA6MDA6MDA6MDA6MGFcIlxuICAgICAgICAgICAgICAgIC8vIGZmOjU1OjA5OjAwOjAyOjBhOjA5OjljOmZmOjAwOjAwOjAwOjBhXG4gICAgICAgICAgICAgICAgLy8gTW90b3IgTTJcbiAgICAgICAgICAgICAgICAvLyBmZjo1NTowOTowMDowMjowYTowYTo2NDowMDowMDowMDowMDowYVxuICAgICAgICAgICAgICAgIC8vIGZmOjU1OjA5OjAwOjAyOjBhOjBhOjAwOjAwOjAwOjAwOjAwOjBhXG4gICAgICAgICAgICAgICAgLy8gZmY6NTU6MDk6MDA6MDI6MGE6MGE6OWM6ZmY6MDA6MDA6MDA6MGFcbiAgICAgICAgICAgICAgICB2YXIgdGVtcFZhbHVlID0gdmFsdWUgPCAwID8gKHBhcnNlSW50KFwiZmZmZlwiLCAxNikgKyBNYXRoLm1heCgtMjU1LCB2YWx1ZSkpIDogTWF0aC5taW4oMjU1LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgYnl0ZTcgPSB0ZW1wVmFsdWUgJiAweDAwZmY7XG4gICAgICAgICAgICAgICAgYnl0ZTggPSAweDAwO1xuICAgICAgICAgICAgICAgIGJ5dGU4ID0gdGVtcFZhbHVlID4+IDg7XG5cbiAgICAgICAgICAgICAgICAvKmJ5dGU1ID0gMHgwYTtcbiAgICAgICAgICAgICAgICBieXRlNiA9IDB4MDk7XG4gICAgICAgICAgICAgICAgYnl0ZTcgPSAweDY0O1xuICAgICAgICAgICAgICAgIGJ5dGU4ID0gMHgwMDsqL1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFRZUEVfUkdCOlxuICAgICAgICAgICAgICAgIC8vIGZmOjU1ICAwOTowMCAgMDI6MDggIDA2OjAwICA1Yzo5OSAgNmQ6MDAgIDBhXG4gICAgICAgICAgICAgICAgLy8gMHg1NWZmOzB4MDAwOTsweDA4MDI7MHgwMDA2OzB4OTk1YzsweDAwNmQ7MHgwMDBhOzB4MDAwMDtcbiAgICAgICAgICAgICAgICBieXRlNyA9IDB4MDA7XG4gICAgICAgICAgICAgICAgYnl0ZTggPSB2YWx1ZSA+PiA4ICYgMHhmZjtcbiAgICAgICAgICAgICAgICBieXRlOSA9IHZhbHVlID4+IDE2ICYgMHhmZjtcbiAgICAgICAgICAgICAgICBieXRlMTAgPSB2YWx1ZSA+PiAyNCAmIDB4ZmY7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFRZUEVfU09VTkQ6XG4gICAgICAgICAgICAgICAgLy9mZjo1NTowNTowMDowMjoyMjowMDowMDowYVxuICAgICAgICAgICAgICAgIC8vZmY6NTU6MDU6MDA6MDI6MjI6MDY6MDE6MGFcbiAgICAgICAgICAgICAgICAvL2ZmOjU1OjA1OjAwOjAyOjIyOmVlOjAxOjBhXG4gICAgICAgICAgICAgICAgLy9mZjo1NTowNTowMDowMjoyMjo4ODowMTowYVxuICAgICAgICAgICAgICAgIC8vZmY6NTU6MDU6MDA6MDI6MjI6Yjg6MDE6MGFcbiAgICAgICAgICAgICAgICAvL2ZmOjU1OjA1OjAwOjAyOjIyOjVkOjAxOjBhXG4gICAgICAgICAgICAgICAgLy9mZjo1NTowNTowMDowMjoyMjo0YTowMTowYVxuICAgICAgICAgICAgICAgIC8vZmY6NTU6MDU6MDA6MDI6MjI6MjY6MDE6MGFcbiAgICAgICAgICAgICAgICBieXRlMiA9IDB4MDU7XG4gICAgICAgICAgICAgICAgYnl0ZTUgPSAweDIyO1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBieXRlNiA9IDB4MDA7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU3ID0gMHgwMDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU2ID0gMHgwNjtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTcgPSAweDAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTYgPSAweGVlO1xuICAgICAgICAgICAgICAgICAgICBieXRlNyA9IDB4MDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gMykge1xuICAgICAgICAgICAgICAgICAgICBieXRlNiA9IDB4ODg7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU3ID0gMHgwMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU2ID0gMHhiODtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTcgPSAweDAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IDUpIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTYgPSAweDVkO1xuICAgICAgICAgICAgICAgICAgICBieXRlNyA9IDB4MDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gNikge1xuICAgICAgICAgICAgICAgICAgICBieXRlNiA9IDB4NGE7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU3ID0gMHgwMTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBieXRlNiA9IDB4MjY7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU3ID0gMHgwMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnl0ZTggPSAweDBhO1xuICAgICAgICAgICAgICAgIGJ5dGUxMiA9IDB4MDA7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGJ1ZlZpZXdbMF0gPSBieXRlMSA8PCA4IHwgYnl0ZTA7XG4gICAgICAgIGJ1ZlZpZXdbMV0gPSBieXRlMyA8PCA4IHwgYnl0ZTI7XG4gICAgICAgIGJ1ZlZpZXdbMl0gPSBieXRlNSA8PCA4IHwgYnl0ZTQ7XG4gICAgICAgIGJ1ZlZpZXdbM10gPSBieXRlNyA8PCA4IHwgYnl0ZTY7XG4gICAgICAgIGJ1ZlZpZXdbNF0gPSBieXRlOSA8PCA4IHwgYnl0ZTg7XG4gICAgICAgIGJ1ZlZpZXdbNV0gPSBieXRlMTEgPDwgOCB8IGJ5dGUxMDtcbiAgICAgICAgYnVmVmlld1s2XSA9IGJ5dGUxMyA8PCA4IHwgYnl0ZTEyO1xuICAgICAgICBidWZWaWV3WzddID0gYnl0ZTE1IDw8IDggfCBieXRlMTQ7XG4gICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgYnl0ZTAudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTEudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTIudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTMudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTQudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTUudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTYudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTcudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTgudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTkudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTEwLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ5dGUxMS50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlMTIudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTEzLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ5dGUxNC50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlMTUudG9TdHJpbmcoMTYpICsgXCI6XCJcbiAgICAgICAgKTtcbiAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICBidWZWaWV3WzBdLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ1ZlZpZXdbMV0udG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnVmVmlld1syXS50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBidWZWaWV3WzNdLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ1ZlZpZXdbNF0udG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnVmVmlld1s1XS50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBidWZWaWV3WzZdLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ1ZlZpZXdbN10udG9TdHJpbmcoMTYpXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiBidWY7XG4gICAgfVxuXG4gICAgX3dyaXRlQ2hhcmFjdGVyaXN0aWModmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGV2aWNlLmdhdHQuZ2V0UHJpbWFyeVNlcnZpY2UodGhpcy5jb25maWcuc2VydmljZSgpKVxuICAgICAgICAgICAgLnRoZW4oc2VydmljZSA9PiBzZXJ2aWNlLmdldENoYXJhY3RlcmlzdGljKHRoaXMuY29uZmlnLmNoYXJhdGVyaXN0aWMoKSkpXG4gICAgICAgICAgICAudGhlbihjaGFyYWN0ZXJpc3RpYyA9PiBjaGFyYWN0ZXJpc3RpYy53cml0ZVZhbHVlKHZhbHVlKSk7XG4gICAgfVxuXG5cbn1cblxuY29uc3QgREVWSUNFX05BTUUgPSBcIk1ha2VibG9ja19MRVwiLFxuICAgIFNFUlZJQ0VfVVVJRCA9IFwiMDAwMGZmZTEtMDAwMC0xMDAwLTgwMDAtMDA4MDVmOWIzNGZiXCIsXG4gICAgQ0hBUkFDVEVSSVNUSUNfVVVJRCA9IFwiMDAwMGZmZTMtMDAwMC0xMDAwLTgwMDAtMDA4MDVmOWIzNGZiXCI7XG5cblxuXG5cblxubGV0IG1Cb3QgPSBuZXcgTUJvdCgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1Cb3Q7Il19
