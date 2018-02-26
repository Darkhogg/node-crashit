const Promise = require('bluebird');
const getSignal = require('get-signal');

const EXIT_ERROR = 170;
const EXIT_TIMEOUT = 171;
const EXIT_UNKNOWN_SIGNAL = 166;


/* Create a global register for the library */
if (!global['crashit']) {
    global['crashit'] = {};
}

/* Obtain and fill the global object */
const G = global['crashit'];
G.hooks = G.hooks || [];
G.signals = G.singals || [];
G.crashed = G.crashed || false;


function calcExitCode (reason) {
    /* if parses as an integer, use it */
    const intReason = parseInt(reason);
    if (!Number.isNaN(intReason)) {
        return intReason;
    }

    /* If a SIGSOMETHING string, 128 + signal id (or 166 if unknown signal) */
    if (typeof reason === 'string' && reason.indexOf('SIG') === 0) {
        return (128 + getSignal.getSignalNumber(reason)) || EXIT_UNKNOWN_SIGNAL;
    }

    /* in ay other case, treat it as an Error */
    return EXIT_ERROR;
}


/* A function that crashes the application */
async function crash (reason_, runHooks_, timeout_) {
    const reason = reason_ || 0;
    const runHooks = (typeof runHooks_ !== 'undefined') ? runHooks_ : true
    const timeout = timeout_ || 5000;

    // NOTE: All hooks are stored as promise-returning functions.  This allows
    // this code to be uniform as hell.

    /* Avoid running hooks multiple times */
    const wasCrashed = G.crashed;
    G.crashed = true;

    /* wait for hooks to complete */
    if (runHooks && !wasCrashed) {
        /* Set the timeout */
        setTimeout(crash.bind(null, EXIT_TIMEOUT, false), timeout).unref();

        /* Get all hook promises */
        const promises = G.hooks.map(fn => fn(reason));
        await Promise.settle(promises);
    }

    /* find out the exit code we should use */
    const exitCode = calcExitCode(reason);
    process.exit(exitCode);
}

/* Add a crash hook */
function addHook (hook) {
    /* Accepting a nodeback, promisify it; else, store as it */
    const pHook = (hook.length > 1) ? Promise.promisify(hook) : hook;
    G.hooks.push(pHook);
}

/* Handles one or more signals */
function handleSignals (sigOrSigs, runHooks, timeout) {
    const sigs = Array.isArray(sigOrSigs) ? sigOrSigs : [sigOrSigs];
    sigs.forEach(s => process.on(s, crash.bind(null, s, runHooks, timeout)));
}

/* Handles uncaught exceptions */
function handleExceptions (runHooks, timeout) {
    process.on('uncaughtException', err => {
        if (typeof runHooks !== 'undefined' && !runHooks) {
            console.log(err.stack || err);
        }
        crash(err, runHooks, timeout);
    });
}

/* Handles unhandled rejections */
function handleRejections (runHooks, timeout) {
    process.on('unhandledRejection', err => {
        if (typeof runHooks !== 'undefined' && !runHooks) {
            console.log(err.stack || err);
        }
        crash(err, runHooks, timeout);
    });
}

/* Handle everything uncaught */
function handleUncaught (runHooks, timeout) {
    handleExceptions(runHooks, timeout);
    handleRejections(runHooks, timeout);
}

/* Setup the exports */
exports.crash = crash;
exports.addHook = addHook;
exports.handleSignals = handleSignals;
exports.handleExceptions = handleExceptions;
exports.handleRejections = handleRejections;
exports.handleUncaught = handleUncaught;
