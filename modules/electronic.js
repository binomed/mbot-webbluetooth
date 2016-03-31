'use strict'

var five = require("johnny-five"),
	Raspi = null,	
	os = require("os"),
	board = null,
	portLed = 11,
	led = null;

try{
	Raspi = require("raspi-io");
	board = new five.Board({io: new Raspi()});
	portLed = "P1-7";
	console.log("On Rpi");
}catch(e){
	Raspi = null;
	board = new five.Board();
	console.log("On Computer");
}


board.on("ready", function() {
  led = new five.Led(portLed);
  console.log("Board Ready");

});

function on(){
	console.log("Electronic->On");
	if (led){
		led.on();
		console.log("Turn On Led");
	}
}

function brightnessLed(power){
	console.log("Electronic->BrightnessLed : "+power);
	if (led){
		led.brightness(power);
	}
}

function blink(){
	console.log("Electronic->Blink");
	if (led){
		led.blink(500);
	}
}

function stopLed(){
	console.log("Electronic->Stop");
	if (led) {
		led.stop();
		led.off();
		console.log("Stop & off led");
	}
}

function isRaspberry(){
	return Raspi;
}




module.exports = {
	brightness : brightnessLed,
	blink : blink,
	stop : stopLed, 
	on : on,
	isRaspberry : isRaspberry
}