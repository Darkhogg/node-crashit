const crashit = require('..');


let reason = process.argv[2] || 0;
const hooks = process.argv[3] || false;
const timeout = process.argv[4] || 100;

// Special Case: If reason is "ERR", give it a exception
if (reason == 'ERR') {
    reason = new Error();
}

if (hooks == 'timeout') {
    /* hook that does nothing, just timeout */
    crashit.addHook((reason, cb) => {});
}

if (hooks == 'yes' || hooks == 'no') {
    crashit.addHook((reason, cb) => process.send(reason, cb));
}

crashit.crash(reason, (hooks && hooks != 'no'), parseInt(timeout));

/* Don't allow the process to end for a while! */
setTimeout(() => {}, 150000);
