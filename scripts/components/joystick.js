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
        this.lastPower = 0;
    }

    _move(evt, data) {
        if (data.direction) {
            let power = Math.round((data.distance / 100) * 250);
            if (power != this.lastPower) {
                this.lastPower = power;                
                switch (data.direction.angle) {
                    case 'up':
                        this.callback({
                            M1: -power,
                            M2: power
                        });
                        break;
                    case 'down':
                        this.callback({
                            M1: power,
                            M2: -power
                        });
                        break;
                    case 'left':
                        this.callback({
                            M1: power,
                            M2: power
                        });
                        break;
                    case 'right':
                        this.callback({
                            M1: -power,
                            M2: -power
                        });
                        break;

                }
            }
        }
        

    }

    _end(evt, data) {
        this.callback({
            M1: 0,
            M2: 0
        });
    }

}

module.exports = Joystick;