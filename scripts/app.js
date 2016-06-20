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