/**
 *
 *
 *
 */
module.exports = {

    // http hostname or ip
    host: '127.0.0.1',

    // http host port
    port: 6968,

    // http host password
    password: 'change!me',

    // the local absolute path to the vlc binary
    bin_path: 'C:\\Program Files (x86)\\VideoLAN\\VLC\\',

    // the local vlc binary name
    bin: 'vlc.exe',

    // delaying after adding a streaming url entry to the vlc playlist
    delay_add_playlist: 50,

    // delay for adding from folder
    delay_add_folder: 50,

    // delay beween the vlc binary start and the first action
    wait_before_connect: 2000,

    // delay for the skip (next playlist entry) loop (testing)
    wait_to_skip: 10000,

    // play mode: 'folder' or 'playlist' or 'only'
    play: 'playlist',

    // the folder who played in folder mode
    play_folder: 'D:\\Data\\video\\Star Trek - Enterprise',

    // play mode folder recursive
    play_folder_recursive : true


};