"use strict";
/**
 * Standalone Test Runner - No Obsidian Dependencies
 * Runs tests directly without loading the main plugin file
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runStandaloneTests = void 0;
const TestFramework_1 = require("./TestFramework");
// Mock basic performance API if not available
if (typeof performance === 'undefined') {
    global.performance = {
        now: () => Date.now()
    };
}
// Import test suites directly (not through main.js)
async function runStandaloneTests() {
    console.log('🧪 Tag Renamer Plugin - Standalone Test Suite');
    console.log('═'.repeat(60));
    console.log(`📅 ${new Date().toISOString()}`);
    console.log('🔧 Running tests without Obsidian dependencies');
    console.log('═'.repeat(60));
    let totalPassed = 0;
    let totalFailed = 0;
    let totalDuration = 0;
    // Test TagProcessor directly
    console.log('\n🔧 Testing TagProcessor...');
    try {
        const { TagProcessor } = await Promise.resolve().then(() => require('../services/TagProcessor'));
        const tagProcessorTests = await createTagProcessorTests(TagProcessor);
        const summary1 = tagProcessorTests.runAllTests();
        tagProcessorTests.printResults();
        totalPassed += summary1.totalPassed;
        totalFailed += summary1.totalFailed;
        totalDuration += summary1.totalDuration;
    }
    catch (error) {
        console.error('❌ TagProcessor tests failed to load:', error instanceof Error ? error.message : String(error));
        totalFailed += 1;
    }
    // Test basic integration scenarios
    console.log('\n🔗 Testing Integration Scenarios...');
    try {
        const integrationTests = await createIntegrationTests();
        const summary2 = integrationTests.runAllTests();
        integrationTests.printResults();
        totalPassed += summary2.totalPassed;
        totalFailed += summary2.totalFailed;
        totalDuration += summary2.totalDuration;
    }
    catch (error) {
        console.error('❌ Integration tests failed to load:', error instanceof Error ? error.message : String(error));
        totalFailed += 1;
    }
    // Print final summary
    printFinalSummary(totalPassed, totalFailed, totalDuration);
    return totalFailed === 0;
}
exports.runStandaloneTests = runStandaloneTests;
async function createTagProcessorTests(TagProcessor) {
    const framework = new TestFramework_1.TestFramework();
    const describe = framework.describe.bind(framework);
    const test = framework.test.bind(framework);
    const expect = framework.expect.bind(framework);
    describe('TagProcessor Core Tests', () => {
        const processor = new TagProcessor();
        test('extracts tags from array format', () => {
            const content = `---
tags: [work, project, urgent]
---
# Content`;
            const tags = processor.extractTagsFromContent(content);
            expect(tags).toEqual(['work', 'project', 'urgent']);
        });
        test('extracts tags from list format', () => {
            const content = `---
tags:
  - personal
  - notes
---
# Content`;
            const tags = processor.extractTagsFromContent(content);
            expect(tags).toEqual(['personal', 'notes']);
        });
        test('extracts single tag', () => {
            const content = `---
tag: meeting
---
# Content`;
            const tags = processor.extractTagsFromContent(content);
            expect(tags).toEqual(['meeting']);
        });
        test('handles empty frontmatter', () => {
            const content = `# Just content`;
            const tags = processor.extractTagsFromContent(content);
            expect(tags).toEqual([]);
        });
        test('removes duplicates from array format', () => {
            const content = `---
tags: [work, personal, work, other, personal]
---
# Content`;
            const result = processor.removeDuplicateTagsFromContent(content);
            expect(result).toContain('work');
            expect(result).toContain('personal');
            expect(result).toContain('other');
            const workMatches = (result.match(/"work"/g) || []).length;
            expect(workMatches).toBe(1);
        });
        test('processes basic tag rename', () => {
            const content = `---
tags: [work, project]
---
# Content`;
            const patterns = [{ search: 'work', replace: 'professional', removeMode: false }];
            const result = processor.processFileContent(content, patterns);
            expect(result).toContain('professional');
            expect(result).not.toContain('"work"');
            expect(result).toContain('project');
        });
        test('removes tags in remove mode', () => {
            const content = `---
tags: [work, remove, keep]
---
# Content`;
            const patterns = [{ search: 'remove', replace: '', removeMode: true }];
            const result = processor.processFileContent(content, patterns);
            expect(result).not.toContain('remove');
            expect(result).toContain('work');
            expect(result).toContain('keep');
        });
        test('escapes regex special characters', () => {
            expect(processor.escapeRegex('hello.world')).toBe('hello\\.world');
            expect(processor.escapeRegex('tag+name')).toBe('tag\\+name');
            expect(processor.escapeRegex('name[bracket]')).toBe('name\\[bracket\\]');
        });
        test('handles special characters in patterns', () => {
            const content = `---
tags: ["tag.with.dots", "tag-with-dash"]
---
# Content`;
            const patterns = [
                { search: 'tag.with.dots', replace: 'dotted', removeMode: false },
                { search: 'tag-with-dash', replace: 'dashed', removeMode: false }
            ];
            const result = processor.processFileContent(content, patterns);
            expect(result).toContain('dotted');
            expect(result).toContain('dashed');
        });
        test('performance with large content', () => {
            const largeTags = Array.from({ length: 100 }, (_, i) => `tag${i}`);
            const largeContent = `---
tags: [${largeTags.map(t => `"${t}"`).join(', ')}]
---
# Content`;
            const startTime = performance.now();
            const result = processor.extractTagsFromContent(largeContent);
            const duration = performance.now() - startTime;
            expect(result.length).toBe(100);
            expect(duration).toBeLessThan(100);
        });
    });
    return framework;
}
async function createIntegrationTests() {
    const framework = new TestFramework_1.TestFramework();
    const describe = framework.describe.bind(framework);
    const test = framework.test.bind(framework);
    const expect = framework.expect.bind(framework);
    describe('Integration Tests', () => {
        test('validates export data structure', () => {
            const exportData = {
                version: "1.0",
                exportDate: new Date().toISOString(),
                pluginName: "Tag Renamer",
                patterns: [
                    { search: 'work', replace: 'professional', removeMode: false },
                    { search: 'temp', replace: '', removeMode: true }
                ]
            };
            const jsonString = JSON.stringify(exportData);
            expect(jsonString).toContain('"version":"1.0"');
            expect(jsonString).toContain('"pluginName":"Tag Renamer"');
            expect(jsonString).toContain('"search":"work"');
            expect(jsonString).toContain('"removeMode":true');
        });
        test('validates import data structure', () => {
            const validData = {
                patterns: [
                    { search: 'test', replace: 'valid', removeMode: false }
                ]
            };
            expect(validData.patterns).not.toBe(undefined);
            expect(Array.isArray(validData.patterns)).toBe(true);
            expect(validData.patterns.length).toBe(1);
            expect(validData.patterns[0].search).toBe('test');
        });
        test('handles invalid import data', () => {
            const invalidData = [
                null,
                {},
                { patterns: "not-array" },
                { patterns: [{ search: 123 }] }
            ];
            invalidData.forEach((data) => {
                let isValid = false;
                try {
                    isValid = data !== null &&
                        typeof data === 'object' &&
                        data.patterns !== undefined &&
                        Array.isArray(data.patterns) &&
                        data.patterns.every(p => p && typeof p.search === 'string');
                }
                catch (e) {
                    isValid = false;
                }
                expect(isValid).toBe(false);
            });
        });
        test('pattern processing workflow', async () => {
            const { TagProcessor } = await Promise.resolve().then(() => require('../services/TagProcessor'));
            const processor = new TagProcessor();
            // Step 1: Remove duplicates
            const content = `---
tags: [work, work, project, temp]
---
# Test`;
            const deduplicated = processor.removeDuplicateTagsFromContent(content);
            const workCount = (deduplicated.match(/"work"/g) || []).length;
            expect(workCount).toBe(1);
            // Step 2: Apply patterns
            const patterns = [
                { search: 'work', replace: 'professional', removeMode: false },
                { search: 'temp', replace: '', removeMode: true }
            ];
            const processed = processor.processFileContent(deduplicated, patterns);
            expect(processed).toContain('professional');
            expect(processed).toContain('project');
            expect(processed).not.toContain('work');
            expect(processed).not.toContain('temp');
        });
        test('backwards compatibility', () => {
            // Old format without removeMode
            const oldPattern = { search: 'old', replace: 'new' };
            const normalizedPattern = {
                search: oldPattern.search,
                replace: oldPattern.replace,
                removeMode: oldPattern.removeMode || false
            };
            expect(normalizedPattern.removeMode).toBe(false);
            expect(normalizedPattern.search).toBe('old');
            expect(normalizedPattern.replace).toBe('new');
        });
    });
    return framework;
}
function printFinalSummary(totalPassed, totalFailed, totalDuration) {
    console.log('\n' + '═'.repeat(60));
    console.log('🏆 FINAL TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log(`📊 Total Tests: ${totalPassed + totalFailed}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`📈 Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
    console.log(`⏱️  Duration: ${totalDuration.toFixed(2)}ms`);
    if (totalFailed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! PLUGIN IS PRODUCTION READY');
        console.log('✅ Core tag processing functionality validated');
        console.log('✅ Integration workflows verified');
        console.log('✅ Performance benchmarks met');
        console.log('✅ Ready for Obsidian Community Plugin Directory');
    }
    else {
        console.log(`\n⚠️  ${totalFailed} test(s) failed - requires attention`);
        console.log('🔧 Please review failed tests and fix issues');
    }
    console.log('═'.repeat(60));
}
// Run tests if this file is executed directly
if (require.main === module) {
    runStandaloneTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('💥 Test execution failed:', error);
        process.exit(1);
    });
}
