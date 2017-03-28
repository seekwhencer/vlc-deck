'use strict';

var emitter = require('events');
class VlcEvent extends emitter {

    constructor(options){
        super();
        this.run();
    };

    run() {
        //this.emit('run');
        this.emit("run");
        setTimeout(this.run,500);
    };

    done() {
        this.emit('done');
    };

    idle(){
        this.emit('idle');
    };

};

module.exports = VlcEvent;
