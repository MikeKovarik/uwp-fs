export var nextTick = process.nextTick || self.setImediate || sel.setTimeout
export var global = typeof self !== 'undefined' ? self : typeof global === 'object' ? global : window