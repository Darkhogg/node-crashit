var crashit = require('..');


var reason = process.argv[2] || 0;
var hooks = process.argv[3] || false;
var timeout = process.argv[4] || 100;

// Special Case: If reason is "ERR", give it a exception
if (reason == 'ERR') {
    reason = new Error();
}

if (hooks == 'timeout') {
    crashit.addHook(function (reason, cb) {
        /* Do nothing, let it timeout */
    });
}

if (hooks == 'yes' || hooks == 'no') {
    crashit.addHook(function (reason) {
        process.send(reason);
    });
}

crashit.crash(reason, (hooks && hooks != 'no'), parseInt(timeout));

/* Don't allow the process to end for a while! */
setTimeout(function () {}, 150000);
