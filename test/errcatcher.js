var errors = []

window.onerror = function (msg, url, line, col, error) {
    errors.push([msg, url, line, col, error])
}

