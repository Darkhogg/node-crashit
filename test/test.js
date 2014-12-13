var cp = require('child_process');

var expect = require('chai').expect;
var describe = require('mocha').describe,
    it       = require('mocha').it;


function callCrash (args, cb) {
    var p = cp.fork('test/_crash1.js', args);
    p.on('exit', cb);
}


describe('Crashing', function () {
    this.slow(250); // Forking is slow, but that's not an issue

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
});

describe('Hooks', function () {
    it('should run hooks when asked to');
    it('should not run hooks when not asked to');
    it('should timeout after the specified time');
    it('should exit with 171 when timed out');
});

describe('Signals', function () {

});
