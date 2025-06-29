"use strict";
/**
 * Lightweight Test Framework for Obsidian Plugin Testing
 * Provides Jest-like API for automated testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestFramework = void 0;
class TestFramework {
    constructor() {
        this.currentSuite = '';
        this.suites = new Map();
        this.beforeEachHook = null;
        this.afterEachHook = null;
    }
    describe(suiteName, callback) {
        this.currentSuite = suiteName;
        this.suites.set(suiteName, {
            name: suiteName,
            tests: [],
            passed: 0,
            failed: 0,
            totalDuration: 0
        });
        callback();
    }
    beforeEach(callback) {
        this.beforeEachHook = callback;
    }
    afterEach(callback) {
        this.afterEachHook = callback;
    }
    test(testName, callback) {
        var _a, _b;
        const suite = this.suites.get(this.currentSuite);
        if (!suite) {
            throw new Error(`No test suite found for ${this.currentSuite}`);
        }
        const startTime = performance.now();
        let testResult;
        try {
            // Run hooks
            (_a = this.beforeEachHook) === null || _a === void 0 ? void 0 : _a.call(this);
            // Run test (handle both sync and async)
            const result = callback();
            if (result instanceof Promise) {
                result.then(() => {
                    var _a;
                    (_a = this.afterEachHook) === null || _a === void 0 ? void 0 : _a.call(this);
                }).catch((error) => {
                    console.error(`Async test ${testName} failed:`, error);
                });
                return; // Skip sync processing for async tests
            }
            (_b = this.afterEachHook) === null || _b === void 0 ? void 0 : _b.call(this);
            const duration = performance.now() - startTime;
            testResult = {
                name: testName,
                passed: true,
                duration
            };
            suite.passed++;
        }
        catch (error) {
            const duration = performance.now() - startTime;
            testResult = {
                name: testName,
                passed: false,
                error: error instanceof Error ? error.message : String(error),
                duration
            };
            suite.failed++;
        }
        suite.tests.push(testResult);
        suite.totalDuration += testResult.duration;
    }
    expect(actual) {
        return new ExpectAPI(actual);
    }
    runAllTests() {
        const summary = {
            totalSuites: this.suites.size,
            totalTests: 0,
            totalPassed: 0,
            totalFailed: 0,
            totalDuration: 0,
            suites: Array.from(this.suites.values())
        };
        for (const suite of summary.suites) {
            summary.totalTests += suite.tests.length;
            summary.totalPassed += suite.passed;
            summary.totalFailed += suite.failed;
            summary.totalDuration += suite.totalDuration;
        }
        return summary;
    }
    printResults() {
        const summary = this.runAllTests();
        console.log('\n🧪 AUTOMATED TEST RESULTS\n');
        console.log('═'.repeat(60));
        for (const suite of summary.suites) {
            const status = suite.failed === 0 ? '✅' : '❌';
            console.log(`\n${status} ${suite.name}`);
            console.log(`   Tests: ${suite.tests.length} | Passed: ${suite.passed} | Failed: ${suite.failed}`);
            console.log(`   Duration: ${suite.totalDuration.toFixed(2)}ms`);
            // Show failed tests
            for (const test of suite.tests) {
                if (!test.passed) {
                    console.log(`   ❌ ${test.name}: ${test.error}`);
                }
            }
        }
        console.log('\n' + '═'.repeat(60));
        console.log(`📊 SUMMARY`);
        console.log(`   Suites: ${summary.totalSuites}`);
        console.log(`   Tests: ${summary.totalTests}`);
        console.log(`   Passed: ${summary.totalPassed} ✅`);
        console.log(`   Failed: ${summary.totalFailed} ${summary.totalFailed > 0 ? '❌' : '✅'}`);
        console.log(`   Duration: ${summary.totalDuration.toFixed(2)}ms`);
        console.log(`   Success Rate: ${((summary.totalPassed / summary.totalTests) * 100).toFixed(1)}%`);
        if (summary.totalFailed === 0) {
            console.log('\n🎉 ALL TESTS PASSED! Plugin ready for production.');
        }
        else {
            console.log(`\n⚠️  ${summary.totalFailed} tests failed. Please fix issues before deployment.`);
        }
    }
}
exports.TestFramework = TestFramework;
class ExpectAPI {
    constructor(actual) {
        this.actual = actual;
    }
    toBe(expected) {
        if (this.actual !== expected) {
            throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(this.actual)}`);
        }
    }
    toEqual(expected) {
        if (JSON.stringify(this.actual) !== JSON.stringify(expected)) {
            throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(this.actual)}`);
        }
    }
    toContain(expected) {
        if (typeof this.actual !== 'string' || !this.actual.includes(expected)) {
            throw new Error(`Expected "${this.actual}" to contain "${expected}"`);
        }
    }
    toBeGreaterThan(expected) {
        if (typeof this.actual !== 'number' || this.actual <= expected) {
            throw new Error(`Expected ${this.actual} to be greater than ${expected}`);
        }
    }
    toBeLessThan(expected) {
        if (typeof this.actual !== 'number' || this.actual >= expected) {
            throw new Error(`Expected ${this.actual} to be less than ${expected}`);
        }
    }
    toBeDefined() {
        if (this.actual === undefined || this.actual === null) {
            throw new Error(`Expected value to be defined, got ${this.actual}`);
        }
    }
    toThrow(expectedError) {
        if (typeof this.actual !== 'function') {
            throw new Error('Expected a function that throws');
        }
        let threwError = false;
        let actualError = '';
        try {
            this.actual();
        }
        catch (error) {
            threwError = true;
            actualError = error instanceof Error ? error.message : String(error);
        }
        if (!threwError) {
            throw new Error('Expected function to throw an error');
        }
        if (expectedError && !actualError.includes(expectedError)) {
            throw new Error(`Expected error containing "${expectedError}", got "${actualError}"`);
        }
    }
    get not() {
        return {
            toBe: (expected) => {
                if (this.actual === expected) {
                    throw new Error(`Expected ${JSON.stringify(this.actual)} not to be ${JSON.stringify(expected)}`);
                }
            },
            toContain: (expected) => {
                if (typeof this.actual === 'string' && this.actual.includes(expected)) {
                    throw new Error(`Expected "${this.actual}" not to contain "${expected}"`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(this.actual) === JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(this.actual)} not to equal ${JSON.stringify(expected)}`);
                }
            },
            toThrow: (expectedError) => {
                if (typeof this.actual !== 'function') {
                    throw new Error('Expected a function that does not throw');
                }
                let threwError = false;
                let actualError = '';
                try {
                    this.actual();
                }
                catch (error) {
                    threwError = true;
                    actualError = error instanceof Error ? error.message : String(error);
                }
                if (threwError) {
                    if (expectedError && actualError.includes(expectedError)) {
                        throw new Error(`Expected function not to throw error containing "${expectedError}", but it threw "${actualError}"`);
                    }
                    else if (!expectedError) {
                        throw new Error(`Expected function not to throw, but it threw: ${actualError}`);
                    }
                }
            }
        };
    }
}
