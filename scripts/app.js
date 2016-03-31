'use strict'

angular.module("MbotApp", ['ngMaterial'])
.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('light-blue')
    .accentPalette('orange');
})
.directive('mbotTouchstart', [function() {
    return function(scope, element, attr) {

        element.on('touchstart', function(event) {
        	event.preventDefault();
            scope.$apply(function() { 
                scope.$eval(attr.mbotTouchstart); 
            });
        });
    };
}]).directive('mbotTouchend', [function() {
    return function(scope, element, attr) {

        element.on('touchend', function(event) {
        	event.preventDefault();
            scope.$apply(function() { 
                scope.$eval(attr.mbotTouchend); 
            });
        });
    };
}])
.directive('mbotColorpicker', [function(){
	return function(scope, element, attr){
		var img = new Image();
		img.src = './assets/images/color-wheel.png'
		img.onload = function() {
		  var canvas = document.querySelector('canvas');
		  var context = canvas.getContext('2d');

		  canvas.width = 150 * devicePixelRatio;
		  canvas.height = 150 * devicePixelRatio;
		  canvas.style.width = "150px";
		  canvas.style.height = "150px";
		  canvas.addEventListener('click', function(evt) {
		    // Refresh canvas in case user zooms and devicePixelRatio changes.
		    canvas.width = 150 * devicePixelRatio;
		    canvas.height = 150 * devicePixelRatio;
		    context.drawImage(img, 0, 0, canvas.width, canvas.height);

		    var rect = canvas.getBoundingClientRect();
		    var x = Math.round((evt.clientX - rect.left) * devicePixelRatio);
		    var y = Math.round((evt.clientY - rect.top) * devicePixelRatio);
		    var data = context.getImageData(0, 0, canvas.width, canvas.height).data;

		    var r = data[((canvas.width * y) + x) * 4];
		    var g = data[((canvas.width * y) + x) * 4 + 1];
		    var b = data[((canvas.width * y) + x) * 4 + 2];
		    
		    scope.$eval(attr.mbotColorpicker, {
		    	red:r,
		    	blue:b,
		    	green:g
		    }); 
		    

		    context.beginPath();
		    context.arc(x, y + 2, 10 * devicePixelRatio, 0, 2 * Math.PI, false);
		    context.shadowColor = '#333';
		    context.shadowBlur = 4 * devicePixelRatio;
		    context.fillStyle = 'white';
		    context.fill();
		  });

		  context.drawImage(img, 0, 0, canvas.width, canvas.height);
		}
	};
}])
.directive('app', [ 
	function(){

	return {
		templateUrl: './components/app.html',
		controllerAs : 'app',
		bindToController : true,
		controller: require('./sensors/bluetooth')/*function(){
			this.actions = [
				{label : "Bluetooth", icon : 'fa-bluetooth', idAction: 'ble'}
			];

					

			this.openDialog = function(event, type){
				console.log('Open Dialog');
				if (type === 'ble'){
					$mdDialog.show({
						controllerAs : 'bleCtrl',
						templateUrl: './components/bluetooth.html',
						controller: require('./sensors/bluetooth'),
						parent : angular.element(document.querySelector('#mainContainer')),
						targetEvent : event,
						fullScreen : true
					});
				}
			}
		}*/
	}
}]);


function pageLoad(){		
}



window.addEventListener('load', pageLoad);