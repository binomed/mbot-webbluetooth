(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
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

            document.getElementById("connectBtn").addEventListener('click', _ => {
                mBot.request()
                    .then(_ => {
                        return mBot.connect();
                    })
                    .then(_ => {
                        stepConnect.style.display = "none";
                        stepControl.style.display = "flex";

                        let Joystick = require('./components/joystick.js');
                        new Joystick('joystick', (data) => {
                            mBot.processMotor(data.M1, data.M2);
                        });

                        let partJoystick = document.querySelector('.part-joystick');
                        let partBtn = document.querySelector('.part-button');
                        let switchParts = document.getElementById('switchParts');
                        switchParts.addEventListener('click', function(evt) {
                            if (this.checked) {
                                partBtn.style.display = 'none';
                                partJoystick.style.display = '';
                            } else {
                                partBtn.style.display = '';
                                partJoystick.style.display = 'none';
                            }
                        });

                        let btnUp = document.getElementById('btnUp');
                        let btnDown = document.getElementById('btnDown');
                        let btnLeft = document.getElementById('btnLeft');
                        let btnRight = document.getElementById('btnRight');

                        btnUp.addEventListener('touchstart', _ => { mBot.processMotor(-100, 100) });
                        btnDown.addEventListener('touchstart', _ => { mBot.processMotor(100, -100) });
                        btnLeft.addEventListener('touchstart', _ => { mBot.processMotor(100, 100) });
                        btnRight.addEventListener('touchstart', _ => { mBot.processMotor(-100, -100) });

                        btnUp.addEventListener('touchend', _ => { mBot.processMotor(0, 0) });
                        btnDown.addEventListener('touchend', _ => { mBot.processMotor(0, 0) });
                        btnLeft.addEventListener('touchend', _ => { mBot.processMotor(0, 0) });
                        btnRight.addEventListener('touchend', _ => { mBot.processMotor(0, 0) });


                    })
            });

            let ColorPicker = require('./components/colorpicker.js');
            new ColorPicker((rgb) => {
                mBot.processColor(rgb.red, rgb.blue, rgb.green);
            });


        }

    }



    window.addEventListener('load', pageLoad);

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js').then(function() {
            console.log('Service Worker Register');
        });
    }

})();
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
class Joystick {

    constructor(id, callback) {
        this.joystick = nipplejs.create({
            zone: document.getElementById(id),
            mode: 'static',
            position: {
                left: '50%',
                top: '50%'
            },
            size: 200,
            color: '#3f51b5'
        });
        this.callback = callback;

        this.joystick.on('move', this._move.bind(this));
        this.joystick.on('end', this._end.bind(this));
    }

    _move(evt, data) {
        if(data.direction){
            switch(data.direction){
                case 'up':                        
                break;
                case 'down':
                break;
                case 'left':
                break;
                case 'right':
                break;
                
            }
        }
        /*this.callback({
            x: data.position.x - data.instance.position.x,
            y: data.position.y - data.instance.position.y,
            distance : data.distance,
            angle : data.direction ? data.direction.angle : null
        });*/
        
        console.debug(data);

    }
    
    _end(evt,data){
        callback({
            M1 : 0,
            M2 : 0
        });
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzY3JpcHRzL2FwcC5qcyIsInNjcmlwdHMvY29tcG9uZW50cy9jb2xvcnBpY2tlci5qcyIsInNjcmlwdHMvY29tcG9uZW50cy9qb3lzdGljay5qcyIsInNjcmlwdHMvbWJvdC9tYm90LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24oKSB7XG4gICAgJ3VzZSBzdHJpY3QnXG5cblxuICAgIGZ1bmN0aW9uIHBhZ2VMb2FkKCkge1xuXG4gICAgICAgIGxldCBub0JsdWV0b290aCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibm9CbHVldG9vdGhcIik7XG4gICAgICAgIGxldCBzdGVwQ29ubmVjdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RlcENvbm5lY3RcIik7XG4gICAgICAgIGxldCBzdGVwQ29udHJvbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RlcENvbnRyb2xcIik7XG4gICAgICAgIGlmIChuYXZpZ2F0b3IuYmx1ZXRvb3RoID09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIk5vIG5hdmlnYXRvci5ibHVldG9vdGggZm91bmQuXCIpO1xuICAgICAgICAgICAgc3RlcENvbm5lY3Quc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgbm9CbHVldG9vdGguc3R5bGUuZGlzcGxheSA9IFwiZmxleFwiO1xuXG5cblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RlcENvbm5lY3Quc3R5bGUuZGlzcGxheSA9IFwiZmxleFwiO1xuICAgICAgICAgICAgbm9CbHVldG9vdGguc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgbGV0IG1Cb3QgPSByZXF1aXJlKFwiLi9tYm90L21ib3RcIik7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29ubmVjdEJ0blwiKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIF8gPT4ge1xuICAgICAgICAgICAgICAgIG1Cb3QucmVxdWVzdCgpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKF8gPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1Cb3QuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAudGhlbihfID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXBDb25uZWN0LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXBDb250cm9sLnN0eWxlLmRpc3BsYXkgPSBcImZsZXhcIjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IEpveXN0aWNrID0gcmVxdWlyZSgnLi9jb21wb25lbnRzL2pveXN0aWNrLmpzJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgSm95c3RpY2soJ2pveXN0aWNrJywgKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtQm90LnByb2Nlc3NNb3RvcihkYXRhLk0xLCBkYXRhLk0yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcGFydEpveXN0aWNrID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnBhcnQtam95c3RpY2snKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwYXJ0QnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnBhcnQtYnV0dG9uJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc3dpdGNoUGFydHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3dpdGNoUGFydHMnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaFBhcnRzLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY2hlY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJ0QnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnRKb3lzdGljay5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnRKb3lzdGljay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYnRuVXAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuVXAnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBidG5Eb3duID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bkRvd24nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBidG5MZWZ0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bkxlZnQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBidG5SaWdodCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG5SaWdodCcpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBidG5VcC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgXyA9PiB7IG1Cb3QucHJvY2Vzc01vdG9yKC0xMDAsIDEwMCkgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBidG5Eb3duLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBfID0+IHsgbUJvdC5wcm9jZXNzTW90b3IoMTAwLCAtMTAwKSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ0bkxlZnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIF8gPT4geyBtQm90LnByb2Nlc3NNb3RvcigxMDAsIDEwMCkgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBidG5SaWdodC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgXyA9PiB7IG1Cb3QucHJvY2Vzc01vdG9yKC0xMDAsIC0xMDApIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBidG5VcC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIF8gPT4geyBtQm90LnByb2Nlc3NNb3RvcigwLCAwKSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ0bkRvd24uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBfID0+IHsgbUJvdC5wcm9jZXNzTW90b3IoMCwgMCkgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBidG5MZWZ0LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgXyA9PiB7IG1Cb3QucHJvY2Vzc01vdG9yKDAsIDApIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnRuUmlnaHQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBfID0+IHsgbUJvdC5wcm9jZXNzTW90b3IoMCwgMCkgfSk7XG5cblxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGxldCBDb2xvclBpY2tlciA9IHJlcXVpcmUoJy4vY29tcG9uZW50cy9jb2xvcnBpY2tlci5qcycpO1xuICAgICAgICAgICAgbmV3IENvbG9yUGlja2VyKChyZ2IpID0+IHtcbiAgICAgICAgICAgICAgICBtQm90LnByb2Nlc3NDb2xvcihyZ2IucmVkLCByZ2IuYmx1ZSwgcmdiLmdyZWVuKTtcbiAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG5cblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgcGFnZUxvYWQpO1xuXG4gICAgaWYgKCdzZXJ2aWNlV29ya2VyJyBpbiBuYXZpZ2F0b3IpIHtcbiAgICAgICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXIoJy4vc2VydmljZS13b3JrZXIuanMnKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1NlcnZpY2UgV29ya2VyIFJlZ2lzdGVyJyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxufSkoKTsiLCJcbmNsYXNzIENvbG9yUGlja2VyIHtcbiAgICBjb25zdHJ1Y3RvcihjYWxsYmFjaykge1xuICAgICAgICB0aGlzLmltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgICB0aGlzLmltZy5zcmMgPSAnLi9hc3NldHMvaW1hZ2VzL2NvbG9yLXdoZWVsLnBuZyc7XG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdjYW52YXMnKTtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgdGhpcy5pbWcub25sb2FkID0gdGhpcy5fbG9hZC5iaW5kKHRoaXMpO1xuICAgIH1cblxuXG4gICAgX2xvYWQoKSB7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IDE1MCAqIGRldmljZVBpeGVsUmF0aW87XG4gICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IDE1MCAqIGRldmljZVBpeGVsUmF0aW87XG4gICAgICAgIHRoaXMuY2FudmFzLnN0eWxlLndpZHRoID0gXCIxNTBweFwiO1xuICAgICAgICB0aGlzLmNhbnZhcy5zdHlsZS5oZWlnaHQgPSBcIjE1MHB4XCI7XG4gICAgICAgIHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5fY2FsY3VsYXRlUmdiLmJpbmQodGhpcykpO1xuXG4gICAgICAgIHRoaXMuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5pbWcsIDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xuICAgIH1cblxuXG4gICAgX2NhbGN1bGF0ZVJnYihldnQpIHtcbiAgICAgICAgLy8gUmVmcmVzaCBjYW52YXMgaW4gY2FzZSB1c2VyIHpvb21zIGFuZCBkZXZpY2VQaXhlbFJhdGlvIGNoYW5nZXMuXG4gICAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gMTUwICogZGV2aWNlUGl4ZWxSYXRpbztcbiAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gMTUwICogZGV2aWNlUGl4ZWxSYXRpbztcbiAgICAgICAgdGhpcy5jb250ZXh0LmRyYXdJbWFnZSh0aGlzLmltZywgMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG5cbiAgICAgICAgbGV0IHJlY3QgPSB0aGlzLmNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgbGV0IHggPSBNYXRoLnJvdW5kKChldnQuY2xpZW50WCAtIHJlY3QubGVmdCkgKiBkZXZpY2VQaXhlbFJhdGlvKTtcbiAgICAgICAgbGV0IHkgPSBNYXRoLnJvdW5kKChldnQuY2xpZW50WSAtIHJlY3QudG9wKSAqIGRldmljZVBpeGVsUmF0aW8pO1xuICAgICAgICBsZXQgZGF0YSA9IHRoaXMuY29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCkuZGF0YTtcblxuICAgICAgICBsZXQgciA9IGRhdGFbKCh0aGlzLmNhbnZhcy53aWR0aCAqIHkpICsgeCkgKiA0XTtcbiAgICAgICAgbGV0IGcgPSBkYXRhWygodGhpcy5jYW52YXMud2lkdGggKiB5KSArIHgpICogNCArIDFdO1xuICAgICAgICBsZXQgYiA9IGRhdGFbKCh0aGlzLmNhbnZhcy53aWR0aCAqIHkpICsgeCkgKiA0ICsgMl07XG5cbiAgICAgICAgdGhpcy5jYWxsYmFjayh7XG4gICAgICAgICAgICByZWQ6IHIsXG4gICAgICAgICAgICBibHVlOiBiLFxuICAgICAgICAgICAgZ3JlZW46IGdcbiAgICAgICAgfSk7XG5cblxuICAgICAgICB0aGlzLmNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuY29udGV4dC5hcmMoeCwgeSArIDIsIDEwICogZGV2aWNlUGl4ZWxSYXRpbywgMCwgMiAqIE1hdGguUEksIGZhbHNlKTtcbiAgICAgICAgdGhpcy5jb250ZXh0LnNoYWRvd0NvbG9yID0gJyMzMzMnO1xuICAgICAgICB0aGlzLmNvbnRleHQuc2hhZG93Qmx1ciA9IDQgKiBkZXZpY2VQaXhlbFJhdGlvO1xuICAgICAgICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gJ3doaXRlJztcbiAgICAgICAgdGhpcy5jb250ZXh0LmZpbGwoKTtcbiAgICB9XG5cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbG9yUGlja2VyOyIsImNsYXNzIEpveXN0aWNrIHtcblxuICAgIGNvbnN0cnVjdG9yKGlkLCBjYWxsYmFjaykge1xuICAgICAgICB0aGlzLmpveXN0aWNrID0gbmlwcGxlanMuY3JlYXRlKHtcbiAgICAgICAgICAgIHpvbmU6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKSxcbiAgICAgICAgICAgIG1vZGU6ICdzdGF0aWMnLFxuICAgICAgICAgICAgcG9zaXRpb246IHtcbiAgICAgICAgICAgICAgICBsZWZ0OiAnNTAlJyxcbiAgICAgICAgICAgICAgICB0b3A6ICc1MCUnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2l6ZTogMjAwLFxuICAgICAgICAgICAgY29sb3I6ICcjM2Y1MWI1J1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuXG4gICAgICAgIHRoaXMuam95c3RpY2sub24oJ21vdmUnLCB0aGlzLl9tb3ZlLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmpveXN0aWNrLm9uKCdlbmQnLCB0aGlzLl9lbmQuYmluZCh0aGlzKSk7XG4gICAgfVxuXG4gICAgX21vdmUoZXZ0LCBkYXRhKSB7XG4gICAgICAgIGlmKGRhdGEuZGlyZWN0aW9uKXtcbiAgICAgICAgICAgIHN3aXRjaChkYXRhLmRpcmVjdGlvbil7XG4gICAgICAgICAgICAgICAgY2FzZSAndXAnOiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2Rvd24nOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvKnRoaXMuY2FsbGJhY2soe1xuICAgICAgICAgICAgeDogZGF0YS5wb3NpdGlvbi54IC0gZGF0YS5pbnN0YW5jZS5wb3NpdGlvbi54LFxuICAgICAgICAgICAgeTogZGF0YS5wb3NpdGlvbi55IC0gZGF0YS5pbnN0YW5jZS5wb3NpdGlvbi55LFxuICAgICAgICAgICAgZGlzdGFuY2UgOiBkYXRhLmRpc3RhbmNlLFxuICAgICAgICAgICAgYW5nbGUgOiBkYXRhLmRpcmVjdGlvbiA/IGRhdGEuZGlyZWN0aW9uLmFuZ2xlIDogbnVsbFxuICAgICAgICB9KTsqL1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhkYXRhKTtcblxuICAgIH1cbiAgICBcbiAgICBfZW5kKGV2dCxkYXRhKXtcbiAgICAgICAgY2FsbGJhY2soe1xuICAgICAgICAgICAgTTEgOiAwLFxuICAgICAgICAgICAgTTIgOiAwXG4gICAgICAgIH0pO1xuICAgIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEpveXN0aWNrOyIsIid1c2Ugc3RyaWN0J1xuXG5jbGFzcyBDb25maWcge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgfVxuXG4gICAgbmFtZSgpIHsgcmV0dXJuIFwiTWFrZWJsb2NrX0xFXCI7IH1cbiAgICBzZXJ2aWNlKCkgeyByZXR1cm4gXCIwMDAwZmZlMS0wMDAwLTEwMDAtODAwMC0wMDgwNWY5YjM0ZmJcIiB9XG4gICAgY2hhcmF0ZXJpc3RpYygpIHsgcmV0dXJuIFwiMDAwMGZmZTMtMDAwMC0xMDAwLTgwMDAtMDA4MDVmOWIzNGZiXCIgfVxufVxuXG5cbmNvbnN0IFRZUEVfTU9UT1IgPSAweDBhLFxuICAgIFRZUEVfUkdCID0gMHgwOCxcbiAgICBUWVBFX1NPVU5EID0gMHgwNztcblxuXG5jb25zdCBQT1JUXzEgPSAweDAxLFxuICAgIFBPUlRfMiA9IDB4MDIsXG4gICAgUE9SVF8zID0gMHgwMyxcbiAgICBQT1JUXzQgPSAweDA0LFxuICAgIFBPUlRfNSA9IDB4MDUsXG4gICAgUE9SVF82ID0gMHgwNixcbiAgICBQT1JUXzcgPSAweDA3LFxuICAgIFBPUlRfOCA9IDB4MDgsXG4gICAgTV8xID0gMHgwOSxcbiAgICBNXzIgPSAweDBhO1xuICAgIFxuXG5jbGFzcyBNQm90IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5kZXZpY2UgPSBudWxsO1xuICAgICAgICB0aGlzLmNvbmZpZyA9IG5ldyBDb25maWcoKTtcbiAgICAgICAgdGhpcy5vbkRpc2Nvbm5lY3RlZCA9IHRoaXMub25EaXNjb25uZWN0ZWQuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICByZXF1ZXN0KCkge1xuICAgICAgICBsZXQgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIFwiZmlsdGVyc1wiOiBbe1xuICAgICAgICAgICAgICAgIFwibmFtZVwiOiB0aGlzLmNvbmZpZy5uYW1lKClcbiAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgXCJvcHRpb25hbFNlcnZpY2VzXCI6IFt0aGlzLmNvbmZpZy5zZXJ2aWNlKCldXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBuYXZpZ2F0b3IuYmx1ZXRvb3RoLnJlcXVlc3REZXZpY2Uob3B0aW9ucylcbiAgICAgICAgICAgIC50aGVuKGRldmljZSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5kZXZpY2UgPSBkZXZpY2U7XG4gICAgICAgICAgICAgICAgdGhpcy5kZXZpY2UuYWRkRXZlbnRMaXN0ZW5lcignZ2F0dHNlcnZlcmRpc2Nvbm5lY3RlZCcsIHRoaXMub25EaXNjb25uZWN0ZWQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBkZXZpY2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25uZWN0KCkge1xuICAgICAgICBpZiAoIXRoaXMuZGV2aWNlKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ0RldmljZSBpcyBub3QgY29ubmVjdGVkLicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGV2aWNlLmdhdHQuY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvY2Vzc01vdG9yKHZhbHVlTTEsIHZhbHVlTTIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3dyaXRlQ2hhcmFjdGVyaXN0aWModGhpcy5fZ2VuZXJpY0NvbnRyb2woVFlQRV9NT1RPUiwgTV8xLCAwLCB2YWx1ZU0xKSlcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fd3JpdGVDaGFyYWN0ZXJpc3RpYyh0aGlzLl9nZW5lcmljQ29udHJvbChUWVBFX01PVE9SLCBNXzIsIDAsIHZhbHVlTTIpKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHJvY2Vzc0J1enplcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3dyaXRlQ2hhcmFjdGVyaXN0aWModGhpcy5fZ2VuZXJpY0NvbnRyb2woVFlQRV9TT1VORCwgMCwgMCwgMCkpXG4gICAgICAgICAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIHByb2Nlc3NDb2xvcihyZWQsYmx1ZSxncmVlbil7XG4gICAgICAgIGxldCBySGV4ID0gcmVkPDw4O1xuXHRcdGxldCBnSGV4ID0gZ3JlZW48PDE2O1xuXHRcdGxldCBiSGV4ID0gYmx1ZTw8MjQ7XG5cdFx0bGV0IHZhbHVlID0gckhleCB8IGdIZXggfCBiSGV4O1xuXHRcdHRoaXMuX3dyaXRlQ2hhcmFjdGVyaXN0aWModGhpcy5fZ2VuZXJpY0NvbnRyb2woVFlQRV9SR0IsUE9SVF82LDAsdmFsdWUpKTtcbiAgICAgICAgXG4gICAgfVxuXG4gICAgZGlzY29ubmVjdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmRldmljZSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCdEZXZpY2UgaXMgbm90IGNvbm5lY3RlZC4nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRldmljZS5nYXR0LmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uRGlzY29ubmVjdGVkKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnRGV2aWNlIGlzIGRpc2Nvbm5lY3RlZC4nKTtcbiAgICB9XG5cblxuICAgIF9nZW5lcmljQ29udHJvbCh0eXBlLCBwb3J0LCBzbG90LCB2YWx1ZSkge1xuICAgICAgICAvKlxuICAgICAgICBmZiA1NSBsZW4gaWR4IGFjdGlvbiBkZXZpY2UgcG9ydCAgc2xvdCAgZGF0YSBhXG4gICAgICAgIDAgIDEgIDIgICAzICAgNCAgICAgIDUgICAgICA2ICAgICA3ICAgICA4XG4gICAgICAgICovXG4gICAgICAgIC8vdW5zaWduZWQgY2hhciBhWzExXT17MHhmZiwweDU1LFdSSVRFTU9EVUxFLDcsMCwwLDAsMCwwLDAsJ1xcbid9O1xuICAgICAgICAvL2FbNF0gPSBbdHlwZSBpbnRWYWx1ZV07XG4gICAgICAgIC8vYVs1XSA9IChwb3J0PDw0ICYgMHhmMCl8KHNsb3QgJiAweGYpO1xuICAgICAgICAvLyBTdGF0aWMgdmFsdWVzXG4gICAgICAgIHZhciBidWYgPSBuZXcgQXJyYXlCdWZmZXIoMTYpO1xuICAgICAgICB2YXIgYnVmVmlldyA9IG5ldyBVaW50MTZBcnJheShidWYpO1xuXG4gICAgICAgIHZhciBieXRlMCA9IDB4ZmYsIC8vIFN0YXRpYyBoZWFkZXJcbiAgICAgICAgICAgIGJ5dGUxID0gMHg1NSwgLy8gU3RhdGljIGhlYWRlclxuICAgICAgICAgICAgYnl0ZTIgPSAweDA5LCAvLyBsZW5cbiAgICAgICAgICAgIGJ5dGUzID0gMHgwMCwgLy8gaWR4XG4gICAgICAgICAgICBieXRlNCA9IDB4MDIsIC8vIGFjdGlvblxuICAgICAgICAgICAgYnl0ZTUgPSB0eXBlLCAvLyBkZXZpY2VcbiAgICAgICAgICAgIGJ5dGU2ID0gcG9ydCwgLy8gcG9ydFxuICAgICAgICAgICAgYnl0ZTcgPSBzbG90OyAvLyBzbG90XG4gICAgICAgIC8vZHluYW1pY3MgdmFsdWVzXG4gICAgICAgIHZhciBieXRlOCA9IDB4MDAsIC8vIGRhdGFcbiAgICAgICAgICAgIGJ5dGU5ID0gMHgwMCwgLy8gZGF0YVxuICAgICAgICAgICAgYnl0ZTEwID0gMHgwMCwgLy8gZGF0YVxuICAgICAgICAgICAgYnl0ZTExID0gMHgwMDsgLy8gZGF0YVxuICAgICAgICAvL0VuZCBvZiBtZXNzYWdlXG4gICAgICAgIHZhciBieXRlMTIgPSAweDBhLFxuICAgICAgICAgICAgYnl0ZTEzID0gMHgwMCxcbiAgICAgICAgICAgIGJ5dGUxNCA9IDB4MDAsXG4gICAgICAgICAgICBieXRlMTUgPSAweDAwO1xuXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSBUWVBFX01PVE9SOlxuICAgICAgICAgICAgICAgIC8vIE1vdG9yIE0xXG4gICAgICAgICAgICAgICAgLy8gZmY6NTUgIDA5OjAwICAwMjowYSAgMDk6NjQgIDAwOjAwICAwMDowMCAgMGFcIlxuICAgICAgICAgICAgICAgIC8vIDB4NTVmZjsweDAwMDk7MHgwYTAyOzB4MDk2NDsweDAwMDA7MHgwMDAwOzB4MDAwYTsweDAwMDA7XG4gICAgICAgICAgICAgICAgLy9cImZmOjU1OjA5OjAwOjAyOjBhOjA5OjAwOjAwOjAwOjAwOjAwOjBhXCJcbiAgICAgICAgICAgICAgICAvLyBmZjo1NTowOTowMDowMjowYTowOTo5YzpmZjowMDowMDowMDowYVxuICAgICAgICAgICAgICAgIC8vIE1vdG9yIE0yXG4gICAgICAgICAgICAgICAgLy8gZmY6NTU6MDk6MDA6MDI6MGE6MGE6NjQ6MDA6MDA6MDA6MDA6MGFcbiAgICAgICAgICAgICAgICAvLyBmZjo1NTowOTowMDowMjowYTowYTowMDowMDowMDowMDowMDowYVxuICAgICAgICAgICAgICAgIC8vIGZmOjU1OjA5OjAwOjAyOjBhOjBhOjljOmZmOjAwOjAwOjAwOjBhXG4gICAgICAgICAgICAgICAgdmFyIHRlbXBWYWx1ZSA9IHZhbHVlIDwgMCA/IChwYXJzZUludChcImZmZmZcIiwgMTYpICsgTWF0aC5tYXgoLTI1NSwgdmFsdWUpKSA6IE1hdGgubWluKDI1NSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIGJ5dGU3ID0gdGVtcFZhbHVlICYgMHgwMGZmO1xuICAgICAgICAgICAgICAgIGJ5dGU4ID0gMHgwMDtcbiAgICAgICAgICAgICAgICBieXRlOCA9IHRlbXBWYWx1ZSA+PiA4O1xuXG4gICAgICAgICAgICAgICAgLypieXRlNSA9IDB4MGE7XG4gICAgICAgICAgICAgICAgYnl0ZTYgPSAweDA5O1xuICAgICAgICAgICAgICAgIGJ5dGU3ID0gMHg2NDtcbiAgICAgICAgICAgICAgICBieXRlOCA9IDB4MDA7Ki9cblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBUWVBFX1JHQjpcbiAgICAgICAgICAgICAgICAvLyBmZjo1NSAgMDk6MDAgIDAyOjA4ICAwNjowMCAgNWM6OTkgIDZkOjAwICAwYVxuICAgICAgICAgICAgICAgIC8vIDB4NTVmZjsweDAwMDk7MHgwODAyOzB4MDAwNjsweDk5NWM7MHgwMDZkOzB4MDAwYTsweDAwMDA7XG4gICAgICAgICAgICAgICAgYnl0ZTcgPSAweDAwO1xuICAgICAgICAgICAgICAgIGJ5dGU4ID0gdmFsdWUgPj4gOCAmIDB4ZmY7XG4gICAgICAgICAgICAgICAgYnl0ZTkgPSB2YWx1ZSA+PiAxNiAmIDB4ZmY7XG4gICAgICAgICAgICAgICAgYnl0ZTEwID0gdmFsdWUgPj4gMjQgJiAweGZmO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBUWVBFX1NPVU5EOlxuICAgICAgICAgICAgICAgIC8vZmY6NTU6MDU6MDA6MDI6MjI6MDA6MDA6MGFcbiAgICAgICAgICAgICAgICAvL2ZmOjU1OjA1OjAwOjAyOjIyOjA2OjAxOjBhXG4gICAgICAgICAgICAgICAgLy9mZjo1NTowNTowMDowMjoyMjplZTowMTowYVxuICAgICAgICAgICAgICAgIC8vZmY6NTU6MDU6MDA6MDI6MjI6ODg6MDE6MGFcbiAgICAgICAgICAgICAgICAvL2ZmOjU1OjA1OjAwOjAyOjIyOmI4OjAxOjBhXG4gICAgICAgICAgICAgICAgLy9mZjo1NTowNTowMDowMjoyMjo1ZDowMTowYVxuICAgICAgICAgICAgICAgIC8vZmY6NTU6MDU6MDA6MDI6MjI6NGE6MDE6MGFcbiAgICAgICAgICAgICAgICAvL2ZmOjU1OjA1OjAwOjAyOjIyOjI2OjAxOjBhXG4gICAgICAgICAgICAgICAgYnl0ZTIgPSAweDA1O1xuICAgICAgICAgICAgICAgIGJ5dGU1ID0gMHgyMjtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTYgPSAweDAwO1xuICAgICAgICAgICAgICAgICAgICBieXRlNyA9IDB4MDA7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBieXRlNiA9IDB4MDY7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU3ID0gMHgwMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU2ID0gMHhlZTtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTcgPSAweDAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTYgPSAweDg4O1xuICAgICAgICAgICAgICAgICAgICBieXRlNyA9IDB4MDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgICAgICBieXRlNiA9IDB4Yjg7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU3ID0gMHgwMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSA1KSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU2ID0gMHg1ZDtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTcgPSAweDAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IDYpIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTYgPSAweDRhO1xuICAgICAgICAgICAgICAgICAgICBieXRlNyA9IDB4MDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTYgPSAweDI2O1xuICAgICAgICAgICAgICAgICAgICBieXRlNyA9IDB4MDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJ5dGU4ID0gMHgwYTtcbiAgICAgICAgICAgICAgICBieXRlMTIgPSAweDAwO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBidWZWaWV3WzBdID0gYnl0ZTEgPDwgOCB8IGJ5dGUwO1xuICAgICAgICBidWZWaWV3WzFdID0gYnl0ZTMgPDwgOCB8IGJ5dGUyO1xuICAgICAgICBidWZWaWV3WzJdID0gYnl0ZTUgPDwgOCB8IGJ5dGU0O1xuICAgICAgICBidWZWaWV3WzNdID0gYnl0ZTcgPDwgOCB8IGJ5dGU2O1xuICAgICAgICBidWZWaWV3WzRdID0gYnl0ZTkgPDwgOCB8IGJ5dGU4O1xuICAgICAgICBidWZWaWV3WzVdID0gYnl0ZTExIDw8IDggfCBieXRlMTA7XG4gICAgICAgIGJ1ZlZpZXdbNl0gPSBieXRlMTMgPDwgOCB8IGJ5dGUxMjtcbiAgICAgICAgYnVmVmlld1s3XSA9IGJ5dGUxNSA8PCA4IHwgYnl0ZTE0O1xuICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgIGJ5dGUwLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ5dGUxLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ5dGUyLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ5dGUzLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ5dGU0LnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ5dGU1LnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ5dGU2LnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ5dGU3LnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ5dGU4LnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ5dGU5LnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ5dGUxMC50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlMTEudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTEyLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ5dGUxMy50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlMTQudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTE1LnRvU3RyaW5nKDE2KSArIFwiOlwiXG4gICAgICAgICk7XG4gICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgYnVmVmlld1swXS50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBidWZWaWV3WzFdLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ1ZlZpZXdbMl0udG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnVmVmlld1szXS50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBidWZWaWV3WzRdLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ1ZlZpZXdbNV0udG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnVmVmlld1s2XS50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBidWZWaWV3WzddLnRvU3RyaW5nKDE2KVxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gYnVmO1xuICAgIH1cblxuICAgIF93cml0ZUNoYXJhY3RlcmlzdGljKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRldmljZS5nYXR0LmdldFByaW1hcnlTZXJ2aWNlKHRoaXMuY29uZmlnLnNlcnZpY2UoKSlcbiAgICAgICAgICAgIC50aGVuKHNlcnZpY2UgPT4gc2VydmljZS5nZXRDaGFyYWN0ZXJpc3RpYyh0aGlzLmNvbmZpZy5jaGFyYXRlcmlzdGljKCkpKVxuICAgICAgICAgICAgLnRoZW4oY2hhcmFjdGVyaXN0aWMgPT4gY2hhcmFjdGVyaXN0aWMud3JpdGVWYWx1ZSh2YWx1ZSkpO1xuICAgIH1cblxuXG59XG5cbmNvbnN0IERFVklDRV9OQU1FID0gXCJNYWtlYmxvY2tfTEVcIixcbiAgICBTRVJWSUNFX1VVSUQgPSBcIjAwMDBmZmUxLTAwMDAtMTAwMC04MDAwLTAwODA1ZjliMzRmYlwiLFxuICAgIENIQVJBQ1RFUklTVElDX1VVSUQgPSBcIjAwMDBmZmUzLTAwMDAtMTAwMC04MDAwLTAwODA1ZjliMzRmYlwiO1xuXG5cblxuXG5cbmxldCBtQm90ID0gbmV3IE1Cb3QoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBtQm90OyJdfQ==
