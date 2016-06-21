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