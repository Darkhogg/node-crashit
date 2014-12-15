var Promise = require('bluebird');
var getSignal = require('get-signal');

var EXIT_ERROR = 170;
var EXIT_TIMEOUT = 171;
var EXIT_UNKNOWN_SIGNAL = 166;


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
        var promises = G.hooks.map(function (fn) {
            return Promise.cast(fn());
        });
        crashPromise = Promise.settle(promises);
    }

    /* Avoid running hooks multiple times */
    G.crashed = true;

    var exitCode = parseInt(reason);

    /* If an exception, exit code is changed */
    if (reason instanceof Error) {
        exitCode = EXIT_ERROR;
    }

    /* If a SIGSOMETHING string, 128 + signal id (or 166 if unknown signal) */
    if (typeof reason === 'string' && reason.indexOf('SIG') === 0) {
        exitCode = (128 + getSignal.getSignalNumber(reason))
                || EXIT_UNKNOWN_SIGNAL;
    }

    /* When all hooks end, exit */
    crashPromise.then(function () {
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

    /* And now add it to the list of hooks! */
    G.hooks.push(pHook);
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


function handleUncaught (runHooks, timeout) {
    process.on('uncaughtException', function (exc) {
        crash(exc, runHooks, timeout);
    });
}

module.exports.crash = crash;
module.exports.addHook = addHook;
module.exports.handleSignals = handleSignals;
module.exports.handleUncaught = handleUncaught;