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
        navigator.serviceWorker.register('./service-worker.js').then(function() {
            console.log('Service Worker Register');
        });
    }

})();