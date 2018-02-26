const crashit = require('..');

if (process.argv[2] && process.argv[2] === 'yes') {
    crashit.handleRejections();
} else {
    process.on('unhandledRejection', process.exit(1));
}

crashit.addHook((reason, cb) => process.send('handled', cb));

/* Don't allow the process to end for a while! */
setTimeout(() => {}, 150000);

new Promise((accept, reject) => reject(new Error()));
