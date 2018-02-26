const crashit = require('..');


crashit.addHook((reason, cb) => process.send(reason, cb));
crashit.handleSignals('SIGINT');

/* Don't allow the process to end for a while! */
setTimeout(() => {}, 150000);
process.send('READY');
