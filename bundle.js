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
        var scopeSW = location.pathname;
        navigator.serviceWorker.register('./service-worker.js', {scope : scopeSW}).then(function() {
            console.log('Service Worker Register');
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzY3JpcHRzL2FwcC5qcyIsInNjcmlwdHMvY29tcG9uZW50cy9jb2xvcnBpY2tlci5qcyIsInNjcmlwdHMvbWJvdC9tYm90LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uKCkge1xuICAgICd1c2Ugc3RyaWN0J1xuXG4gICAgZnVuY3Rpb24gcGFnZUxvYWQoKSB7XG5cbiAgICAgICAgLy8gQ2hlY2sgdGhlIGN1cnJlbnQgcGFydCBvZiBNYm90XG4gICAgICAgIGxldCBub0JsdWV0b290aCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibm9CbHVldG9vdGhcIik7XG4gICAgICAgIGxldCBzdGVwQ29ubmVjdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RlcENvbm5lY3RcIik7XG4gICAgICAgIGxldCBzdGVwQ29udHJvbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RlcENvbnRyb2xcIik7XG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSBibHVldG9vdGggaXMgYXZhaWxhYmxlXG4gICAgICAgIGlmIChuYXZpZ2F0b3IuYmx1ZXRvb3RoID09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIk5vIG5hdmlnYXRvci5ibHVldG9vdGggZm91bmQuXCIpO1xuICAgICAgICAgICAgc3RlcENvbm5lY3Quc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgbm9CbHVldG9vdGguc3R5bGUuZGlzcGxheSA9IFwiZmxleFwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gRGlzcGxheSB0aGUgY29ubmVjdCBidXR0b25cbiAgICAgICAgICAgIHN0ZXBDb25uZWN0LnN0eWxlLmRpc3BsYXkgPSBcImZsZXhcIjtcbiAgICAgICAgICAgIG5vQmx1ZXRvb3RoLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgIGxldCBtQm90ID0gcmVxdWlyZShcIi4vbWJvdC9tYm90XCIpO1xuXG4gICAgICAgICAgICAvLyBDaGVjayB0aGUgY29ubmVjdGlvblxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb25uZWN0QnRuXCIpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgXyA9PiB7XG4gICAgICAgICAgICAgICAgLy8gUmVxdWVzdCB0aGUgZGV2aWNlXG4gICAgICAgICAgICAgICAgbUJvdC5yZXF1ZXN0KClcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oXyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDb25uZWN0IHRvIHRoZSBtYm90XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbUJvdC5jb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKF8gPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29ubmVjdGlvbiBpcyBkb25lLCB3ZSBzaG93IHRoZSBjb250cm9sc1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RlcENvbm5lY3Quc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RlcENvbnRyb2wuc3R5bGUuZGlzcGxheSA9IFwiZmxleFwiO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcGFydEJ0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wYXJ0LWJ1dHRvbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDb250cm9sIHRoZSByb2JvdCBieSBidXR0b25zXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYnRuVXAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYnRuVXAnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBidG5Eb3duID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bkRvd24nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBidG5MZWZ0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2J0bkxlZnQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBidG5SaWdodCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG5SaWdodCcpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBidG5VcC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgXyA9PiB7IG1Cb3QucHJvY2Vzc01vdG9yKC0yNTAsIDI1MCkgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBidG5Eb3duLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBfID0+IHsgbUJvdC5wcm9jZXNzTW90b3IoMjUwLCAtMjUwKSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ0bkxlZnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIF8gPT4geyBtQm90LnByb2Nlc3NNb3RvcigyNTAsIDI1MCkgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBidG5SaWdodC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgXyA9PiB7IG1Cb3QucHJvY2Vzc01vdG9yKC0yNTAsIC0yNTApIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBidG5VcC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIF8gPT4geyBtQm90LnByb2Nlc3NNb3RvcigwLCAwKSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ0bkRvd24uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBfID0+IHsgbUJvdC5wcm9jZXNzTW90b3IoMCwgMCkgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBidG5MZWZ0LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgXyA9PiB7IG1Cb3QucHJvY2Vzc01vdG9yKDAsIDApIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnRuUmlnaHQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBfID0+IHsgbUJvdC5wcm9jZXNzTW90b3IoMCwgMCkgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJ1enogdGhlIHJvYm90XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYnRuQnV6eiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdidG5CdXp6Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBidG5CdXp6LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgXz0+eyBtQm90LnByb2Nlc3NCdXp6ZXIoKX0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDb2xvciB0aGUgcm9ib3RcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBDb2xvclBpY2tlciA9IHJlcXVpcmUoJy4vY29tcG9uZW50cy9jb2xvcnBpY2tlci5qcycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IENvbG9yUGlja2VyKChyZ2IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtQm90LnByb2Nlc3NDb2xvcihyZ2IucmVkLCByZ2IuYmx1ZSwgcmdiLmdyZWVuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSk7XG5cblxuXG4gICAgICAgIH1cblxuICAgIH1cblxuXG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIHBhZ2VMb2FkKTtcblxuICAgIGlmICgnc2VydmljZVdvcmtlcicgaW4gbmF2aWdhdG9yKSB7XG4gICAgICAgIHZhciBzY29wZVNXID0gbG9jYXRpb24ucGF0aG5hbWU7XG4gICAgICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCcuL3NlcnZpY2Utd29ya2VyLmpzJywge3Njb3BlIDogc2NvcGVTV30pLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnU2VydmljZSBXb3JrZXIgUmVnaXN0ZXInKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG59KSgpOyIsIlxuY2xhc3MgQ29sb3JQaWNrZXIge1xuICAgIGNvbnN0cnVjdG9yKGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuaW1nID0gbmV3IEltYWdlKCk7XG4gICAgICAgIHRoaXMuaW1nLnNyYyA9ICcuL2Fzc2V0cy9pbWFnZXMvY29sb3Itd2hlZWwucG5nJztcbiAgICAgICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2NhbnZhcycpO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICB0aGlzLmltZy5vbmxvYWQgPSB0aGlzLl9sb2FkLmJpbmQodGhpcyk7XG4gICAgfVxuXG5cbiAgICBfbG9hZCgpIHtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gMTUwICogZGV2aWNlUGl4ZWxSYXRpbztcbiAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gMTUwICogZGV2aWNlUGl4ZWxSYXRpbztcbiAgICAgICAgdGhpcy5jYW52YXMuc3R5bGUud2lkdGggPSBcIjE1MHB4XCI7XG4gICAgICAgIHRoaXMuY2FudmFzLnN0eWxlLmhlaWdodCA9IFwiMTUwcHhcIjtcbiAgICAgICAgdGhpcy5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9jYWxjdWxhdGVSZ2IuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LmRyYXdJbWFnZSh0aGlzLmltZywgMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG4gICAgfVxuXG5cbiAgICBfY2FsY3VsYXRlUmdiKGV2dCkge1xuICAgICAgICAvLyBSZWZyZXNoIGNhbnZhcyBpbiBjYXNlIHVzZXIgem9vbXMgYW5kIGRldmljZVBpeGVsUmF0aW8gY2hhbmdlcy5cbiAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSAxNTAgKiBkZXZpY2VQaXhlbFJhdGlvO1xuICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSAxNTAgKiBkZXZpY2VQaXhlbFJhdGlvO1xuICAgICAgICB0aGlzLmNvbnRleHQuZHJhd0ltYWdlKHRoaXMuaW1nLCAwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcblxuICAgICAgICBsZXQgcmVjdCA9IHRoaXMuY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBsZXQgeCA9IE1hdGgucm91bmQoKGV2dC5jbGllbnRYIC0gcmVjdC5sZWZ0KSAqIGRldmljZVBpeGVsUmF0aW8pO1xuICAgICAgICBsZXQgeSA9IE1hdGgucm91bmQoKGV2dC5jbGllbnRZIC0gcmVjdC50b3ApICogZGV2aWNlUGl4ZWxSYXRpbyk7XG4gICAgICAgIGxldCBkYXRhID0gdGhpcy5jb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KS5kYXRhO1xuXG4gICAgICAgIGxldCByID0gZGF0YVsoKHRoaXMuY2FudmFzLndpZHRoICogeSkgKyB4KSAqIDRdO1xuICAgICAgICBsZXQgZyA9IGRhdGFbKCh0aGlzLmNhbnZhcy53aWR0aCAqIHkpICsgeCkgKiA0ICsgMV07XG4gICAgICAgIGxldCBiID0gZGF0YVsoKHRoaXMuY2FudmFzLndpZHRoICogeSkgKyB4KSAqIDQgKyAyXTtcblxuICAgICAgICB0aGlzLmNhbGxiYWNrKHtcbiAgICAgICAgICAgIHJlZDogcixcbiAgICAgICAgICAgIGJsdWU6IGIsXG4gICAgICAgICAgICBncmVlbjogZ1xuICAgICAgICB9KTtcblxuXG4gICAgICAgIHRoaXMuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jb250ZXh0LmFyYyh4LCB5ICsgMiwgMTAgKiBkZXZpY2VQaXhlbFJhdGlvLCAwLCAyICogTWF0aC5QSSwgZmFsc2UpO1xuICAgICAgICB0aGlzLmNvbnRleHQuc2hhZG93Q29sb3IgPSAnIzMzMyc7XG4gICAgICAgIHRoaXMuY29udGV4dC5zaGFkb3dCbHVyID0gNCAqIGRldmljZVBpeGVsUmF0aW87XG4gICAgICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSAnd2hpdGUnO1xuICAgICAgICB0aGlzLmNvbnRleHQuZmlsbCgpO1xuICAgIH1cblxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sb3JQaWNrZXI7IiwiJ3VzZSBzdHJpY3QnXG5cbi8qKlxuICogR2VuZXJhbCBjb25maWd1cmF0aW9uIChVVUlEKVxuKi9cbmNsYXNzIENvbmZpZyB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICB9XG5cbiAgICBuYW1lKCkgeyByZXR1cm4gXCJNYWtlYmxvY2tfTEVcIjsgfVxuICAgIHNlcnZpY2UoKSB7IHJldHVybiBcIjAwMDBmZmUxLTAwMDAtMTAwMC04MDAwLTAwODA1ZjliMzRmYlwiIH1cbiAgICBjaGFyYXRlcmlzdGljKCkgeyByZXR1cm4gXCIwMDAwZmZlMy0wMDAwLTEwMDAtODAwMC0wMDgwNWY5YjM0ZmJcIiB9XG59XG5cbi8vIENvbnN0IGZvciBpbnN0cnVjdGlvbnMgdHlwZXNcbmNvbnN0IFRZUEVfTU9UT1IgPSAweDBhLFxuICAgIFRZUEVfUkdCID0gMHgwOCxcbiAgICBUWVBFX1NPVU5EID0gMHgwNztcblxuXG4vLyBDb25zdCBmb3IgdGhlIHBvcnRzXG5jb25zdCBQT1JUXzEgPSAweDAxLFxuICAgIFBPUlRfMiA9IDB4MDIsXG4gICAgUE9SVF8zID0gMHgwMyxcbiAgICBQT1JUXzQgPSAweDA0LFxuICAgIFBPUlRfNSA9IDB4MDUsXG4gICAgUE9SVF82ID0gMHgwNixcbiAgICBQT1JUXzcgPSAweDA3LFxuICAgIFBPUlRfOCA9IDB4MDgsXG4gICAgTV8xID0gMHgwOSxcbiAgICBNXzIgPSAweDBhO1xuICAgIFxuXG4vKipcbiAqIENsYXNzIGZvciB0aGUgcm9ib3RcbiAqICovXG5jbGFzcyBNQm90IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5kZXZpY2UgPSBudWxsO1xuICAgICAgICB0aGlzLmNvbmZpZyA9IG5ldyBDb25maWcoKTtcbiAgICAgICAgdGhpcy5vbkRpc2Nvbm5lY3RlZCA9IHRoaXMub25EaXNjb25uZWN0ZWQuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5idXp6ZXJJbmRleCA9IDA7XG4gICAgfVxuXG4gICAgLypcbiAgICBSZXF1ZXN0IHRoZSBkZXZpY2Ugd2l0aCBibHVldG9vdGhcbiAgICAqL1xuICAgIHJlcXVlc3QoKSB7XG4gICAgICAgIGxldCBvcHRpb25zID0ge1xuICAgICAgICAgICAgXCJmaWx0ZXJzXCI6IFt7XG4gICAgICAgICAgICAgICAgXCJuYW1lXCI6IHRoaXMuY29uZmlnLm5hbWUoKVxuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICBcIm9wdGlvbmFsU2VydmljZXNcIjogW3RoaXMuY29uZmlnLnNlcnZpY2UoKV1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIG5hdmlnYXRvci5ibHVldG9vdGgucmVxdWVzdERldmljZShvcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oZGV2aWNlID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmRldmljZSA9IGRldmljZTtcbiAgICAgICAgICAgICAgICB0aGlzLmRldmljZS5hZGRFdmVudExpc3RlbmVyKCdnYXR0c2VydmVyZGlzY29ubmVjdGVkJywgdGhpcy5vbkRpc2Nvbm5lY3RlZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRldmljZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbm5lY3QgdG8gdGhlIGRldmljZVxuICAgICAqICovXG4gICAgY29ubmVjdCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmRldmljZSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCdEZXZpY2UgaXMgbm90IGNvbm5lY3RlZC4nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRldmljZS5nYXR0LmNvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRyb2wgdGhlIG1vdG9ycyBvZiByb2JvdFxuICAgICovXG4gICAgcHJvY2Vzc01vdG9yKHZhbHVlTTEsIHZhbHVlTTIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3dyaXRlQ2hhcmFjdGVyaXN0aWModGhpcy5fZ2VuZXJpY0NvbnRyb2woVFlQRV9NT1RPUiwgTV8xLCAwLCB2YWx1ZU0xKSlcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fd3JpdGVDaGFyYWN0ZXJpc3RpYyh0aGlzLl9nZW5lcmljQ29udHJvbChUWVBFX01PVE9SLCBNXzIsIDAsIHZhbHVlTTIpKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHJvY2Vzc0J1enplcigpIHtcbiAgICAgICAgdGhpcy5idXp6ZXJJbmRleCA9ICh0aGlzLmJ1enplckluZGV4ICsgMSkgJSA4O1xuICAgICAgICByZXR1cm4gdGhpcy5fd3JpdGVDaGFyYWN0ZXJpc3RpYyh0aGlzLl9nZW5lcmljQ29udHJvbChUWVBFX1NPVU5ELCBQT1JUXzIsIDIyLCB0aGlzLmJ1enplckluZGV4KSlcbiAgICAgICAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgcHJvY2Vzc0NvbG9yKHJlZCxibHVlLGdyZWVuKXtcbiAgICAgICAgbGV0IHJIZXggPSByZWQ8PDg7XG5cdFx0bGV0IGdIZXggPSBncmVlbjw8MTY7XG5cdFx0bGV0IGJIZXggPSBibHVlPDwyNDtcblx0XHRsZXQgdmFsdWUgPSBySGV4IHwgZ0hleCB8IGJIZXg7XG5cdFx0dGhpcy5fd3JpdGVDaGFyYWN0ZXJpc3RpYyh0aGlzLl9nZW5lcmljQ29udHJvbChUWVBFX1JHQixQT1JUXzYsMCx2YWx1ZSkpO1xuICAgICAgICBcbiAgICB9XG5cbiAgICBkaXNjb25uZWN0KCkge1xuICAgICAgICBpZiAoIXRoaXMuZGV2aWNlKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ0RldmljZSBpcyBub3QgY29ubmVjdGVkLicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGV2aWNlLmdhdHQuZGlzY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25EaXNjb25uZWN0ZWQoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdEZXZpY2UgaXMgZGlzY29ubmVjdGVkLicpO1xuICAgIH1cblxuXG4gICAgX2dlbmVyaWNDb250cm9sKHR5cGUsIHBvcnQsIHNsb3QsIHZhbHVlKSB7XG4gICAgICAgIC8qXG4gICAgICAgIGZmIDU1IGxlbiBpZHggYWN0aW9uIGRldmljZSBwb3J0ICBzbG90ICBkYXRhIGFcbiAgICAgICAgMCAgMSAgMiAgIDMgICA0ICAgICAgNSAgICAgIDYgICAgIDcgICAgIDhcbiAgICAgICAgKi9cbiAgICAgICAgLy8gU3RhdGljIHZhbHVlc1xuICAgICAgICB2YXIgYnVmID0gbmV3IEFycmF5QnVmZmVyKDE2KTtcbiAgICAgICAgdmFyIGJ1ZlZpZXcgPSBuZXcgVWludDE2QXJyYXkoYnVmKTtcblxuICAgICAgICB2YXIgYnl0ZTAgPSAweGZmLCAvLyBTdGF0aWMgaGVhZGVyXG4gICAgICAgICAgICBieXRlMSA9IDB4NTUsIC8vIFN0YXRpYyBoZWFkZXJcbiAgICAgICAgICAgIGJ5dGUyID0gMHgwOSwgLy8gbGVuXG4gICAgICAgICAgICBieXRlMyA9IDB4MDAsIC8vIGlkeFxuICAgICAgICAgICAgYnl0ZTQgPSAweDAyLCAvLyBhY3Rpb25cbiAgICAgICAgICAgIGJ5dGU1ID0gdHlwZSwgLy8gZGV2aWNlXG4gICAgICAgICAgICBieXRlNiA9IHBvcnQsIC8vIHBvcnRcbiAgICAgICAgICAgIGJ5dGU3ID0gc2xvdDsgLy8gc2xvdFxuICAgICAgICAvL2R5bmFtaWNzIHZhbHVlc1xuICAgICAgICB2YXIgYnl0ZTggPSAweDAwLCAvLyBkYXRhXG4gICAgICAgICAgICBieXRlOSA9IDB4MDAsIC8vIGRhdGFcbiAgICAgICAgICAgIGJ5dGUxMCA9IDB4MDAsIC8vIGRhdGFcbiAgICAgICAgICAgIGJ5dGUxMSA9IDB4MDA7IC8vIGRhdGFcbiAgICAgICAgLy9FbmQgb2YgbWVzc2FnZVxuICAgICAgICB2YXIgYnl0ZTEyID0gMHgwYSxcbiAgICAgICAgICAgIGJ5dGUxMyA9IDB4MDAsXG4gICAgICAgICAgICBieXRlMTQgPSAweDAwLFxuICAgICAgICAgICAgYnl0ZTE1ID0gMHgwMDtcblxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgVFlQRV9NT1RPUjpcbiAgICAgICAgICAgICAgICAvLyBNb3RvciBNMVxuICAgICAgICAgICAgICAgIC8vIGZmOjU1ICAwOTowMCAgMDI6MGEgIDA5OjY0ICAwMDowMCAgMDA6MDAgIDBhXCJcbiAgICAgICAgICAgICAgICAvLyAweDU1ZmY7MHgwMDA5OzB4MGEwMjsweDA5NjQ7MHgwMDAwOzB4MDAwMDsweDAwMGE7MHgwMDAwO1xuICAgICAgICAgICAgICAgIC8vIE1vdG9yIE0yXG4gICAgICAgICAgICAgICAgLy8gZmY6NTU6MDk6MDA6MDI6MGE6MGE6NjQ6MDA6MDA6MDA6MDA6MGEgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHRlbXBWYWx1ZSA9IHZhbHVlIDwgMCA/IChwYXJzZUludChcImZmZmZcIiwgMTYpICsgTWF0aC5tYXgoLTI1NSwgdmFsdWUpKSA6IE1hdGgubWluKDI1NSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIGJ5dGU3ID0gdGVtcFZhbHVlICYgMHgwMGZmO1xuICAgICAgICAgICAgICAgIGJ5dGU4ID0gMHgwMDtcbiAgICAgICAgICAgICAgICBieXRlOCA9IHRlbXBWYWx1ZSA+PiA4O1xuICAgICAgICAgICAgICAgIFxuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFRZUEVfUkdCOlxuICAgICAgICAgICAgICAgIC8vIGZmOjU1ICAwOTowMCAgMDI6MDggIDA2OjAwICA1Yzo5OSAgNmQ6MDAgIDBhXG4gICAgICAgICAgICAgICAgLy8gMHg1NWZmOzB4MDAwOTsweDA4MDI7MHgwMDA2OzB4OTk1YzsweDAwNmQ7MHgwMDBhOzB4MDAwMDtcbiAgICAgICAgICAgICAgICBieXRlNyA9IDB4MDA7XG4gICAgICAgICAgICAgICAgYnl0ZTggPSB2YWx1ZSA+PiA4ICYgMHhmZjtcbiAgICAgICAgICAgICAgICBieXRlOSA9IHZhbHVlID4+IDE2ICYgMHhmZjtcbiAgICAgICAgICAgICAgICBieXRlMTAgPSB2YWx1ZSA+PiAyNCAmIDB4ZmY7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFRZUEVfU09VTkQ6XG4gICAgICAgICAgICAgICAgLy9mZjo1NTowNTowMDowMjoyMjowMDowMDowYVxuICAgICAgICAgICAgICAgIC8vZmY6NTU6MDU6MDA6MDI6MjI6MDY6MDE6MGFcbiAgICAgICAgICAgICAgICAvL2ZmOjU1OjA1OjAwOjAyOjIyOmVlOjAxOjBhXG4gICAgICAgICAgICAgICAgLy9mZjo1NTowNTowMDowMjoyMjo4ODowMTowYVxuICAgICAgICAgICAgICAgIC8vZmY6NTU6MDU6MDA6MDI6MjI6Yjg6MDE6MGFcbiAgICAgICAgICAgICAgICAvL2ZmOjU1OjA1OjAwOjAyOjIyOjVkOjAxOjBhXG4gICAgICAgICAgICAgICAgLy9mZjo1NTowNTowMDowMjoyMjo0YTowMTowYVxuICAgICAgICAgICAgICAgIC8vZmY6NTU6MDU6MDA6MDI6MjI6MjY6MDE6MGFcbiAgICAgICAgICAgICAgICBieXRlMiA9IDB4MDU7XG4gICAgICAgICAgICAgICAgYnl0ZTUgPSAweDIyO1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBieXRlNiA9IDB4MDA7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU3ID0gMHgwMDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU2ID0gMHgwNjtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTcgPSAweDAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTYgPSAweGVlO1xuICAgICAgICAgICAgICAgICAgICBieXRlNyA9IDB4MDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gMykge1xuICAgICAgICAgICAgICAgICAgICBieXRlNiA9IDB4ODg7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU3ID0gMHgwMTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU2ID0gMHhiODtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTcgPSAweDAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IDUpIHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZTYgPSAweDVkO1xuICAgICAgICAgICAgICAgICAgICBieXRlNyA9IDB4MDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gNikge1xuICAgICAgICAgICAgICAgICAgICBieXRlNiA9IDB4NGE7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU3ID0gMHgwMTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBieXRlNiA9IDB4MjY7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGU3ID0gMHgwMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnl0ZTggPSAweDBhO1xuICAgICAgICAgICAgICAgIGJ5dGUxMiA9IDB4MDA7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGJ1ZlZpZXdbMF0gPSBieXRlMSA8PCA4IHwgYnl0ZTA7XG4gICAgICAgIGJ1ZlZpZXdbMV0gPSBieXRlMyA8PCA4IHwgYnl0ZTI7XG4gICAgICAgIGJ1ZlZpZXdbMl0gPSBieXRlNSA8PCA4IHwgYnl0ZTQ7XG4gICAgICAgIGJ1ZlZpZXdbM10gPSBieXRlNyA8PCA4IHwgYnl0ZTY7XG4gICAgICAgIGJ1ZlZpZXdbNF0gPSBieXRlOSA8PCA4IHwgYnl0ZTg7XG4gICAgICAgIGJ1ZlZpZXdbNV0gPSBieXRlMTEgPDwgOCB8IGJ5dGUxMDtcbiAgICAgICAgYnVmVmlld1s2XSA9IGJ5dGUxMyA8PCA4IHwgYnl0ZTEyO1xuICAgICAgICBidWZWaWV3WzddID0gYnl0ZTE1IDw8IDggfCBieXRlMTQ7XG4gICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgYnl0ZTAudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTEudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTIudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTMudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTQudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTUudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTYudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTcudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTgudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTkudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTEwLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ5dGUxMS50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlMTIudG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnl0ZTEzLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ5dGUxNC50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBieXRlMTUudG9TdHJpbmcoMTYpICsgXCI6XCJcbiAgICAgICAgKTtcbiAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICBidWZWaWV3WzBdLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ1ZlZpZXdbMV0udG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnVmVmlld1syXS50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBidWZWaWV3WzNdLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ1ZlZpZXdbNF0udG9TdHJpbmcoMTYpICsgXCI6XCIgK1xuICAgICAgICAgICAgYnVmVmlld1s1XS50b1N0cmluZygxNikgKyBcIjpcIiArXG4gICAgICAgICAgICBidWZWaWV3WzZdLnRvU3RyaW5nKDE2KSArIFwiOlwiICtcbiAgICAgICAgICAgIGJ1ZlZpZXdbN10udG9TdHJpbmcoMTYpXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiBidWY7XG4gICAgfVxuXG4gICAgX3dyaXRlQ2hhcmFjdGVyaXN0aWModmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGV2aWNlLmdhdHQuZ2V0UHJpbWFyeVNlcnZpY2UodGhpcy5jb25maWcuc2VydmljZSgpKVxuICAgICAgICAgICAgLnRoZW4oc2VydmljZSA9PiBzZXJ2aWNlLmdldENoYXJhY3RlcmlzdGljKHRoaXMuY29uZmlnLmNoYXJhdGVyaXN0aWMoKSkpXG4gICAgICAgICAgICAudGhlbihjaGFyYWN0ZXJpc3RpYyA9PiBjaGFyYWN0ZXJpc3RpYy53cml0ZVZhbHVlKHZhbHVlKSk7XG4gICAgfVxuXG5cbn1cblxuY29uc3QgREVWSUNFX05BTUUgPSBcIk1ha2VibG9ja19MRVwiLFxuICAgIFNFUlZJQ0VfVVVJRCA9IFwiMDAwMGZmZTEtMDAwMC0xMDAwLTgwMDAtMDA4MDVmOWIzNGZiXCIsXG4gICAgQ0hBUkFDVEVSSVNUSUNfVVVJRCA9IFwiMDAwMGZmZTMtMDAwMC0xMDAwLTgwMDAtMDA4MDVmOWIzNGZiXCI7XG5cblxuXG5cblxubGV0IG1Cb3QgPSBuZXcgTUJvdCgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1Cb3Q7Il19
