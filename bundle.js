(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

function pageLoad() {

    let noBluetooth = document.getElementById("noBluetooth");
    let stepConnect = document.getElementById("stepConnect");
    let stepControl = document.getElementById("stepControl");
    if (navigator.bluetooth == undefined) {
        console.error("No navigator.bluetooth found.");
        stepConnect.style.display = "none";
        noBluetooth.style.display = "block";
        
        
        
    } else {
        stepConnect.style.display = "block";
        noBluetooth.style.display = "none";
        let mBot = require("./mbot/mbot");
        
        document.getElementById("connectBtn").addEventListener('click', _=>{            
            mBot.request()
            .then(_=>{
                return mBot.connect();
            })
            .then(_=>{
                stepConnect.style.display = "none";
                stepControl.style.display = "block";
            })
        });
		
		let ColorPicker = require('./components/colorpicker.js');
		new ColorPicker((rgb) => {
			mBot.processColor(rgb.red, rgb.blue, rgb.green);
		});
        
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzY3JpcHRzL2FwcC5qcyIsInNjcmlwdHMvY29tcG9uZW50cy9jb2xvcnBpY2tlci5qcyIsInNjcmlwdHMvY29tcG9uZW50cy9qb3lzdGljay5qcyIsInNjcmlwdHMvbWJvdC9tYm90LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnXG5cbmZ1bmN0aW9uIHBhZ2VMb2FkKCkge1xuXG4gICAgbGV0IG5vQmx1ZXRvb3RoID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJub0JsdWV0b290aFwiKTtcbiAgICBsZXQgc3RlcENvbm5lY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInN0ZXBDb25uZWN0XCIpO1xuICAgIGxldCBzdGVwQ29udHJvbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RlcENvbnRyb2xcIik7XG4gICAgaWYgKG5hdmlnYXRvci5ibHVldG9vdGggPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJObyBuYXZpZ2F0b3IuYmx1ZXRvb3RoIGZvdW5kLlwiKTtcbiAgICAgICAgc3RlcENvbm5lY3Quc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICBub0JsdWV0b290aC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIFxuICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ZXBDb25uZWN0LnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgIG5vQmx1ZXRvb3RoLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgbGV0IG1Cb3QgPSByZXF1aXJlKFwiLi9tYm90L21ib3RcIik7XG4gICAgICAgIFxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbm5lY3RCdG5cIikuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBfPT57ICAgICAgICAgICAgXG4gICAgICAgICAgICBtQm90LnJlcXVlc3QoKVxuICAgICAgICAgICAgLnRoZW4oXz0+e1xuICAgICAgICAgICAgICAgIHJldHVybiBtQm90LmNvbm5lY3QoKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihfPT57XG4gICAgICAgICAgICAgICAgc3RlcENvbm5lY3Quc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgIHN0ZXBDb250cm9sLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9KTtcblx0XHRcblx0XHRsZXQgQ29sb3JQaWNrZXIgPSByZXF1aXJlKCcuL2NvbXBvbmVudHMvY29sb3JwaWNrZXIuanMnKTtcblx0XHRuZXcgQ29sb3JQaWNrZXIoKHJnYikgPT4ge1xuXHRcdFx0bUJvdC5wcm9jZXNzQ29sb3IocmdiLnJlZCwgcmdiLmJsdWUsIHJnYi5ncmVlbik7XG5cdFx0fSk7XG4gICAgICAgIFxuICAgICAgICBsZXQgSm95c3RpY2sgPSByZXF1aXJlKCcuL2NvbXBvbmVudHMvam95c3RpY2suanMnKTtcbiAgICAgICAgbmV3IEpveXN0aWNrKCdqb3lzdGljaycpO1xuICAgICAgICBcbiAgICAgICAgbGV0IHBhcnRKb3lzdGljayA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wYXJ0LWpveXN0aWNrJyk7XG4gICAgICAgIGxldCBwYXJ0QnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnBhcnQtYnV0dG9uJyk7XG4gICAgICAgIGxldCBzd2l0Y2hQYXJ0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzd2l0Y2hQYXJ0cycpO1xuICAgICAgICBzd2l0Y2hQYXJ0cy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2dCl7XG4gICAgICAgICAgIGlmICh0aGlzLmNoZWNrZWQpe1xuICAgICAgICAgICAgICAgcGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgcGFydEpveXN0aWNrLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICBwYXJ0QnRuLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgICAgICAgIHBhcnRKb3lzdGljay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgXG4gICAgICAgICAgIH0gXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICB9XG5cdFxufVxuXG5cblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBwYWdlTG9hZCk7IiwiXG5jbGFzcyBDb2xvclBpY2tlciB7XG4gICAgY29uc3RydWN0b3IoY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5pbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgdGhpcy5pbWcuc3JjID0gJy4vYXNzZXRzL2ltYWdlcy9jb2xvci13aGVlbC5wbmcnO1xuICAgICAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignY2FudmFzJyk7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIHRoaXMuaW1nLm9ubG9hZCA9IHRoaXMuX2xvYWQuYmluZCh0aGlzKTtcbiAgICB9XG5cblxuICAgIF9sb2FkKCkge1xuICAgICAgICBcbiAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSAxNTAgKiBkZXZpY2VQaXhlbFJhdGlvO1xuICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSAxNTAgKiBkZXZpY2VQaXhlbFJhdGlvO1xuICAgICAgICB0aGlzLmNhbnZhcy5zdHlsZS53aWR0aCA9IFwiMTUwcHhcIjtcbiAgICAgICAgdGhpcy5jYW52YXMuc3R5bGUuaGVpZ2h0ID0gXCIxNTBweFwiO1xuICAgICAgICB0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX2NhbGN1bGF0ZVJnYi5iaW5kKHRoaXMpKTtcblxuICAgICAgICB0aGlzLmNvbnRleHQuZHJhd0ltYWdlKHRoaXMuaW1nLCAwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcbiAgICB9XG5cblxuICAgIF9jYWxjdWxhdGVSZ2IoZXZ0KSB7XG4gICAgICAgIC8vIFJlZnJlc2ggY2FudmFzIGluIGNhc2UgdXNlciB6b29tcyBhbmQgZGV2aWNlUGl4ZWxSYXRpbyBjaGFuZ2VzLlxuICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IDE1MCAqIGRldmljZVBpeGVsUmF0aW87XG4gICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IDE1MCAqIGRldmljZVBpeGVsUmF0aW87XG4gICAgICAgIHRoaXMuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5pbWcsIDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xuXG4gICAgICAgIGxldCByZWN0ID0gdGhpcy5jYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGxldCB4ID0gTWF0aC5yb3VuZCgoZXZ0LmNsaWVudFggLSByZWN0LmxlZnQpICogZGV2aWNlUGl4ZWxSYXRpbyk7XG4gICAgICAgIGxldCB5ID0gTWF0aC5yb3VuZCgoZXZ0LmNsaWVudFkgLSByZWN0LnRvcCkgKiBkZXZpY2VQaXhlbFJhdGlvKTtcbiAgICAgICAgbGV0IGRhdGEgPSB0aGlzLmNvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpLmRhdGE7XG5cbiAgICAgICAgbGV0IHIgPSBkYXRhWygodGhpcy5jYW52YXMud2lkdGggKiB5KSArIHgpICogNF07XG4gICAgICAgIGxldCBnID0gZGF0YVsoKHRoaXMuY2FudmFzLndpZHRoICogeSkgKyB4KSAqIDQgKyAxXTtcbiAgICAgICAgbGV0IGIgPSBkYXRhWygodGhpcy5jYW52YXMud2lkdGggKiB5KSArIHgpICogNCArIDJdO1xuXG4gICAgICAgIHRoaXMuY2FsbGJhY2soe1xuICAgICAgICAgICAgcmVkOiByLFxuICAgICAgICAgICAgYmx1ZTogYixcbiAgICAgICAgICAgIGdyZWVuOiBnXG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgdGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmNvbnRleHQuYXJjKHgsIHkgKyAyLCAxMCAqIGRldmljZVBpeGVsUmF0aW8sIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuY29udGV4dC5zaGFkb3dDb2xvciA9ICcjMzMzJztcbiAgICAgICAgdGhpcy5jb250ZXh0LnNoYWRvd0JsdXIgPSA0ICogZGV2aWNlUGl4ZWxSYXRpbztcbiAgICAgICAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9ICd3aGl0ZSc7XG4gICAgICAgIHRoaXMuY29udGV4dC5maWxsKCk7XG4gICAgfVxuXG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb2xvclBpY2tlcjsiLCJjbGFzcyBKb3lzdGlja3tcblxuICAgIGNvbnN0cnVjdG9yKGlkKXtcbiAgICAgICAgdGhpcy5qb3lzdGljayA9IG5pcHBsZWpzLmNyZWF0ZSh7XG4gICAgICAgICAgICB6b25lOmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKSxcbiAgICAgICAgICAgIG1vZGU6J3N0YXRpYycsXG4gICAgICAgICAgICBwb3NpdGlvbjp7XG4gICAgICAgICAgICAgICAgbGVmdDogJzUwJScsXG4gICAgICAgICAgICAgICAgdG9wOic1MCUnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2l6ZToyMDAsXG4gICAgICAgICAgICBjb2xvcjonIzNmNTFiNSdcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmpveXN0aWNrLm9uKCdtb3ZlJyx0aGlzLl9tb3ZlLmJpbmQodGhpcykpXG4gICAgfVxuICAgIFxuICAgIF9tb3ZlKGV2dCwgZGF0YSl7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoZGF0YSk7XG4gICAgICAgIFxuICAgIH1cbiAgICBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBKb3lzdGljazsiLCIndXNlIHN0cmljdCdcblxuY2xhc3MgQ29uZmlnIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgIH1cblxuICAgIG5hbWUoKSB7IHJldHVybiBcIk1ha2VibG9ja19MRVwiOyB9XG4gICAgc2VydmljZSgpIHsgcmV0dXJuIFwiMDAwMGZmZTEtMDAwMC0xMDAwLTgwMDAtMDA4MDVmOWIzNGZiXCIgfVxuICAgIGNoYXJhdGVyaXN0aWMoKSB7IHJldHVybiBcIjAwMDBmZmUzLTAwMDAtMTAwMC04MDAwLTAwODA1ZjliMzRmYlwiIH1cbn1cblxuXG5jb25zdCBUWVBFX01PVE9SID0gMHgwYSxcbiAgICBUWVBFX1JHQiA9IDB4MDgsXG4gICAgVFlQRV9TT1VORCA9IDB4MDc7XG5cblxuY29uc3QgUE9SVF8xID0gMHgwMSxcbiAgICBQT1JUXzIgPSAweDAyLFxuICAgIFBPUlRfMyA9IDB4MDMsXG4gICAgUE9SVF80ID0gMHgwNCxcbiAgICBQT1JUXzUgPSAweDA1LFxuICAgIFBPUlRfNiA9IDB4MDYsXG4gICAgUE9SVF83ID0gMHgwNyxcbiAgICBQT1JUXzggPSAweDA4LFxuICAgIE1fMSA9IDB4MDksXG4gICAgTV8yID0gMHgwYTtcbiAgICBcblxuY2xhc3MgTUJvdCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZGV2aWNlID0gbnVsbDtcbiAgICAgICAgdGhpcy5jb25maWcgPSBuZXcgQ29uZmlnKCk7XG4gICAgICAgIHRoaXMub25EaXNjb25uZWN0ZWQgPSB0aGlzLm9uRGlzY29ubmVjdGVkLmJpbmQodGhpcyk7XG4gICAgfVxuXG4gICAgcmVxdWVzdCgpIHtcbiAgICAgICAgbGV0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBcImZpbHRlcnNcIjogW3tcbiAgICAgICAgICAgICAgICBcIm5hbWVcIjogdGhpcy5jb25maWcubmFtZSgpXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIFwib3B0aW9uYWxTZXJ2aWNlc1wiOiBbdGhpcy5jb25maWcuc2VydmljZSgpXVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gbmF2aWdhdG9yLmJsdWV0b290aC5yZXF1ZXN0RGV2aWNlKG9wdGlvbnMpXG4gICAgICAgICAgICAudGhlbihkZXZpY2UgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZGV2aWNlID0gZGV2aWNlO1xuICAgICAgICAgICAgICAgIHRoaXMuZGV2aWNlLmFkZEV2ZW50TGlzdGVuZXIoJ2dhdHRzZXJ2ZXJkaXNjb25uZWN0ZWQnLCB0aGlzLm9uRGlzY29ubmVjdGVkKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGV2aWNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29ubmVjdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmRldmljZSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCdEZXZpY2UgaXMgbm90IGNvbm5lY3RlZC4nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRldmljZS5nYXR0LmNvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb2Nlc3NNb3Rvcih2YWx1ZU0xLCB2YWx1ZU0yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl93cml0ZUNoYXJhY3RlcmlzdGljKHRoaXMuX2dlbmVyaWNDb250cm9sKFRZUEVfTU9UT1IsIE1fMSwgMCwgdmFsdWVNMSkpXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dyaXRlQ2hhcmFjdGVyaXN0aWModGhpcy5fZ2VuZXJpY0NvbnRyb2woVFlQRV9NT1RPUiwgTV8yLCAwLCB2YWx1ZU0yKSk7XG4gICAgICAgICAgICB9KS5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHByb2Nlc3NCdXp6ZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl93cml0ZUNoYXJhY3RlcmlzdGljKHRoaXMuX2dlbmVyaWNDb250cm9sKFRZUEVfU09VTkQsIDAsIDAsIDApKVxuICAgICAgICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBwcm9jZXNzQ29sb3IocmVkLGJsdWUsZ3JlZW4pe1xuICAgICAgICBsZXQgckhleCA9IHJlZDw8ODtcblx0XHRsZXQgZ0hleCA9IGdyZWVuPDwxNjtcblx0XHRsZXQgYkhleCA9IGJsdWU8PDI0O1xuXHRcdGxldCB2YWx1ZSA9IHJIZXggfCBnSGV4IHwgYkhleDtcblx0XHR0aGlzLl93cml0ZUNoYXJhY3RlcmlzdGljKHRoaXMuX2dlbmVyaWNDb250cm9sKFRZUEVfUkdCLFBPUlRfNiwwLHZhbHVlKSk7XG4gICAgICAgIFxuICAgIH1cblxuICAgIGRpc2Nvbm5lY3QoKSB7XG4gICAgICAgIGlmICghdGhpcy5kZXZpY2UpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgnRGV2aWNlIGlzIG5vdCBjb25uZWN0ZWQuJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kZXZpY2UuZ2F0dC5kaXNjb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbkRpc2Nvbm5lY3RlZCgpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0RldmljZSBpcyBkaXNjb25uZWN0ZWQuJyk7XG4gICAgfVxuXG5cbiAgICBfZ2VuZXJpY0NvbnRyb2wodHlwZSwgcG9ydCwgc2xvdCwgdmFsdWUpIHtcbiAgICAgICAgLypcbiAgICAgICAgZmYgNTUgbGVuIGlkeCBhY3Rpb24gZGV2aWNlIHBvcnQgIHNsb3QgIGRhdGEgYVxuICAgICAgICAwICAxICAyICAgMyAgIDQgICAgICA1ICAgICAgNiAgICAgNyAgICAgOFxuICAgICAgICAqL1xuICAgICAgICAvL3Vuc2lnbmVkIGNoYXIgYVsxMV09ezB4ZmYsMHg1NSxXUklURU1PRFVMRSw3LDAsMCwwLDAsMCwwLCdcXG4nfTtcbiAgICAgICAgLy9hWzRdID0gW3R5cGUgaW50VmFsdWVdO1xuICAgICAgICAvL2FbNV0gPSAocG9ydDw8NCAmIDB4ZjApfChzbG90ICYgMHhmKTtcbiAgICAgICAgLy8gU3RhdGljIHZhbHVlc1xuICAgICAgICB2YXIgYnVmID0gbmV3IEFycmF5QnVmZmVyKDE2KTtcbiAgICAgICAgdmFyIGJ1ZlZpZXcgPSBuZXcgVWludDE2QXJyYXkoYnVmKTtcblxuICAgICAgICB2YXIgYnl0ZTAgPSAweGZmLCAvLyBTdGF0aWMgaGVhZGVyXG4gICAgICAgICAgICBieXRlMSA9IDB4NTUsIC8vIFN0YXRpYyBoZWFkZXJcbiAgICAgICAgICAgIGJ5dGUyID0gMHgwOSwgLy8gbGVuXG4gICAgICAgICAgICBieXRlMyA9IDB4MDAsIC8vIGlkeFxuICAgICAgICAgICAgYnl0ZTQgPSAweDAyLCAvLyBhY3Rpb25cbiAgICAgICAgICAgIGJ5dGU1ID0gdHlwZSwgLy8gZGV2aWNlXG4gICAgICAgICAgICBieXRlNiA9IHBvcnQsIC8vIHBvcnRcbiAgICAgICAgICAgIGJ5dGU3ID0gc2xvdDsgLy8gc2xvdFxuICAgICAgICAvL2R5bmFtaWNzIHZhbHVlc1xuICAgICAgICB2YXIgYnl0ZTggPSAweDAwLCAvLyBkYXRhXG4gICAgICAgICAgICBieXRlOSA9IDB4MDAsIC8vIGRhdGFcbiAgICAgICAgICAgIGJ5dGUxMCA9IDB4MDAsIC8vIGRhdGFcbiAgICAgICAgICAgIGJ5dGUxMSA9IDB4MDA7IC8vIGRhdGFcbiAgICAgICAgLy9FbmQgb2YgbWVzc2FnZVxuICAgICAgICB2YXIgYnl0ZTEyID0gMHgwYSxcbiAgICAgICAgICAgIGJ5dGUxMyA9IDB4MDAsXG4gICAgICAgICAgICBieXRlMTQgPSAweDAwLFxuICAgICAgICAgICAgYnl0ZTE1ID0gMHgwMDtcblxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgVFlQRV9NT1RPUjpcbiAgICAgICAgICAgICAgICAvLyBNb3RvciBNMVxuICAgICAgICAgICAgICAgIC8vIGZmOjU1ICAwOTowMCAgMDI6MGEgIDA5OjY0ICAwMDowMCAgMDA6MDAgIDBhXCJcbiAgICAgICAgICAgICAgICAvLyAweDU1ZmY7MHgwMDA5OzB4MGEwMjsweDA5NjQ7MHgwMDAwOzB4MDAwMDsweDAwMGE7MHgwMDAwO1xuICAgICAgICAgICAgICAgIC8vXCJmZjo1NTowOTowMDowMjowYTowOTowMDowMDowMDowMDowMDowYVwiXG4gICAgICAgICAgICAgICAgLy8gZmY6NTU6MDk6MDA6MDI6MGE6MDk6OWM6ZmY6MDA6MDA6MDA6MGFcbiAgICAgICAgICAgICAgICAvLyBNb3RvciBNMlxuICAgICAgICAgICAgICAgIC8vIGZmOjU1OjA5OjAwOjAyOjBhOjBhOjY0OjAwOjAwOjAwOjAwOjBhXG4gICAgICAgICAgICAgICAgLy8gZmY6NTU6MDk6MDA6MDI6MGE6MGE6MDA6MDA6MDA6MDA6MDA6MGFcbiAgICAgICAgICAgICAgICAvLyBmZjo1NTowOTowMDowMjowYTowYTo5YzpmZjowMDowMDowMDowYVxuICAgICAgICAgICAgICAgIHZhciB0ZW1wVmFsdWUgPSB2YWx1ZSA8IDAgPyAocGFyc2VJbnQoXCJmZmZmXCIsIDE2KSArIE1hdGgubWF4KC0yNTUsIHZhbHVlKSkgOiBNYXRoLm1pbigyNTUsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICBieXRlNyA9IHRlbXBWYWx1ZSAmIDB4MDBmZjtcbiAgICAgICAgICAgICAgICBieXRlOCA9IDB4MDA7XG4gICAgICAgICAgICAgICAgYnl0ZTggPSB0ZW1wVmFsdWUgPj4gODtcblxuICAgICAgICAgICAgICAgIC8qYnl0ZTUgPSAweDBhO1xuICAgICAgICAgICAgICAgIGJ5dGU2ID0gMHgwOTtcbiAgICAgICAgICAgICAgICBieXRlNyA9IDB4NjQ7XG4gICAgICAgICAgICAgICAgYnl0ZTggPSAweDAwOyovXG5cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgVFlQRV9SR0I6XG4gICAgICAgICAgICAgICAgLy8gZmY6NTUgIDA5OjAwICAwMjowOCAgMDY6MDAgIDVjOjk5ICA2ZDowMCAgMGFcbiAgICAgICAgICAgICAgICAvLyAweDU1ZmY7MHgwMDA5OzB4MDgwMjsweDAwMDY7MHg5OTVjOzB4MDA2ZDsweDAwMGE7MHgwMDAwO1xuICAgICAgICAgICAgICAgIGJ5dGU3ID0gMHgwMDtcbiAgICAgICAgICAgICAgICBieXRlOCA9IHZhbHVlID4+IDggJiAweGZmO1xuICAgICAgICAgICAgICAgIGJ5dGU5ID0gdmFsdWUgPj4gMTYgJiAweGZmO1xuICAgICAgICAgICAgICAgIGJ5dGUxMCA9IHZhbHVlID4+IDI0ICYgMHhmZjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgVFlQRV9TT1VORDpcbiAgICAgICAgICAgICAgICAvL2ZmOjU1OjA1OjAwOjAyOjIyOjAwOjAwOjBhXG4gICAgICAgICAgICAgICAgLy9mZjo1NTowNTowMDowMjoyMjowNjowMTowYVxuICAgICAgICAgICAgICAgIC8vZmY6NTU6MDU6MDA6MDI6MjI6ZWU6MDE6MGFcbiAgICAgICAgICAgICAgICAvL2ZmOjU1OjA1OjAwOjAyOjIyOjg4OjAxOjBhXG4gICAgICAgICAgICAgICAgLy9mZjo1NTowNTowMDowMjoyMjpiODowMTowYVxuICAgICAgICAgICAgICAgIC8vZmY6NTU6MDU6MDA6MDI6MjI6NWQ6MDE6MGFcbiAgICAgICAgICAgICAgICAvL2ZmOjU1OjA1OjAwOjAyOjIyOjRhOjAxOjBhXG4gICAgICAgICAgICAgICAgLy9mZjo1NTowNTowMDowMjoyMjoyNjowMTowYVxuICAgICAgICAgICAgICAgIGJ5dGUyID0gMHgwNTtcbiAgICAgICAgICAgICAgICBieXRlNSA9IDB4MjI7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU2ID0gMHgwMDtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTcgPSAweDAwO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTYgPSAweDA2O1xuICAgICAgICAgICAgICAgICAgICBieXRlNyA9IDB4MDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICBieXRlNiA9IDB4ZWU7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU3ID0gMHgwMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU2ID0gMHg4ODtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTcgPSAweDAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTYgPSAweGI4O1xuICAgICAgICAgICAgICAgICAgICBieXRlNyA9IDB4MDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gNSkge1xuICAgICAgICAgICAgICAgICAgICBieXRlNiA9IDB4NWQ7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU3ID0gMHgwMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSA2KSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU2ID0gMHg0YTtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTcgPSAweDAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU2ID0gMHgyNjtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTcgPSAweDAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBieXRlOCA9IDB4MGE7XG4gICAgICAgICAgICAgICAgYnl0ZTEyID0gMHgwMDtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgYnVmVmlld1swXSA9IGJ5dGUxIDw8IDggfCBieXRlMDtcbiAgICAgICAgYnVmVmlld1sxXSA9IGJ5dGUzIDw8IDggfCBieXRlMjtcbiAgICAgICAgYnVmVmlld1syXSA9IGJ5dGU1IDw8IDggfCBieXRlNDtcbiAgICAgICAgYnVmVmlld1szXSA9IGJ5dGU3IDw8IDggfCBieXRlNjtcbiAgICAgICAgYnVmVmlld1s0XSA9IGJ5dGU5IDw8IDggfCBieXRlODtcbiAgICAgICAgYnVmVmlld1s1XSA9IGJ5dGUxMSA8PCA4IHwgYnl0ZTEwO1xuICAgICAgICBidWZWaWV3WzZdID0gYnl0ZTEzIDw8IDggfCBieXRlMTI7XG4gICAgICAgIGJ1ZlZpZXdbN10gPSBieXRlMTUgPDwgOCB8IGJ5dGUxNDtcbiAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICBieXRlMC50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlMS50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlMi50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlMy50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlNC50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlNS50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlNi50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlNy50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlOC50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlOS50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlMTAudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTExLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ5dGUxMi50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlMTMudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTE0LnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ5dGUxNS50b1N0cmluZygxNikgKyBcIjpcIlxuICAgICAgICApO1xuICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgIGJ1ZlZpZXdbMF0udG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnVmVmlld1sxXS50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBidWZWaWV3WzJdLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ1ZlZpZXdbM10udG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnVmVmlld1s0XS50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBidWZWaWV3WzVdLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ1ZlZpZXdbNl0udG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnVmVmlld1s3XS50b1N0cmluZygxNilcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIGJ1ZjtcbiAgICB9XG5cbiAgICBfd3JpdGVDaGFyYWN0ZXJpc3RpYyh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZXZpY2UuZ2F0dC5nZXRQcmltYXJ5U2VydmljZSh0aGlzLmNvbmZpZy5zZXJ2aWNlKCkpXG4gICAgICAgICAgICAudGhlbihzZXJ2aWNlID0+IHNlcnZpY2UuZ2V0Q2hhcmFjdGVyaXN0aWModGhpcy5jb25maWcuY2hhcmF0ZXJpc3RpYygpKSlcbiAgICAgICAgICAgIC50aGVuKGNoYXJhY3RlcmlzdGljID0+IGNoYXJhY3RlcmlzdGljLndyaXRlVmFsdWUodmFsdWUpKTtcbiAgICB9XG5cblxufVxuXG5jb25zdCBERVZJQ0VfTkFNRSA9IFwiTWFrZWJsb2NrX0xFXCIsXG4gICAgU0VSVklDRV9VVUlEID0gXCIwMDAwZmZlMS0wMDAwLTEwMDAtODAwMC0wMDgwNWY5YjM0ZmJcIixcbiAgICBDSEFSQUNURVJJU1RJQ19VVUlEID0gXCIwMDAwZmZlMy0wMDAwLTEwMDAtODAwMC0wMDgwNWY5YjM0ZmJcIjtcblxuXG5cblxuXG5sZXQgbUJvdCA9IG5ldyBNQm90KCk7XG5cbm1vZHVsZS5leHBvcnRzID0gbUJvdDsiXX0=
