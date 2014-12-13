var Promise = require('bluebird');

var EXIT_ERROR = 170;
var EXIT_TIMEOUT = 171;


/* Create a global register for the library */
if (!global['12factor-process']) {
    global['12factor-process'] = {};
}

/* Obtain and fill the global object */
var G = global['12factor-process'];
G.hooks = G.hooks || [];
G.signals = G.singals || [];
G.crashed = G.crashed || false;


/* A function that crashes the application */
function crash (reason, runHooks, timeout) {
    // NOTE: All hooks are stored as promise-returning functions.  This allows
    // this code to be uniform as hell.

    /* Default already-fulfilled promise - will be used if runHooks is false */
    var crashPromise = Promise.resolve(null);

    if (runHooks && !G.crashed) {
        /* Set the timeout */
        tmout = setTimeout(crash.bind(null, EXIT_TIMEOUT, false), timeout);
        tmout.unref();

        /* Get all hook promises */
        var promises = G.hooks.map(Function.apply);
        crashPromise = Promise.settle(promises);
    }

    /* Avoid running hooks multiple times */
    G.crashed = true;

    var exitCode = reason;

    /* If an exception, exit code is changed */
    if (reason instanceof Error) {
        exitCode = EXIT_ERROR;
    }

    /* When all hooks end, exit */
    crashPromise.then(function () {
        console.log('Exit!');
        process.exit(exitCode);
    });
}

/* Add a crash hook */
function addHook (hook) {
    var pHook = hook;

    if (hook.length > 1) {
        /* Accepting a nodeback -- promisify it */
        pHook = Promise.promisify(hook);
    }

    /* Now hook either returns a promise or a value */
    var promise = new Promise(function (resolve, reject) {
        resolve(pHook());
    });

    /* And now add it to the list of hooks! */
    G.hooks.push(promise);
}

/* Handles one or more signals */
function handleSignals (signalOrSignals, runHooks, timeout) {
    var signals = Array.isArray(signalOrSignals)
        ? signalOrSignals
        : [signalOrSignals];

    signals.forEach(function (signal) {
        process.on(signal, crash.bind(null, signal, runHooks, timeout));
    });
}


module.exports.crash = crash;
module.exports.addHook = addHook;
module.exports.handleSignals = handleSignals;
