#!/usr/bin/env node

/**
 * Simple test runner script for Tag Renamer Plugin
 * Executes the automated test suite and reports results
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🧪 Tag Renamer Plugin - Automated Test Runner');
console.log('═'.repeat(60));

// Check if built files exist
if (!fs.existsSync('./main.js')) {
    console.log('📦 Building plugin first...');
    try {
        execSync('npm run build', { stdio: 'inherit' });
        console.log('✅ Build completed successfully');
    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
} else {
    console.log('✅ Plugin already built');
}

console.log('\n🚀 Starting automated tests...\n');

try {
    // Import and run tests
    require('./main.js');
    const { testRunner } = require('./src/tests/TestRunner.js');
    
    testRunner.runAllTests().then(success => {
        if (success) {
            console.log('\n✅ All tests passed! Plugin is ready for deployment.');
            process.exit(0);
        } else {
            console.log('\n❌ Some tests failed. Please fix issues before deployment.');
            process.exit(1);
        }
    }).catch(error => {
        console.error('\n💥 Test execution failed:', error.message);
        process.exit(1);
    });
} catch (error) {
    console.error('💥 Failed to load test framework:', error.message);
    console.log('\n🔧 Try running: npm run build');
    process.exit(1);
}