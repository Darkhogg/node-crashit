crashit
=======

[![npm version](https://img.shields.io/npm/v/crashit.svg?style=flat)](//www.npmjs.com/package/crashit)
[![Build Status](https://img.shields.io/travis/Darkhogg/node-crashit/master.svg?style=flat)](//travis-ci.org/Darkhogg/node-crashit)

A simple way of handling application crashing and normal termination the exact
same way.


Crash Only and Crash First
--------------------------

Crash-only apps are applications that are coded in such a way that shutting
them down is performed just by crashing the app.  Crash-first apps are
crash-only apps that also include a *correct* way of being shut down, which is
generally better and preferred, but still respond well and can work correctly
if they are just crashed every time.

Crash here just means "end abruptly".  For node, this means calling
`process.exit`.  For a Unix process, it means killing a process with SIGKILL.
Either way, the result is the same: The process is stopped with little to no
chance of performing any clean up.

This library thus provides a single function that allows you to crash your
application.  It lets you choose the method of crashing and allows you to
define *crash hooks*.  It also allows you to completely bypass the hooks or to
set a timeout after which the process is *just crashed*.


### `crashit.crash([reason[, runHooks[, timeout]]])`

Crashes the current process with the given `reason`.

  + `reason`: The reason of the crash.  This can be one of the following:

      - An integer, which will be passed to `process.exit` directly.
      - A signal name.
      - An exception object.

    When anything is passed as a `reason` other than 0, the process will exit
    with an exit code different from 0.  If unspecified by the reason, this
    exit code will be 170.

    Its default value is `0`.

  + `runHooks`: Whether to run crash hooks or not.  Note that you should test
    your application by crashing it with and without running crash hooks or you
    risk your application being neither crash-only nor crash-first.

    Its default value is `true`.

  + `timeout`: The time to wait, in milliseconds, for hooks to end before
    definitely crashing the application.  If hooks are not allowed to run, this
    value is completely ignored.  If the application exits due to a timeout, it
    will exit with exit code 171.

    Its default value is `5000`, that is, *five seconds*.

The process will be ended by using `process.exit`, and will be passed a value
that depends on the `reason`:

  - If `reason` was an integer, it's passed to `process.exit`.
  - If `reason` was a string, it's interpreted as a signal name and
    `process.exit` receives `128 + signalNumber`, unless the string was not the
    name of a signal, in which case it receives `166`.
  - If `reason` was an error object, `process.exit` is passed the value `166`.
  - If the execution of the hooks times out, `process.exit` is called with the
    value `171`.

### `crashit.addHook(hook)`

Adds a new crash hook.  Crash hooks are global, which means that multiple
version of the library loaded by different modules will the same crash hooks.

  + `hook`: A function to run when the application crashes, with the following
    signature: `function (reason[, callback])`.

      - `reason` the crash reason used when the `crashit.crash` function was
        called.
      - `callback`: An optional callback argument in case the function is
        asynchronous.  The callback follows the common pattern of having an
        error as its first argument.  It doesn't accept any more arguments.

    If the `hook` function does not have a `callback` argument, it is assumed
    that all it had to do was completed when it returns *unless* it returns
    a [Promise][promises-aplus].  If either a promise is returned or a callback
    accepted, the hook is considered asynchronous and will be waited for before
    finishing the crash (unless, of course, it times out).

It is recommended to use promises rather than callbacks, but either way is
fine.  Errors during both synchronous or asynchronous hooks are completely
ignored.

  [promises-aplus]: https://promisesaplus.com/ "Promises/A+"

There's one guarantee about hooks: They will never run twice.


### `crashit.handleSignals(signals[, runHooks[, timeout]])`

In order to easily work with signals such as `SIGINT` and `SIGTERM` and handle
them as direct crashes, the `crashit.handleSignals` function is provided.

To use it, just pass one or more signal names to it.  When the process receives
said signals, the `crash` method will be automatically called with the passed
arguments and the signal name as the reason.

  + `signals`: A signal name or array of signal names to watch and crash on.
  + `runHooks`: Whether to rook crash hooks before crashing.
  + `timeout`: Time, in milliseconds, to wait for crash hooks.

Note that there might be multiple callers for the same signal.  That is,
however, completely idiotic, as signal handlers should be configured just once
in an application.  For that reason, nothing is done to prevent it or to define
what happens.  Most likely, all handler are called at once and the fastest
wins.  *In any case, crash hooks are never run twice*.


### `crashit.handleExceptions([runHooks[, timeout]])`

Sets up an uncaught exception handler that instantly performs a crash with the
offending exception as reason.  The handler will print a stack trace to the
screen *if and only if* the `runHooks` option is set to `false`.  This ensures
a trace is written even if the handler is configured to not run any hooks.

Note that this means that you should print the stack trace yourself in a hook
when setting `runHooks` to `true`.


### `crashit.handleRejections([runHooks[, timeout]])`

Sets up an unhandled rejection handler that instantly performs a crash with the
offending exception as reason.  The handler will print a stack trace to the
screen *if and only if* the `runHooks` option is set to `false`.  This ensures
a trace is written even if the handler is configured to not run any hooks.

Note that this means that you should print the stack trace yourself in a hook
when setting `runHooks` to `true`.


### `crashit.handleUncaught([runHooks[, timeout]])`

Calls `handleExceptions` and `handleRejections` with the same arguments.
