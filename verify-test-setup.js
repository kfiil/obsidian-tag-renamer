#!/usr/bin/env node

/**
 * Test Setup Verification Script for Tag Renamer Plugin
 * Verifies that all test files are created correctly
 */

const fs = require('fs');
const path = require('path');

const testVaultPath = './test-vault';
const expectedFiles = [
    'array-format.md',
    'list-format.md', 
    'single-tag.md',
    'mixed-quotes.md',
    'duplicates.md',
    'list-duplicates.md',
    'no-frontmatter.md',
    'empty-tags.md',
    'special-characters.md',
    'malformed-frontmatter.md',
    'Folder A/nested-file.md',
    'Folder A/Subfolder/deep-nested.md',
    'Folder B/another-file.md'
];

console.log('🧪 Tag Renamer Plugin - Test Setup Verification\n');

// Check if test vault exists
if (!fs.existsSync(testVaultPath)) {
    console.error('❌ Test vault directory not found');
    console.error(`Expected: ${path.resolve(testVaultPath)}`);
    process.exit(1);
}

console.log('✅ Test vault directory exists');

// Check each expected file
let missingFiles = [];
let validFiles = 0;

expectedFiles.forEach(filePath => {
    const fullPath = path.join(testVaultPath, filePath);
    if (fs.existsSync(fullPath)) {
        validFiles++;
        
        // Read and validate content
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('---') && content.length > 50) {
            console.log(`✅ ${filePath}`);
        } else {
            console.log(`⚠️  ${filePath} (content may be incomplete)`);
        }
    } else {
        missingFiles.push(filePath);
        console.log(`❌ ${filePath} - MISSING`);
    }
});

// Check Large Test folder
const largeTestPath = path.join(testVaultPath, 'Large Test');
if (fs.existsSync(largeTestPath)) {
    const largeTestFiles = fs.readdirSync(largeTestPath).filter(f => f.endsWith('.md'));
    console.log(`✅ Large Test folder: ${largeTestFiles.length} performance test files`);
    
    if (largeTestFiles.length < 40) {
        console.log('⚠️  Fewer than 40 performance test files found');
    }
} else {
    console.log('❌ Large Test folder missing');
    missingFiles.push('Large Test/');
}

// Summary
console.log(`\n📊 Test Setup Summary:`);
console.log(`✅ Valid files: ${validFiles}/${expectedFiles.length}`);
console.log(`❌ Missing files: ${missingFiles.length}`);

if (missingFiles.length > 0) {
    console.log('\n❌ Missing files:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
}

// Check for test patterns file
const patternsFile = './test-patterns.json';
if (fs.existsSync(patternsFile)) {
    try {
        const patterns = JSON.parse(fs.readFileSync(patternsFile, 'utf8'));
        console.log(`✅ Test patterns file: ${patterns.patterns.length} patterns`);
    } catch (e) {
        console.log('❌ Test patterns file is invalid JSON');
    }
} else {
    console.log('⚠️  Test patterns file not found');
}

// Final verdict
if (missingFiles.length === 0 && validFiles >= expectedFiles.length) {
    console.log('\n🎉 Test setup is complete and ready for testing!');
    console.log('\nNext steps:');
    console.log('1. Copy test-vault to your Obsidian vaults directory');
    console.log('2. Open the vault in Obsidian');  
    console.log('3. Enable the Tag Renamer plugin');
    console.log('4. Follow TESTING-INSTRUCTIONS.md');
    process.exit(0);
} else {
    console.log('\n⚠️  Test setup incomplete - please create missing files');
    process.exit(1);
}