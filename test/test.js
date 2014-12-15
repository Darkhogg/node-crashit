var cp = require('child_process');

var expect = require('chai').expect;
var describe = require('mocha').describe,
    it       = require('mocha').it;


function callCrash (args, cb) {
    var p = cp.fork('test/_crash1.js', args);
    var messages = [];
    p.on('message', function (data) {
        messages.push(data);
    });
    p.on('exit', function (code) {
        cb(code, messages);
    });
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

    it('should run hooks when asked to', function (cb) {
        callCrash([0, 'yes'], function (code, msgs) {
            expect(msgs).to.have.length(1);
            cb();
        });
    });

    it('should not run hooks when not asked to', function (cb) {
        callCrash([0, 'no'], function (code, msgs) {
            expect(msgs).to.have.length(0);
            cb();
        });
    });

    it('should give hooks the crash reason');

    it('should timeout after the specified time');

});
