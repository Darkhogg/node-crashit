const crashit = require('..');

if (process.argv[2] && process.argv[2] === 'yes') {
    crashit.handleSignals('SIGINT');
}

crashit.addHook((reason, cb) => process.send('handled', cb));

/* Don't allow the process to end for a while! */
setTimeout(() => {}, 150000);
process.send('READY');
