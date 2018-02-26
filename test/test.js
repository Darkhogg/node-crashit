const cp = require('child_process');

const {expect} = require('chai');
const {describe, it} = require('mocha');


function callCrash (args, cb) {
    const p = cp.fork('test/_crash.js', args, {silent: true});
    const messages = [];
    let start = process.hrtime();

    p.on('message', data => (data === 'START') ? (start = process.hrtime()) : messages.push(data));
    p.on('exit', code => cb(code, messages, start));
}

function callCrashSignal (cb) {
    const p = cp.fork('test/_crashSignal.js', [], {silent: true});
    const messages = [];

    p.on('message', data => (data === 'READY') ? p.kill('SIGINT') : messages.push(data));
    p.on('exit', code => cb(code, messages));
}

function callHandleSignal (args, cb) {
    const p = cp.fork('test/_handleSignal.js', args, {silent: true});
    const messages = [];

    p.on('message', data => (data === 'READY') ? p.kill('SIGINT') : messages.push(data));
    p.on('exit', code => cb(code, messages));
}

function callHandleException (args, cb) {
    const p = cp.fork('test/_handleException.js', args, {silent: true});
    const messages = [];

    p.on('message', data => messages.push(data));
    p.on('exit', code => cb(code, messages));
}

function callHandleRejections (args, cb) {
    const p = cp.fork('test/_handleRejection.js', args, {silent: true});
    const messages = [];

    p.on('message', data => messages.push(data));
    p.on('exit', code => cb(code, messages));
}


describe('crashit', function () {
    this.slow(250);

    /* Repeated on every test */
    function callCrashWithReasonAndCheckCode (reason, code, cb) {
        callCrash([reason], function (exitCode) {
            expect(exitCode).to.equal(code);
            cb();
        });
    }

    describe('misc', function () {
        it('should give hooks the crash reason', function (cb) {
            callCrash([42, 'yes'], function (code, msgs) {
                expect(msgs).to.have.length(1);
                expect(msgs[0]).to.equal('42');
                cb();
            });
        });

        it('should respond to a signal by running hooks with the signal reason', function (cb) {
            callCrashSignal(function (code, msgs) {
                expect(msgs).to.have.length(1);
                expect(msgs[0]).to.equal('SIGINT');
                cb();
            });
        });
    })

    describe('exit code', function () {
        it('should exit cleanly when not given a reason', function (cb) {
            callCrashWithReasonAndCheckCode(0, 0, cb);
        });

        it('should exit with the given integer reason', function (cb) {
            callCrashWithReasonAndCheckCode(42, 42, cb);
        });

        it('should exit with 128 + signal number when given a signal name', function (cb) {
            callCrashWithReasonAndCheckCode('SIGINT', 130, cb);
        });

        it('should exit with 170 when given a exception object', function (cb) {
            callCrashWithReasonAndCheckCode('ERR', 170, cb);
        });

        it('should exit with 171 when timed out', function (cb) {
            callCrash([0, 'timeout', 10], function (code) {
                expect(code).to.equal(171);
                cb();
            });
        });
    });

    describe('hooks', function () {
        it('should run hooks when asked to by int reason', function (cb) {
            callCrash([0, 'yes'], function (code, msgs) {
                expect(msgs).to.have.length(1);
                cb();
            });
        });

        it('should run hooks when asked to by signal reason', function (cb) {
            callCrash(['SIGINT', 'yes'], function (code, msgs) {
                expect(msgs).to.have.length(1);
                cb();
            });
        });

        it('should run hooks when asked to by error reason', function (cb) {
            callCrash(['ERR', 'yes'], function (code, msgs) {
                expect(msgs).to.have.length(1);
                cb();
            });
        });

        it('should not run hooks when not asked to by int reason', function (cb) {
            callCrash([0, 'no'], function (code, msgs) {
                expect(msgs).to.have.length(0);
                cb();
            });
        });

        it('should not run hooks when not asked to by signal reason', function (cb) {
            callCrash(['SIGINT', 'no'], function (code, msgs) {
                expect(msgs).to.have.length(0);
                cb();
            });
        });

        it('should not run hooks when not asked to by error reason', function (cb) {
            callCrash(['ERR', 'no'], function (code, msgs) {
                expect(msgs).to.have.length(0);
                cb();
            });
        });

        it('should timeout after the specified time', function (cb) {
            this.slow(1000);

            const TIME = 500;
            callCrash([0, 'timeout', TIME], function (code, msgs, start) {
                const diff = process.hrtime(start);
                const diffMs = (diff[0] * 1e3) + (diff[1] / 1e6);

                expect(diffMs).to.be.gte(TIME);
                expect(diffMs).to.be.lt(TIME * 1.5);
                cb();
            });
        });
    });

    describe('handlers', function () {
        it('should handle signals if asked to', function (cb) {
            callHandleSignal(['yes'], (code, msgs) => {
                expect(msgs).to.have.length(1);
                cb();
            });
        });

        it('should not handle signals if not asked to', function (cb) {
            callHandleSignal(['no'], (code, msgs) => {
                expect(msgs).to.have.length(0);
                cb();
            });
        });

        it('should handle uncaught exceptions if asked to', function (cb) {
            callHandleException(['yes'], (code, msgs) => {
                expect(msgs).to.have.length(1);
                cb();
            });
        });

        it('should not handle uncaught exceptions if not asked to', function (cb) {
            callHandleException(['no'], (code, msgs) => {
                expect(msgs).to.have.length(0);
                cb();
            });
        });

        it('should handle unhandled rejections if asked to', function (cb) {
            callHandleRejections(['yes'], (code, msgs) => {
                expect(msgs).to.have.length(1);
                cb();
            });
        });

        it('should not handle unhandled rejections if not asked to', function (cb) {
            callHandleRejections(['no'], (code, msgs) => {
                expect(msgs).to.have.length(0);
                cb();
            });
        });
    })
});
