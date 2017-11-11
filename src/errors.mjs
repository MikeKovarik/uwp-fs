// refference:
// win: https://github.com/nodejs/node/blob/master/deps/uv/include/uv-errno.h
// unix: https://github.com/nodejs/node/blob/master/deps/npm/node_modules/worker-farm/node_modules/errno/errno.js

// https://nodejs.org/en/blog/release/v9.0.0/

export var ERROR = {
	UNKNOWN: {
		errno: -1,
		code: 'UNKNOWN',
		description: 'unknown error'
	},
	UNKNOWN_UWP: {
		errno: -1,
		code: 'UNKNOWN_UWP',
		description: 'unknown uwp error'
	},
	// NOTE: there are two ENOENTs, one with errno -2, second with errno 34 (according to node files)
	//       testing proved that the -2 is used in unix, -4058 in windows, 34 is not.
	ENOENT: {
		errno: -4058, // -2
		code: 'ENOENT',
		description: 'no such file or directory'
	},
	EACCES: {
		errno: -4092, // 3
		code: 'EACCES',
		description: 'permission denied'
	},
	EADDRINUSE: {
		errno: -4091, // 5
		code: 'EADDRINUSE',
		description: 'address already in use'
	},
	EINVAL: {
		errno: -4071, // 18
		code: 'EINVAL',
		description: 'invalid argument'
	},
	ENOTDIR: {
		errno: -4052, // 27
		code: 'ENOTDIR',
		description: 'not a directory'
	},
	EISDIR: {
		errno: -4068, // 28
		code: 'EISDIR',
		description: 'illegal operation on a directory'
	}
}

// todo: rename this because its custom errno function and not the one found in fs
export function syscallException(error, syscall, path) {
	if (error instanceof Error) {
		var {errno, code} = ERROR.UNKNOWN_UWP
		var err = error
	} else {
		if (typeof error === 'string')
			error = ERROR[error]
		var {errno, code, description} = error
		var message = `${code}: ${description}, ${syscall}`
		if (path)
			message += ` '${path}'`
		var err = new Error(message)
	}
	err.errno = errno
	err.code = code
	err.syscall = syscall
	if (path)
		err.path = path
	return err
}

export var UWP_ERR = {
	ENOENT: 'The system cannot find the file specified.\r\n',
	EACCES: 'Access is denied.\r\n',
	_INCORRECT: 'The parameter is incorrect.\r\n',
	_UNSUPPORTED: 'No such interface supported\r\n',
}

// TODO
export var errors = {
	TypeError: makeNodeError(TypeError),
	RangeError: makeNodeError(RangeError),
	Error: makeNodeError(Error),
}

function makeNodeError(Err) {
	// TODO
	return Err
}