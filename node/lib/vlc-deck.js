/**
 * vlc-deck
 *
 * A VideoLAN (VLC) Remote Control Module
 * Controls VLC with http Interface
 *
 * Matthias Kallenbach
 * Spring 2017
 *
 */

const spawn = require('child_process').spawn;
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');


const Config = require('../../conf/globals.js');
var VlcEvent = require('../lib/vlc-event.js');

module.exports = function (args) {

    var that = this;

    //------------------------------------------

    this.process = null;    // the vlc process with spawn
    this.runner = null;     // events
    this.data = [];         // all items i a row
    this.current = null;    // the current item from vlc playlist mapped from that.data
    this.options = {};      // the options object
    this.defaults = {};     // the defaults, actually empty

    this.config = Config;
    that.defaults = Object.assign(that.defaults, that.config);

    if (typeof args === 'object') {
        that.options = Object.assign(that.defaults, args);
    } else {
        that.options = that.defaults;
    }

    //------------------------------------------

    /**
     * On Construct
     */
    this.init = function () {


        that.runner = new VlcEvent({});

        that.runner.on('run',function(){
            console.log('RUN');
        });


        that.runner.on('done',function(){

        });

        that.runner.on('idle',function(){

        });


        that.fetchData(function () {
            that.startVLC();

            setTimeout(function () {

                // as folder
                if (that.options.play === 'folder') {
                    that.setPlaylistFromFolder(that.options.play_folder, true, function () {
                        that.setPlaylistFromData(that.options.delay_add_folder, function () {
                            that.getPlaylist();

                            if (that.options.silent === true)
                                return; // break the chain

                            if(typeof that.options.onInit === 'function' ) {
                                that.options.onInit();
                            } else {
                                that.play();
                                that.skipLoop();
                            }
                        });
                    });
                }

                // as playlist or only
                if (that.options.play === 'playlist' || that.options.play === 'only') {
                    that.setPlaylistFromData(that.options.delay_add_playlist, function () {
                        if (that.options.silent === true)
                            return; // break the chain

                        if(typeof that.options.onInit === 'function' ) {
                            that.options.onInit();
                        } else {
                            that.play();
                            if (that.options.play === 'playlist')
                                that.skipLoop();
                        }

                    });
                }

            }, that.options.wait_before_connect);

        });
    };

    /**
     * starts vlc binary
     */
    this.startVLC = function () {
        if (!fs.existsSync(that.options.bin_path + '' + that.options.bin)) {
            console.log('vlc program not found');
            return;
        }
        var command = that.options.bin_path + '' + that.options.bin;
        that.process = spawn(command, [
            '-I', 'http',
            '--http-host=' + that.options.host,
            '--http-port=' + that.options.port,
            '--http-password=' + that.options.password,
            //'-Idummy',
            '--fullscreen',
            '--video-on-top',
            '--no-embedded-video',
            '--directx-device=\\\\.\\DISPLAY1',  // no effect
            '-f',
            '--udp-caching=50',
            '--tcp-caching=50',
            '--realrtsp-caching=50',
            '--network-caching=50',
        ]);
        that.process.stderr.setEncoding('utf8');
        that.process.stderr.on('data', function (data) {
            //console.log(data);
        });
    };

    /**
     * stops the vlc binary
     */
    this.stopVLC = function () {
        if (that.process === null)
            return;

        that.process.stdin.end();
        that.process.kill();
        that.process = null;
    };


    /**
     * VLC API Call
     * @param  {string}   call
     * @param  {array}    args
     * @param  {Function} cb
     */
    this.api = function (call, args, cb) {
        var val = '';

        for (var key in args) {
            val += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(args[key]);
        }

        if (call !== undefined) {
            call = '?command=' + call;
        }

        if (call === undefined) {
            call = '';
        }

        if (val === undefined) {
            val = '';
        }

        var path = '/requests/status.json' + call + val;

        http.get({
            hostname: that.options.host,
            port: that.options.port,
            path: path,
            auth: ':' + that.options.password,
            agent: false
        }, function (res) {
            var responseString = '';

            res.on('data', function (data) {
                responseString += data;
            });

            res.on('end', function () {
                //console.log('RESPONSE:', JSON.parse(responseString));
                if (typeof cb === 'function')
                    cb(res, responseString);
            });
        });
    };

    /**
     * get the vlc status
     * @param cb
     */
    this.status = function (cb) {
        that.api(undefined, {}, function (res) {
            var full = '';
            res.on('data', function (data) {
                full += data.toString();
            });
            res.on('end', function (e) {
                if (typeof cb === 'function')
                    cb(JSON.parse(full));

            });
        });
    };

    /**
     * get the vlc playing status
     * @param cb
     */
    this.isPlaying = function (cb) {
        that.status(function (res) {
            if (typeof cb === 'function')
                cb(res !== undefined && res !== null && res.state === 'playing');
        });
    };

    /**
     * let vlc take a image snapshot
     * @param cb
     */
    this.snapshot = function (cb) {
        that.api('snapshot', {}, cb);
    };

    /**
     * pause vlc playing
     */
    this.pause = function () {
        that.api('pl_pause');
    };

    /**
     * next vlc playlist entry
     */
    this.next = function () {
        that.api('pl_next');
        that.getPlaylist();
    };

    /**
     * previous vlc playlist entry
     */
    this.previous = function () {
        that.api('pl_previous');
    };

    /**
     * play from a vlc playlist id or the first playlist entry
     *
     * @param media
     * @param cb
     */
    this.play = function (media, cb) {
        if (cb === undefined) {
            if (media !== undefined) {
                var id = {id: media};
            } else {
                id = {};
            }
            that.api('pl_play', id, cb);
        } else {
            that.api('in_play', {
                input: media
            }, cb);
        }
        that.getPlaylist();
    };

    /**
     * adds a entry by flushing the vlc playlist and play them instantly
     *
     * @param media = the url or file path
     */
    this.playOnly = function (media) {
        that.flushPlaylist();
        that.add(media, null, true);
        that.getPlaylist();
    };

    /**
     * adds a item to the vlc playlist
     *
     * @param media = the url or file path
     * @param cb    = the api callback
     * @param play  = true or false
     */
    this.add = function (media, cb, play) {
        if (play === true) {
            that.api('in_play', {
                input: media
            }, cb);
        } else {
            that.api('in_enqueue', {
                input: media
            }, cb);
        }

    };

    /**
     *  gets the playlist xml from vlc
     *  update the data
     *
     *  xml because the json output from vlc is broken actually
     *
     * @param delay = the delay before getting the vlc playlist
     * @param cb    = the callback
     */
    this.getPlaylist = function (delay, cb) {
        var path = '/requests/playlist.xml';

        if (!delay)
            delay = 1000;

        setTimeout(function () {
            http.get({
                    hostname: that.options.host,
                    port: that.options.port,
                    path: path,
                    auth: ':' + that.options.password,
                    agent: false
                }, function (res) {
                    var responseString = '';

                    res.on('data', function (data) {
                        responseString += data;
                    });

                    res.on('end', function () {

                        var s = responseString.split("\n");
                        for (var i = 4; i < s.length - 2; i++) {
                            var ss = s[i].split(' ');
                            var item = {};
                            for (var ii = 1; ii < ss.length; ii++) {
                                var prop = ss[ii]
                                    .replace('=', ' ')
                                    .replace(/"/gi, '')
                                    .replace('/>', '')
                                    .split(' ');

                                item[prop[0]] = prop[1];
                            }
                            if (item.uri) {
                                var x = 'h' + crypto.createHash('md5').update(item.uri.replace(/&amp;/gi, '&')).digest('hex');

                                if (that.data[x])
                                    that.data[x]['id'] = item.id;

                                if (item.current === 'current')
                                    that.current = that.data[x];
                            }
                        }

                        that.getCurrent();

                        if (typeof cb === 'function')
                            cb(res, responseString);
                    });
                }
            );
        }, delay);
    };

    /**
     * clear the whole vlc playlist
     *
     * @param cb
     */
    this.flushPlaylist = function (cb) {
        that.api('pl_empty', {}, cb);
    };

    /**
     * dump the current item
     */
    this.getCurrent = function () {
        if (that.current)
            console.log('CURRENT: ', that.current.name);
    };

    /**
     * reads the json files conf/data.json or conf/only.json in that.data
     *
     * @param cb
     */
    this.fetchData = function (cb) {
        if (that.options.play === 'only') {
            var file = that.options.json_only;
        } else {
            var file = that.options.json_data;
        }

        var data = require(that.options.json_path + '' + file);
        for (var key in data) {
            var x = 'h' + crypto.createHash('md5').update(data[key]).digest('hex');
            that.data[x] = {
                name: key,
                url: data[key]
            };
        }

        if (typeof cb === 'function')
            cb();
    };

    /**
     * adds every item from that.data to the vlc playlist
     *
     * @param cb
     */
    this.setPlaylistFromData = function (delay, cb) {

        var keys = Object.keys(that.data);
        if (!delay)
            delay = 500;

        var loop = function (index) {
            if (!index)
                index = 0;

            if (!keys[index]) {
                if (typeof cb === 'function')
                    cb();

                return;
            }
            that.add(that.data[keys[index]].url);
            console.log('ADDED: ', that.data[keys[index]].name);
            setTimeout(function () {
                loop(index + 1);
            }, delay);
        };

        loop();
    };

    /**
     * set that.data from a folder structure
     *
     * @param folder    = the absolute folder
     * @param recursive = true or false
     */
    this.setPlaylistFromFolder = function (folder, recursive, cb) {
        that.data = [];
        that.flushPlaylist();

        var include = 'avi';
        var readDir = function (folder, recursive) {
            var dir = fs.readdirSync(folder + '');
            dir.forEach(function (i) {
                var insert = folder + "\\" + i;
                if (!fs.statSync(insert).isDirectory()) {
                    if (i.substr(-3) === include) {
                        var x = 'h' + crypto.createHash('md5').update(insert).digest('hex');
                        console.log(x);
                        that.data[x] = {
                            name: insert,
                            url: insert
                        };
                    }
                } else {
                    if (recursive === true) {
                        readDir(folder + "\\" + i, recursive);
                    }
                }
            });
        };

        readDir(folder, recursive);

        if (typeof cb === 'function')
            cb();

    };

    /**
     * stop vlc playing
     *
     * @param cb
     */
    this.stop = function (cb) {
        that.api('pl_stop', {}, cb);
    };

    /**
     * pause vlc playing
     *
     * @param cb
     */
    this.pause = function (cb) {
        that.api('pl_pause', {}, cb);
    };

    /**
     * test, the skip loop skips ever x milliseconds to the next
     */
    this.skipLoop = function () {
        setTimeout(function () {
            that.next();
            that.skipLoop();
        }, that.options.wait_to_skip);
    };


//------------------------------------------

    that.init();

//------------------------------------------

// make it public
    return {
        startVLC: that.startVLC,
        stopVLC: that.stopVLC
    };
};
