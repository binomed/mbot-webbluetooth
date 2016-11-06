(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
    'use strict'

    function pageLoad() {

        // Check the current part of Mbot
        let noBluetooth = document.getElementById("noBluetooth");
        let stepConnect = document.getElementById("stepConnect");
        let stepControl = document.getElementById("stepControl");
        // Check if the bluetooth is available
        if (navigator.bluetooth == undefined) {
            console.error("No navigator.bluetooth found.");
            stepConnect.style.display = "none";
            noBluetooth.style.display = "flex";
        } else {
            // Display the connect button
            stepConnect.style.display = "flex";
            noBluetooth.style.display = "none";
            let mBot = require("./mbot/mbot");

            // Check the connection
            document.getElementById("connectBtn").addEventListener('click', _ => {
                // Request the device
                mBot.request()
                    .then(_ => {
                        // Connect to the mbot
                        return mBot.connect();
                    })
                    .then(_ => {
                        // Connection is done, we show the controls
                        stepConnect.style.display = "none";
                        stepControl.style.display = "flex";

                        let partBtn = document.querySelector('.part-button');
                        
                        // Control the robot by buttons
                        let btnUp = document.getElementById('btnUp');
                        let btnDown = document.getElementById('btnDown');
                        let btnLeft = document.getElementById('btnLeft');
                        let btnRight = document.getElementById('btnRight');

                        btnUp.addEventListener('touchstart', _ => { mBot.processMotor(-250, 250) });
                        btnDown.addEventListener('touchstart', _ => { mBot.processMotor(250, -250) });
                        btnLeft.addEventListener('touchstart', _ => { mBot.processMotor(250, 250) });
                        btnRight.addEventListener('touchstart', _ => { mBot.processMotor(-250, -250) });

                        btnUp.addEventListener('touchend', _ => { mBot.processMotor(0, 0) });
                        btnDown.addEventListener('touchend', _ => { mBot.processMotor(0, 0) });
                        btnLeft.addEventListener('touchend', _ => { mBot.processMotor(0, 0) });
                        btnRight.addEventListener('touchend', _ => { mBot.processMotor(0, 0) });
                        
                        // Buzz the robot
                        let btnBuzz = document.getElementById('btnBuzz');
                        btnBuzz.addEventListener('click', _=>{ mBot.processBuzzer()});

                        // Color the robot
                        let ColorPicker = require('./components/colorpicker.js');
                        new ColorPicker((rgb) => {
                            mBot.processColor(rgb.red, rgb.blue, rgb.green);
                        });
                    })
            });



        }

    }



    window.addEventListener('load', pageLoad);

    if ('serviceWorker' in navigator) {        
        navigator.serviceWorker.register('./service-worker.js', {scope : location.pathname}).then(function(reg) {
            console.log('Service Worker Register for scope : %s',reg.scope);
        });
    }

})();
},{"./components/colorpicker.js":2,"./mbot/mbot":3}],2:[function(require,module,exports){

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
'use strict'

/**
 * General configuration (UUID)
*/
class Config {

    constructor() {
    }

    name() { return "Makeblock_LE"; }
    service() { return "0000ffe1-0000-1000-8000-00805f9b34fb" }
    charateristic() { return "0000ffe3-0000-1000-8000-00805f9b34fb" }
}

// Const for instructions types
const TYPE_MOTOR = 0x0a,
    TYPE_RGB = 0x08,
    TYPE_SOUND = 0x07;


// Const for the ports
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
    

/**
 * Class for the robot
 * */
class MBot {
    constructor() {
        this.device = null;
        this.config = new Config();
        this.onDisconnected = this.onDisconnected.bind(this);
        this.buzzerIndex = 0;
    }

    /*
    Request the device with bluetooth
    */
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

    /**
     * Connect to the device
     * */
    connect() {
        if (!this.device) {
            return Promise.reject('Device is not connected.');
        } else {
            return this.device.gatt.connect();
        }
    }

    /**
     * Control the motors of robot
    */
    processMotor(valueM1, valueM2) {
        return this._writeCharacteristic(this._genericControl(TYPE_MOTOR, M_1, 0, valueM1))
            .then(() => {
                return this._writeCharacteristic(this._genericControl(TYPE_MOTOR, M_2, 0, valueM2));
            }).catch(error => {
                console.error(error);
            });

    }

    processBuzzer() {
        this.buzzerIndex = (this.buzzerIndex + 1) % 8;
        return this._writeCharacteristic(this._genericControl(TYPE_SOUND, PORT_2, 22, this.buzzerIndex))
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
                // Motor M2
                // ff:55:09:00:02:0a:0a:64:00:00:00:00:0a                
                var tempValue = value < 0 ? (parseInt("ffff", 16) + Math.max(-255, value)) : Math.min(255, value);
                byte7 = tempValue & 0x00ff;
                byte8 = 0x00;
                byte8 = tempValue >> 8;
                

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzY3JpcHRzL2FwcC5qcyIsInNjcmlwdHMvY29tcG9uZW50cy9jb2xvcnBpY2tlci5qcyIsInNjcmlwdHMvbWJvdC9tYm90LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCdcblxuICAgIGZ1bmN0aW9uIHBhZ2VMb2FkKCkge1xuXG4gICAgICAgIC8vIENoZWNrIHRoZSBjdXJyZW50IHBhcnQgb2YgTWJvdFxuICAgICAgICBsZXQgbm9CbHVldG9vdGggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5vQmx1ZXRvb3RoXCIpO1xuICAgICAgICBsZXQgc3RlcENvbm5lY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInN0ZXBDb25uZWN0XCIpO1xuICAgICAgICBsZXQgc3RlcENvbnRyb2wgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInN0ZXBDb250cm9sXCIpO1xuICAgICAgICAvLyBDaGVjayBpZiB0aGUgYmx1ZXRvb3RoIGlzIGF2YWlsYWJsZVxuICAgICAgICBpZiAobmF2aWdhdG9yLmJsdWV0b290aCA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJObyBuYXZpZ2F0b3IuYmx1ZXRvb3RoIGZvdW5kLlwiKTtcbiAgICAgICAgICAgIHN0ZXBDb25uZWN0LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgIG5vQmx1ZXRvb3RoLnN0eWxlLmRpc3BsYXkgPSBcImZsZXhcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIERpc3BsYXkgdGhlIGNvbm5lY3QgYnV0dG9uXG4gICAgICAgICAgICBzdGVwQ29ubmVjdC5zdHlsZS5kaXNwbGF5ID0gXCJmbGV4XCI7XG4gICAgICAgICAgICBub0JsdWV0b290aC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICBsZXQgbUJvdCA9IHJlcXVpcmUoXCIuL21ib3QvbWJvdFwiKTtcblxuICAgICAgICAgICAgLy8gQ2hlY2sgdGhlIGNvbm5lY3Rpb25cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29ubmVjdEJ0blwiKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIF8gPT4ge1xuICAgICAgICAgICAgICAgIC8vIFJlcXVlc3QgdGhlIGRldmljZVxuICAgICAgICAgICAgICAgIG1Cb3QucmVxdWVzdCgpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKF8gPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29ubmVjdCB0byB0aGUgbWJvdFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1Cb3QuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAudGhlbihfID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENvbm5lY3Rpb24gaXMgZG9uZSwgd2Ugc2hvdyB0aGUgY29udHJvbHNcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXBDb25uZWN0LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXBDb250cm9sLnN0eWxlLmRpc3BsYXkgPSBcImZsZXhcIjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHBhcnRCdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucGFydC1idXR0b24nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29udHJvbCB0aGUgcm9ib3QgYnkgYnV0dG9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGJ0blVwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0blVwJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYnRuRG93biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG5Eb3duJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYnRuTGVmdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG5MZWZ0Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYnRuUmlnaHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuUmlnaHQnKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgYnRuVXAuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIF8gPT4geyBtQm90LnByb2Nlc3NNb3RvcigtMjUwLCAyNTApIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnRuRG93bi5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgXyA9PiB7IG1Cb3QucHJvY2Vzc01vdG9yKDI1MCwgLTI1MCkgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBidG5MZWZ0LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBfID0+IHsgbUJvdC5wcm9jZXNzTW90b3IoMjUwLCAyNTApIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnRuUmlnaHQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIF8gPT4geyBtQm90LnByb2Nlc3NNb3RvcigtMjUwLCAtMjUwKSB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgYnRuVXAuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBfID0+IHsgbUJvdC5wcm9jZXNzTW90b3IoMCwgMCkgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBidG5Eb3duLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgXyA9PiB7IG1Cb3QucHJvY2Vzc01vdG9yKDAsIDApIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnRuTGVmdC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIF8gPT4geyBtQm90LnByb2Nlc3NNb3RvcigwLCAwKSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ0blJpZ2h0LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgXyA9PiB7IG1Cb3QucHJvY2Vzc01vdG9yKDAsIDApIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBCdXp6IHRoZSByb2JvdFxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGJ0bkJ1enogPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuQnV6eicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnRuQnV6ei5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIF89PnsgbUJvdC5wcm9jZXNzQnV6emVyKCl9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29sb3IgdGhlIHJvYm90XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgQ29sb3JQaWNrZXIgPSByZXF1aXJlKCcuL2NvbXBvbmVudHMvY29sb3JwaWNrZXIuanMnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBDb2xvclBpY2tlcigocmdiKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbUJvdC5wcm9jZXNzQ29sb3IocmdiLnJlZCwgcmdiLmJsdWUsIHJnYi5ncmVlbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pO1xuXG5cblxuICAgICAgICB9XG5cbiAgICB9XG5cblxuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBwYWdlTG9hZCk7XG5cbiAgICBpZiAoJ3NlcnZpY2VXb3JrZXInIGluIG5hdmlnYXRvcikgeyAgICAgICAgXG4gICAgICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCcuL3NlcnZpY2Utd29ya2VyLmpzJywge3Njb3BlIDogbG9jYXRpb24ucGF0aG5hbWV9KS50aGVuKGZ1bmN0aW9uKHJlZykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1NlcnZpY2UgV29ya2VyIFJlZ2lzdGVyIGZvciBzY29wZSA6ICVzJyxyZWcuc2NvcGUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbn0pKCk7IiwiXG5jbGFzcyBDb2xvclBpY2tlciB7XG4gICAgY29uc3RydWN0b3IoY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5pbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgdGhpcy5pbWcuc3JjID0gJy4vYXNzZXRzL2ltYWdlcy9jb2xvci13aGVlbC5wbmcnO1xuICAgICAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignY2FudmFzJyk7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIHRoaXMuaW1nLm9ubG9hZCA9IHRoaXMuX2xvYWQuYmluZCh0aGlzKTtcbiAgICB9XG5cblxuICAgIF9sb2FkKCkge1xuICAgICAgICBcbiAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSAxNTAgKiBkZXZpY2VQaXhlbFJhdGlvO1xuICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSAxNTAgKiBkZXZpY2VQaXhlbFJhdGlvO1xuICAgICAgICB0aGlzLmNhbnZhcy5zdHlsZS53aWR0aCA9IFwiMTUwcHhcIjtcbiAgICAgICAgdGhpcy5jYW52YXMuc3R5bGUuaGVpZ2h0ID0gXCIxNTBweFwiO1xuICAgICAgICB0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX2NhbGN1bGF0ZVJnYi5iaW5kKHRoaXMpKTtcblxuICAgICAgICB0aGlzLmNvbnRleHQuZHJhd0ltYWdlKHRoaXMuaW1nLCAwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcbiAgICB9XG5cblxuICAgIF9jYWxjdWxhdGVSZ2IoZXZ0KSB7XG4gICAgICAgIC8vIFJlZnJlc2ggY2FudmFzIGluIGNhc2UgdXNlciB6b29tcyBhbmQgZGV2aWNlUGl4ZWxSYXRpbyBjaGFuZ2VzLlxuICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IDE1MCAqIGRldmljZVBpeGVsUmF0aW87XG4gICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IDE1MCAqIGRldmljZVBpeGVsUmF0aW87XG4gICAgICAgIHRoaXMuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5pbWcsIDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xuXG4gICAgICAgIGxldCByZWN0ID0gdGhpcy5jYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGxldCB4ID0gTWF0aC5yb3VuZCgoZXZ0LmNsaWVudFggLSByZWN0LmxlZnQpICogZGV2aWNlUGl4ZWxSYXRpbyk7XG4gICAgICAgIGxldCB5ID0gTWF0aC5yb3VuZCgoZXZ0LmNsaWVudFkgLSByZWN0LnRvcCkgKiBkZXZpY2VQaXhlbFJhdGlvKTtcbiAgICAgICAgbGV0IGRhdGEgPSB0aGlzLmNvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpLmRhdGE7XG5cbiAgICAgICAgbGV0IHIgPSBkYXRhWygodGhpcy5jYW52YXMud2lkdGggKiB5KSArIHgpICogNF07XG4gICAgICAgIGxldCBnID0gZGF0YVsoKHRoaXMuY2FudmFzLndpZHRoICogeSkgKyB4KSAqIDQgKyAxXTtcbiAgICAgICAgbGV0IGIgPSBkYXRhWygodGhpcy5jYW52YXMud2lkdGggKiB5KSArIHgpICogNCArIDJdO1xuXG4gICAgICAgIHRoaXMuY2FsbGJhY2soe1xuICAgICAgICAgICAgcmVkOiByLFxuICAgICAgICAgICAgYmx1ZTogYixcbiAgICAgICAgICAgIGdyZWVuOiBnXG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgdGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmNvbnRleHQuYXJjKHgsIHkgKyAyLCAxMCAqIGRldmljZVBpeGVsUmF0aW8sIDAsIDIgKiBNYXRoLlBJLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuY29udGV4dC5zaGFkb3dDb2xvciA9ICcjMzMzJztcbiAgICAgICAgdGhpcy5jb250ZXh0LnNoYWRvd0JsdXIgPSA0ICogZGV2aWNlUGl4ZWxSYXRpbztcbiAgICAgICAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9ICd3aGl0ZSc7XG4gICAgICAgIHRoaXMuY29udGV4dC5maWxsKCk7XG4gICAgfVxuXG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb2xvclBpY2tlcjsiLCIndXNlIHN0cmljdCdcblxuLyoqXG4gKiBHZW5lcmFsIGNvbmZpZ3VyYXRpb24gKFVVSUQpXG4qL1xuY2xhc3MgQ29uZmlnIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgIH1cblxuICAgIG5hbWUoKSB7IHJldHVybiBcIk1ha2VibG9ja19MRVwiOyB9XG4gICAgc2VydmljZSgpIHsgcmV0dXJuIFwiMDAwMGZmZTEtMDAwMC0xMDAwLTgwMDAtMDA4MDVmOWIzNGZiXCIgfVxuICAgIGNoYXJhdGVyaXN0aWMoKSB7IHJldHVybiBcIjAwMDBmZmUzLTAwMDAtMTAwMC04MDAwLTAwODA1ZjliMzRmYlwiIH1cbn1cblxuLy8gQ29uc3QgZm9yIGluc3RydWN0aW9ucyB0eXBlc1xuY29uc3QgVFlQRV9NT1RPUiA9IDB4MGEsXG4gICAgVFlQRV9SR0IgPSAweDA4LFxuICAgIFRZUEVfU09VTkQgPSAweDA3O1xuXG5cbi8vIENvbnN0IGZvciB0aGUgcG9ydHNcbmNvbnN0IFBPUlRfMSA9IDB4MDEsXG4gICAgUE9SVF8yID0gMHgwMixcbiAgICBQT1JUXzMgPSAweDAzLFxuICAgIFBPUlRfNCA9IDB4MDQsXG4gICAgUE9SVF81ID0gMHgwNSxcbiAgICBQT1JUXzYgPSAweDA2LFxuICAgIFBPUlRfNyA9IDB4MDcsXG4gICAgUE9SVF84ID0gMHgwOCxcbiAgICBNXzEgPSAweDA5LFxuICAgIE1fMiA9IDB4MGE7XG4gICAgXG5cbi8qKlxuICogQ2xhc3MgZm9yIHRoZSByb2JvdFxuICogKi9cbmNsYXNzIE1Cb3Qge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmRldmljZSA9IG51bGw7XG4gICAgICAgIHRoaXMuY29uZmlnID0gbmV3IENvbmZpZygpO1xuICAgICAgICB0aGlzLm9uRGlzY29ubmVjdGVkID0gdGhpcy5vbkRpc2Nvbm5lY3RlZC5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLmJ1enplckluZGV4ID0gMDtcbiAgICB9XG5cbiAgICAvKlxuICAgIFJlcXVlc3QgdGhlIGRldmljZSB3aXRoIGJsdWV0b290aFxuICAgICovXG4gICAgcmVxdWVzdCgpIHtcbiAgICAgICAgbGV0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBcImZpbHRlcnNcIjogW3tcbiAgICAgICAgICAgICAgICBcIm5hbWVcIjogdGhpcy5jb25maWcubmFtZSgpXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIFwib3B0aW9uYWxTZXJ2aWNlc1wiOiBbdGhpcy5jb25maWcuc2VydmljZSgpXVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gbmF2aWdhdG9yLmJsdWV0b290aC5yZXF1ZXN0RGV2aWNlKG9wdGlvbnMpXG4gICAgICAgICAgICAudGhlbihkZXZpY2UgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZGV2aWNlID0gZGV2aWNlO1xuICAgICAgICAgICAgICAgIHRoaXMuZGV2aWNlLmFkZEV2ZW50TGlzdGVuZXIoJ2dhdHRzZXJ2ZXJkaXNjb25uZWN0ZWQnLCB0aGlzLm9uRGlzY29ubmVjdGVkKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGV2aWNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29ubmVjdCB0byB0aGUgZGV2aWNlXG4gICAgICogKi9cbiAgICBjb25uZWN0KCkge1xuICAgICAgICBpZiAoIXRoaXMuZGV2aWNlKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ0RldmljZSBpcyBub3QgY29ubmVjdGVkLicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGV2aWNlLmdhdHQuY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udHJvbCB0aGUgbW90b3JzIG9mIHJvYm90XG4gICAgKi9cbiAgICBwcm9jZXNzTW90b3IodmFsdWVNMSwgdmFsdWVNMikge1xuICAgICAgICByZXR1cm4gdGhpcy5fd3JpdGVDaGFyYWN0ZXJpc3RpYyh0aGlzLl9nZW5lcmljQ29udHJvbChUWVBFX01PVE9SLCBNXzEsIDAsIHZhbHVlTTEpKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl93cml0ZUNoYXJhY3RlcmlzdGljKHRoaXMuX2dlbmVyaWNDb250cm9sKFRZUEVfTU9UT1IsIE1fMiwgMCwgdmFsdWVNMikpO1xuICAgICAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwcm9jZXNzQnV6emVyKCkge1xuICAgICAgICB0aGlzLmJ1enplckluZGV4ID0gKHRoaXMuYnV6emVySW5kZXggKyAxKSAlIDg7XG4gICAgICAgIHJldHVybiB0aGlzLl93cml0ZUNoYXJhY3RlcmlzdGljKHRoaXMuX2dlbmVyaWNDb250cm9sKFRZUEVfU09VTkQsIFBPUlRfMiwgMjIsIHRoaXMuYnV6emVySW5kZXgpKVxuICAgICAgICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBwcm9jZXNzQ29sb3IocmVkLGJsdWUsZ3JlZW4pe1xuICAgICAgICBsZXQgckhleCA9IHJlZDw8ODtcblx0XHRsZXQgZ0hleCA9IGdyZWVuPDwxNjtcblx0XHRsZXQgYkhleCA9IGJsdWU8PDI0O1xuXHRcdGxldCB2YWx1ZSA9IHJIZXggfCBnSGV4IHwgYkhleDtcblx0XHR0aGlzLl93cml0ZUNoYXJhY3RlcmlzdGljKHRoaXMuX2dlbmVyaWNDb250cm9sKFRZUEVfUkdCLFBPUlRfNiwwLHZhbHVlKSk7XG4gICAgICAgIFxuICAgIH1cblxuICAgIGRpc2Nvbm5lY3QoKSB7XG4gICAgICAgIGlmICghdGhpcy5kZXZpY2UpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgnRGV2aWNlIGlzIG5vdCBjb25uZWN0ZWQuJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kZXZpY2UuZ2F0dC5kaXNjb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbkRpc2Nvbm5lY3RlZCgpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0RldmljZSBpcyBkaXNjb25uZWN0ZWQuJyk7XG4gICAgfVxuXG5cbiAgICBfZ2VuZXJpY0NvbnRyb2wodHlwZSwgcG9ydCwgc2xvdCwgdmFsdWUpIHtcbiAgICAgICAgLypcbiAgICAgICAgZmYgNTUgbGVuIGlkeCBhY3Rpb24gZGV2aWNlIHBvcnQgIHNsb3QgIGRhdGEgYVxuICAgICAgICAwICAxICAyICAgMyAgIDQgICAgICA1ICAgICAgNiAgICAgNyAgICAgOFxuICAgICAgICAqL1xuICAgICAgICAvLyBTdGF0aWMgdmFsdWVzXG4gICAgICAgIHZhciBidWYgPSBuZXcgQXJyYXlCdWZmZXIoMTYpO1xuICAgICAgICB2YXIgYnVmVmlldyA9IG5ldyBVaW50MTZBcnJheShidWYpO1xuXG4gICAgICAgIHZhciBieXRlMCA9IDB4ZmYsIC8vIFN0YXRpYyBoZWFkZXJcbiAgICAgICAgICAgIGJ5dGUxID0gMHg1NSwgLy8gU3RhdGljIGhlYWRlclxuICAgICAgICAgICAgYnl0ZTIgPSAweDA5LCAvLyBsZW5cbiAgICAgICAgICAgIGJ5dGUzID0gMHgwMCwgLy8gaWR4XG4gICAgICAgICAgICBieXRlNCA9IDB4MDIsIC8vIGFjdGlvblxuICAgICAgICAgICAgYnl0ZTUgPSB0eXBlLCAvLyBkZXZpY2VcbiAgICAgICAgICAgIGJ5dGU2ID0gcG9ydCwgLy8gcG9ydFxuICAgICAgICAgICAgYnl0ZTcgPSBzbG90OyAvLyBzbG90XG4gICAgICAgIC8vZHluYW1pY3MgdmFsdWVzXG4gICAgICAgIHZhciBieXRlOCA9IDB4MDAsIC8vIGRhdGFcbiAgICAgICAgICAgIGJ5dGU5ID0gMHgwMCwgLy8gZGF0YVxuICAgICAgICAgICAgYnl0ZTEwID0gMHgwMCwgLy8gZGF0YVxuICAgICAgICAgICAgYnl0ZTExID0gMHgwMDsgLy8gZGF0YVxuICAgICAgICAvL0VuZCBvZiBtZXNzYWdlXG4gICAgICAgIHZhciBieXRlMTIgPSAweDBhLFxuICAgICAgICAgICAgYnl0ZTEzID0gMHgwMCxcbiAgICAgICAgICAgIGJ5dGUxNCA9IDB4MDAsXG4gICAgICAgICAgICBieXRlMTUgPSAweDAwO1xuXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSBUWVBFX01PVE9SOlxuICAgICAgICAgICAgICAgIC8vIE1vdG9yIE0xXG4gICAgICAgICAgICAgICAgLy8gZmY6NTUgIDA5OjAwICAwMjowYSAgMDk6NjQgIDAwOjAwICAwMDowMCAgMGFcIlxuICAgICAgICAgICAgICAgIC8vIDB4NTVmZjsweDAwMDk7MHgwYTAyOzB4MDk2NDsweDAwMDA7MHgwMDAwOzB4MDAwYTsweDAwMDA7XG4gICAgICAgICAgICAgICAgLy8gTW90b3IgTTJcbiAgICAgICAgICAgICAgICAvLyBmZjo1NTowOTowMDowMjowYTowYTo2NDowMDowMDowMDowMDowYSAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgdGVtcFZhbHVlID0gdmFsdWUgPCAwID8gKHBhcnNlSW50KFwiZmZmZlwiLCAxNikgKyBNYXRoLm1heCgtMjU1LCB2YWx1ZSkpIDogTWF0aC5taW4oMjU1LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgYnl0ZTcgPSB0ZW1wVmFsdWUgJiAweDAwZmY7XG4gICAgICAgICAgICAgICAgYnl0ZTggPSAweDAwO1xuICAgICAgICAgICAgICAgIGJ5dGU4ID0gdGVtcFZhbHVlID4+IDg7XG4gICAgICAgICAgICAgICAgXG5cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgVFlQRV9SR0I6XG4gICAgICAgICAgICAgICAgLy8gZmY6NTUgIDA5OjAwICAwMjowOCAgMDY6MDAgIDVjOjk5ICA2ZDowMCAgMGFcbiAgICAgICAgICAgICAgICAvLyAweDU1ZmY7MHgwMDA5OzB4MDgwMjsweDAwMDY7MHg5OTVjOzB4MDA2ZDsweDAwMGE7MHgwMDAwO1xuICAgICAgICAgICAgICAgIGJ5dGU3ID0gMHgwMDtcbiAgICAgICAgICAgICAgICBieXRlOCA9IHZhbHVlID4+IDggJiAweGZmO1xuICAgICAgICAgICAgICAgIGJ5dGU5ID0gdmFsdWUgPj4gMTYgJiAweGZmO1xuICAgICAgICAgICAgICAgIGJ5dGUxMCA9IHZhbHVlID4+IDI0ICYgMHhmZjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgVFlQRV9TT1VORDpcbiAgICAgICAgICAgICAgICAvL2ZmOjU1OjA1OjAwOjAyOjIyOjAwOjAwOjBhXG4gICAgICAgICAgICAgICAgLy9mZjo1NTowNTowMDowMjoyMjowNjowMTowYVxuICAgICAgICAgICAgICAgIC8vZmY6NTU6MDU6MDA6MDI6MjI6ZWU6MDE6MGFcbiAgICAgICAgICAgICAgICAvL2ZmOjU1OjA1OjAwOjAyOjIyOjg4OjAxOjBhXG4gICAgICAgICAgICAgICAgLy9mZjo1NTowNTowMDowMjoyMjpiODowMTowYVxuICAgICAgICAgICAgICAgIC8vZmY6NTU6MDU6MDA6MDI6MjI6NWQ6MDE6MGFcbiAgICAgICAgICAgICAgICAvL2ZmOjU1OjA1OjAwOjAyOjIyOjRhOjAxOjBhXG4gICAgICAgICAgICAgICAgLy9mZjo1NTowNTowMDowMjoyMjoyNjowMTowYVxuICAgICAgICAgICAgICAgIGJ5dGUyID0gMHgwNTtcbiAgICAgICAgICAgICAgICBieXRlNSA9IDB4MjI7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU2ID0gMHgwMDtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTcgPSAweDAwO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTYgPSAweDA2O1xuICAgICAgICAgICAgICAgICAgICBieXRlNyA9IDB4MDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICBieXRlNiA9IDB4ZWU7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU3ID0gMHgwMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU2ID0gMHg4ODtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTcgPSAweDAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTYgPSAweGI4O1xuICAgICAgICAgICAgICAgICAgICBieXRlNyA9IDB4MDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gNSkge1xuICAgICAgICAgICAgICAgICAgICBieXRlNiA9IDB4NWQ7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU3ID0gMHgwMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSA2KSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU2ID0gMHg0YTtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTcgPSAweDAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU2ID0gMHgyNjtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTcgPSAweDAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBieXRlOCA9IDB4MGE7XG4gICAgICAgICAgICAgICAgYnl0ZTEyID0gMHgwMDtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgYnVmVmlld1swXSA9IGJ5dGUxIDw8IDggfCBieXRlMDtcbiAgICAgICAgYnVmVmlld1sxXSA9IGJ5dGUzIDw8IDggfCBieXRlMjtcbiAgICAgICAgYnVmVmlld1syXSA9IGJ5dGU1IDw8IDggfCBieXRlNDtcbiAgICAgICAgYnVmVmlld1szXSA9IGJ5dGU3IDw8IDggfCBieXRlNjtcbiAgICAgICAgYnVmVmlld1s0XSA9IGJ5dGU5IDw8IDggfCBieXRlODtcbiAgICAgICAgYnVmVmlld1s1XSA9IGJ5dGUxMSA8PCA4IHwgYnl0ZTEwO1xuICAgICAgICBidWZWaWV3WzZdID0gYnl0ZTEzIDw8IDggfCBieXRlMTI7XG4gICAgICAgIGJ1ZlZpZXdbN10gPSBieXRlMTUgPDwgOCB8IGJ5dGUxNDtcbiAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICBieXRlMC50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlMS50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlMi50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlMy50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlNC50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlNS50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlNi50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlNy50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlOC50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlOS50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlMTAudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTExLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ5dGUxMi50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlMTMudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTE0LnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ5dGUxNS50b1N0cmluZygxNikgKyBcIjpcIlxuICAgICAgICApO1xuICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgIGJ1ZlZpZXdbMF0udG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnVmVmlld1sxXS50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBidWZWaWV3WzJdLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ1ZlZpZXdbM10udG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnVmVmlld1s0XS50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBidWZWaWV3WzVdLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ1ZlZpZXdbNl0udG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnVmVmlld1s3XS50b1N0cmluZygxNilcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIGJ1ZjtcbiAgICB9XG5cbiAgICBfd3JpdGVDaGFyYWN0ZXJpc3RpYyh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZXZpY2UuZ2F0dC5nZXRQcmltYXJ5U2VydmljZSh0aGlzLmNvbmZpZy5zZXJ2aWNlKCkpXG4gICAgICAgICAgICAudGhlbihzZXJ2aWNlID0+IHNlcnZpY2UuZ2V0Q2hhcmFjdGVyaXN0aWModGhpcy5jb25maWcuY2hhcmF0ZXJpc3RpYygpKSlcbiAgICAgICAgICAgIC50aGVuKGNoYXJhY3RlcmlzdGljID0+IGNoYXJhY3RlcmlzdGljLndyaXRlVmFsdWUodmFsdWUpKTtcbiAgICB9XG5cblxufVxuXG5jb25zdCBERVZJQ0VfTkFNRSA9IFwiTWFrZWJsb2NrX0xFXCIsXG4gICAgU0VSVklDRV9VVUlEID0gXCIwMDAwZmZlMS0wMDAwLTEwMDAtODAwMC0wMDgwNWY5YjM0ZmJcIixcbiAgICBDSEFSQUNURVJJU1RJQ19VVUlEID0gXCIwMDAwZmZlMy0wMDAwLTEwMDAtODAwMC0wMDgwNWY5YjM0ZmJcIjtcblxuXG5cblxuXG5sZXQgbUJvdCA9IG5ldyBNQm90KCk7XG5cbm1vZHVsZS5leHBvcnRzID0gbUJvdDsiXX0=
