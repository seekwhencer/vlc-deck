# vlc-deck
Remote Control for VideoLAN (VLC)

* watch video web streams with VLC
* watch files from disk with VLC
* use a USB Infrared Control to switch Channels ( IN PROGRESS, NOT INCLUDED )

*Matthias Kallenbach, Spring 2017*

At the moment my USB IR Control Dingsbums is on the way to me. For this Reason i will updating the module as soon as possible!

For testing the Streams, run:

```js
    cd D:\\some\\where\\on\\my\\disk\\vlc-deck
    node node/app.js
```

This test:

* Reads the `conf/data.json` as data
* Adds the data to the VLC Playlist
* Adds a given Folder to the VLC Playlist
* Skip to the Next or to the Previous Playlist Item
* Stop or Pause Playing
* Flush VLC Playlist
* Add one Item to the VLC Playlist and play them instantly by flushing the Playlist before.
* Play a special Playlist Entry by Id. Special Match Making between VLC Playlist Entries and the JSON Data.

## Usage
### Installation

Install VideoLAN VLC on your Computer. Then in your Project Folder: 

```bash    
    npm install vlc-deck -S
``` 

### Use

```js
    var Vlc = require('vlc-deck');
    var Player = new Vlc({
        // ... options
    });
```

On create the vlc binary starts instantly.

## Globals › Defaults › Config › Options:

```bash
    conf/globals.js
```

#### File Content

```js
    // http hostname or ip
    host: '127.0.0.1',
```

```js
    // http host port
    port: 6968,
```

```js
    // http host password
    password: 'change!me',
```

```js
    // the local absolute path to the vlc binary
    bin_path: 'C:\\Program Files (x86)\\VideoLAN\\VLC\\',
```

```js
    // the local vlc binary name
    bin: 'vlc.exe',
```

```js
    // delaying after adding a streaming url entry to the vlc playlist
    delay_add_playlist: 50,
```

```js
    // delay for adding from folder
    delay_add_folder: 50,
```

```js
    // delay beween the vlc binary start and the first action
    wait_before_connect: 2000,
```

```js
    // delay for the skip (next playlist entry) loop (testing)
    wait_to_skip: 10000,
```

```js
    // play mode: 'folder' or 'playlist' or 'only'
    play: 'playlist',
```

```js
    // the folder who played in folder mode
    play_folder: 'D:\\Data\\video\\Star Trek - Enterprise',
```

```js
    // play mode folder recursive
    play_folder_recursive : true
```
