var crashit = require('..');


var reason = process.argv[2] || 0;
var runHooks = process.argv[3] || false;
var timeout = process.argv[4] || 100;

// Special Case: If reason is "ERR", give it a exception
if (reason == 'ERR') {
    reason = new Error();
}

crashit.crash(reason, runHooks, timeout);