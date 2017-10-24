import ReadableStreamAdapter from './ReadableStreamAdapter.mjs'
import WritableStreamAdapter from './WritableStreamAdapter.mjs'
import {global} from './util.mjs'


if (!global.ReadableStream)
	global.ReadableStream = ReadableStreamShim
if (!global.WritableStream)
	global.WritableStream = WritableStreamShim
