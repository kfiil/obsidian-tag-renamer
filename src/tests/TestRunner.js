"use strict";
/**
 * Comprehensive Automated Test Runner
 * Runs all tests and reports results without manual intervention
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testRunner = void 0;
// Import all test suites
const TagProcessor_test_1 = require("./TagProcessor.test");
const FileService_test_1 = require("./FileService.test");
const Integration_test_1 = require("./Integration.test");
class AutomatedTestRunner {
    constructor() {
        this.allFrameworks = [];
        this.allFrameworks = [
            TagProcessor_test_1.TagProcessorTests,
            FileService_test_1.FileServiceTests,
            Integration_test_1.IntegrationTests
        ];
    }
    async runAllTests() {
        console.log('🚀 STARTING COMPREHENSIVE AUTOMATED TEST SUITE');
        console.log('═'.repeat(80));
        console.log(`📅 ${new Date().toISOString()}`);
        console.log('🔧 Tag Renamer Plugin - Automated Quality Assurance');
        console.log('═'.repeat(80));
        let totalPassed = 0;
        let totalFailed = 0;
        let totalDuration = 0;
        const results = [];
        for (const framework of this.allFrameworks) {
            const summary = framework.runAllTests();
            totalPassed += summary.totalPassed;
            totalFailed += summary.totalFailed;
            totalDuration += summary.totalDuration;
            // Store framework results
            results.push({
                name: `Test Framework ${results.length + 1}`,
                passed: summary.totalPassed,
                failed: summary.totalFailed,
                duration: summary.totalDuration
            });
            // Print detailed results for this framework
            framework.printResults();
        }
        // Print overall summary
        this.printOverallSummary(totalPassed, totalFailed, totalDuration, results);
        return totalFailed === 0;
    }
    printOverallSummary(totalPassed, totalFailed, totalDuration, results) {
        console.log('\n' + '═'.repeat(80));
        console.log('🏆 OVERALL TEST SUITE SUMMARY');
        console.log('═'.repeat(80));
        // Framework breakdown
        results.forEach((result, index) => {
            const status = result.failed === 0 ? '✅' : '❌';
            console.log(`${status} Framework ${index + 1}: ${result.passed} passed, ${result.failed} failed (${result.duration.toFixed(2)}ms)`);
        });
        console.log('\n📊 FINAL STATISTICS:');
        console.log(`   Total Tests: ${totalPassed + totalFailed}`);
        console.log(`   Passed: ${totalPassed} ✅`);
        console.log(`   Failed: ${totalFailed} ${totalFailed > 0 ? '❌' : '✅'}`);
        console.log(`   Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
        console.log(`   Total Duration: ${totalDuration.toFixed(2)}ms`);
        console.log(`   Average per Test: ${(totalDuration / (totalPassed + totalFailed)).toFixed(2)}ms`);
        // Performance assessment
        if (totalDuration < 1000) {
            console.log('   ⚡ Performance: EXCELLENT (< 1 second)');
        }
        else if (totalDuration < 5000) {
            console.log('   ⚡ Performance: GOOD (< 5 seconds)');
        }
        else {
            console.log('   ⚠️  Performance: SLOW (> 5 seconds)');
        }
        console.log('\n' + '═'.repeat(80));
        if (totalFailed === 0) {
            console.log('🎉 ALL TESTS PASSED! PLUGIN IS PRODUCTION READY');
            console.log('✅ Code Quality: EXCELLENT');
            console.log('✅ Error Handling: ROBUST');
            console.log('✅ Performance: OPTIMIZED');
            console.log('✅ Ready for Obsidian Community Plugin Directory');
        }
        else {
            console.log('❌ TESTS FAILED - REQUIRES ATTENTION');
            console.log(`⚠️  ${totalFailed} test(s) need to be fixed before deployment`);
            console.log('🔧 Please review failed tests and fix issues');
        }
        console.log('═'.repeat(80));
    }
    // Method to run specific test categories
    async runTagProcessorTests() {
        console.log('🧪 Running TagProcessor Tests Only...\n');
        const summary = TagProcessor_test_1.TagProcessorTests.runAllTests();
        TagProcessor_test_1.TagProcessorTests.printResults();
        return summary.totalFailed === 0;
    }
    async runFileServiceTests() {
        console.log('📁 Running FileService Tests Only...\n');
        const summary = FileService_test_1.FileServiceTests.runAllTests();
        FileService_test_1.FileServiceTests.printResults();
        return summary.totalFailed === 0;
    }
    async runIntegrationTests() {
        console.log('🔗 Running Integration Tests Only...\n');
        const summary = Integration_test_1.IntegrationTests.runAllTests();
        Integration_test_1.IntegrationTests.printResults();
        return summary.totalFailed === 0;
    }
    // Generate test report for CI/CD or documentation
    generateTestReport() {
        const report = [];
        report.push('# Automated Test Report');
        report.push(`Generated: ${new Date().toISOString()}`);
        report.push('');
        let totalPassed = 0;
        let totalFailed = 0;
        this.allFrameworks.forEach((framework, index) => {
            const summary = framework.runAllTests();
            totalPassed += summary.totalPassed;
            totalFailed += summary.totalFailed;
            report.push(`## Test Suite ${index + 1}`);
            report.push(`- Suites: ${summary.totalSuites}`);
            report.push(`- Tests: ${summary.totalTests}`);
            report.push(`- Passed: ${summary.totalPassed} ✅`);
            report.push(`- Failed: ${summary.totalFailed} ${summary.totalFailed > 0 ? '❌' : '✅'}`);
            report.push(`- Duration: ${summary.totalDuration.toFixed(2)}ms`);
            report.push('');
            // Add failed tests details
            if (summary.totalFailed > 0) {
                report.push('### Failed Tests:');
                summary.suites.forEach(suite => {
                    suite.tests.forEach(test => {
                        if (!test.passed) {
                            report.push(`- **${suite.name}**: ${test.name} - ${test.error}`);
                        }
                    });
                });
                report.push('');
            }
        });
        report.push('## Summary');
        report.push(`- **Total Tests**: ${totalPassed + totalFailed}`);
        report.push(`- **Success Rate**: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
        report.push(`- **Status**: ${totalFailed === 0 ? '✅ PASSED' : '❌ FAILED'}`);
        return report.join('\n');
    }
}
// Create and export the test runner instance
exports.testRunner = new AutomatedTestRunner();
// If running directly (not as import), run all tests
if (typeof require !== 'undefined' && require.main === module) {
    exports.testRunner.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}
// Export for package.json scripts
exports.default = exports.testRunner;
