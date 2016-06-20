class Joystick{

    constructor(id){
        this.joystick = nipplejs.create({
            zone:document.getElementById(id),
            mode:'static',
            position:{
                left: '50%',
                top:'50%'
            },
            size:200,
            color:'#3f51b5'
        });
        
        this.joystick.on('move',this._move.bind(this))
    }
    
    _move(evt, data){
        console.debug(data);
        
    }
    
}

module.exports = Joystick;