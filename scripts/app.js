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
                    switchParts.addEventListener('click', function (evt) {
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
                    
                    btnUp.addEventListener('touchstart', _=>{mBot.processMotor(-100,100) });
                    btnDown.addEventListener('touchstart', _=>{mBot.processMotor(100,-100) });
                    btnLeft.addEventListener('touchstart', _=>{mBot.processMotor(100,100) });
                    btnRight.addEventListener('touchstart', _=>{mBot.processMotor(-100,-100) });
                    
                    btnUp.addEventListener('touchend', _=>{mBot.processMotor(0,0)});
                    btnDown.addEventListener('touchend', _=>{mBot.processMotor(0,0)});
                    btnLeft.addEventListener('touchend', _=>{mBot.processMotor(0,0)});
                    btnRight.addEventListener('touchend', _=>{mBot.processMotor(0,0)});
                    
                    
                })
        });

        let ColorPicker = require('./components/colorpicker.js');
        new ColorPicker((rgb) => {
            mBot.processColor(rgb.red, rgb.blue, rgb.green);
        });


    }

}



window.addEventListener('load', pageLoad);