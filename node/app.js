'use strict';

var Vlc = require('./lib/vlc-deck.js');
var App = function (args) {

    var that = this;

    //------------------------------------------

    this.vlc = null;
    this.player = null;
    this.options = {
        url: ''
    };

    if (typeof args === 'object')
        that.options = Object.assign(that.options, args);

    //------------------------------------------

    this.init = function () {
        that.player = new Vlc();
    };

    //------------------------------------------

    // start the app
    that.init();

    //------------------------------------------

    return {

    };
};

var app = new App();


