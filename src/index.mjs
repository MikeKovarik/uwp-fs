export {open, close, read, stat, exists} from './syscall.mjs'
export * from './folder.mjs'
export * from './file.mjs'
export * from './watch.mjs'
export {uwpSetCwdFolder, cwd} from './path.mjs'

export * from './conv/index.mjs' // TODO: spin into separate module
export * from './uwp-apis.mjs'

import {getPathFromURL} from './path.mjs'
export var _internals = {getPathFromURL}


// TODO
// - WHATWG URL - https://nodejs.org/api/fs.html#fs_whatwg_url_object_support

// https://blogs.windows.com/buildingapps/2014/06/19/common-questions-and-answers-about-files-and-app-data-part-1-app-data/#rtHwpGGxeZGTbFF2.97
// https://blogs.windows.com/buildingapps/2014/06/20/common-questions-and-answers-about-files-and-app-data-part-2-files/#ruU7x5z0PYWB7mez.97