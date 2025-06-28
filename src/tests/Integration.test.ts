/**
 * Integration Tests for Tag Renamer Plugin
 * Tests complete workflows and component interactions
 */

import { TagProcessor } from '../services/TagProcessor';
import { RenamePattern, ImportValidationResult, ImportResult, ExportData } from '../types/interfaces';
import { TestFramework } from './TestFramework';

const framework = new TestFramework();
const { describe, test, expect } = framework;

// Mock plugin class for integration testing
class MockTagRenamerPlugin {
    settings = { renamePatterns: [] as RenamePattern[] };
    private tagProcessor = new TagProcessor();

    exportPatternsToJson(): string {
        const exportData: ExportData = {
            version: "1.0",
            exportDate: new Date().toISOString(),
            pluginName: "Tag Renamer",
            patterns: this.settings.renamePatterns
        };
        return JSON.stringify(exportData, null, 2);
    }

    validateImportData(data: any): ImportValidationResult {
        if (!data || typeof data !== 'object') {
            return { valid: false, error: 'Invalid JSON format' };
        }

        if (!data.patterns || !Array.isArray(data.patterns)) {
            return { valid: false, error: 'Missing or invalid patterns array' };
        }

        for (let i = 0; i < data.patterns.length; i++) {
            const pattern = data.patterns[i];
            if (!pattern || typeof pattern !== 'object') {
                return { valid: false, error: `Pattern ${i + 1} is invalid` };
            }
            if (typeof pattern.search !== 'string' || typeof pattern.replace !== 'string') {
                return { valid: false, error: `Pattern ${i + 1} must have search and replace strings` };
            }
            if (pattern.removeMode !== undefined && typeof pattern.removeMode !== 'boolean') {
                return { valid: false, error: `Pattern ${i + 1} removeMode must be boolean` };
            }
        }

        return { valid: true };
    }

    importPatternsFromJson(jsonString: string, mergeMode: boolean = false): ImportResult {
        try {
            const data = JSON.parse(jsonString);
            const validation = this.validateImportData(data);
            
            if (!validation.valid) {
                return { success: false, error: validation.error };
            }

            const importedPatterns: RenamePattern[] = data.patterns.map((pattern: any) => ({
                search: pattern.search,
                replace: pattern.replace,
                removeMode: pattern.removeMode || false
            }));
            
            if (mergeMode) {
                this.settings.renamePatterns.push(...importedPatterns);
            } else {
                this.settings.renamePatterns = importedPatterns;
            }

            return { success: true, imported: importedPatterns.length };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: 'Invalid JSON format: ' + errorMessage };
        }
    }

    processContent(content: string): string {
        const validPatterns = this.settings.renamePatterns.filter(p => 
            p.search && (p.removeMode || p.replace)
        );
        return this.tagProcessor.processFileContent(content, validPatterns);
    }
}

describe('Tag Renamer Integration Tests', () => {
    test('complete workflow: pattern creation -> processing -> export/import', () => {
        const plugin = new MockTagRenamerPlugin();

        // Step 1: Create patterns
        plugin.settings.renamePatterns = [
            { search: 'work', replace: 'professional', removeMode: false },
            { search: 'temp', replace: '', removeMode: true },
            { search: 'urgent', replace: 'important', removeMode: false }
        ];

        // Step 2: Process content
        const testContent = `---
tags: [work, project, temp, urgent]
title: Integration Test
---
# Test Content`;

        const result = plugin.processContent(testContent);

        // Verify processing results
        expect(result).toContain('professional');
        expect(result).toContain('important');
        expect(result).not.toContain('work');
        expect(result).not.toContain('temp');
        expect(result).not.toContain('urgent');
        expect(result).toContain('project'); // Unchanged

        // Step 3: Export patterns
        const exportedJson = plugin.exportPatternsToJson();
        expect(exportedJson).toContain('"search": "work"');
        expect(exportedJson).toContain('"replace": "professional"');
        expect(exportedJson).toContain('"removeMode": true');

        // Step 4: Import patterns (replace mode)
        const newPlugin = new MockTagRenamerPlugin();
        const importResult = newPlugin.importPatternsFromJson(exportedJson, false);
        
        expect(importResult.success).toBe(true);
        expect(importResult.imported).toBe(3);
        expect(newPlugin.settings.renamePatterns.length).toBe(3);

        // Step 5: Verify imported patterns work correctly
        const result2 = newPlugin.processContent(testContent);
        expect(result2).toBe(result); // Should produce same result
    });

    test('export/import maintains pattern integrity', () => {
        const plugin = new MockTagRenamerPlugin();

        // Create complex patterns with various types
        plugin.settings.renamePatterns = [
            { search: 'simple', replace: 'basic', removeMode: false },
            { search: 'tag-with-dash', replace: 'dashed-tag', removeMode: false },
            { search: 'tag.with.dots', replace: 'dotted-tag', removeMode: false },
            { search: 'remove-me', replace: '', removeMode: true },
            { search: 'tag with spaces', replace: 'spaced-tag', removeMode: false }
        ];

        // Export and re-import
        const exported = plugin.exportPatternsToJson();
        const newPlugin = new MockTagRenamerPlugin();
        const importResult = newPlugin.importPatternsFromJson(exported);

        expect(importResult.success).toBe(true);
        expect(newPlugin.settings.renamePatterns).toEqual(plugin.settings.renamePatterns);
    });

    test('merge mode preserves existing patterns', () => {
        const plugin = new MockTagRenamerPlugin();

        // Set initial patterns
        plugin.settings.renamePatterns = [
            { search: 'existing1', replace: 'keep1', removeMode: false },
            { search: 'existing2', replace: 'keep2', removeMode: false }
        ];

        // Create import data
        const importData = {
            version: "1.0",
            patterns: [
                { search: 'new1', replace: 'added1', removeMode: false },
                { search: 'new2', replace: '', removeMode: true }
            ]
        };

        // Import in merge mode
        const result = plugin.importPatternsFromJson(JSON.stringify(importData), true);

        expect(result.success).toBe(true);
        expect(plugin.settings.renamePatterns.length).toBe(4);
        
        // Check all patterns are present
        const searches = plugin.settings.renamePatterns.map(p => p.search);
        expect(searches).toContain('existing1');
        expect(searches).toContain('existing2');
        expect(searches).toContain('new1');
        expect(searches).toContain('new2');
    });

    test('pattern validation prevents invalid imports', () => {
        const plugin = new MockTagRenamerPlugin();

        // Test various invalid imports
        const invalidImports = [
            '{"invalid": "json"}', // Missing patterns
            '{"patterns": "not-array"}', // Patterns not array
            '{"patterns": [{"search": 123}]}', // Invalid search type
            '{"patterns": [{"search": "test"}]}', // Missing replace
            '{"patterns": [{"search": "test", "replace": "ok", "removeMode": "not-boolean"}]}' // Invalid removeMode
        ];

        invalidImports.forEach(invalid => {
            const result = plugin.importPatternsFromJson(invalid);
            expect(result.success).toBe(false);
            expect(result.error).not.toBe(undefined);
        });
    });

    test('backwards compatibility with old pattern formats', () => {
        const plugin = new MockTagRenamerPlugin();

        // Old format without removeMode field
        const oldFormat = {
            patterns: [
                { search: 'old1', replace: 'new1' },
                { search: 'old2', replace: 'new2' }
            ]
        };

        const result = plugin.importPatternsFromJson(JSON.stringify(oldFormat));
        
        expect(result.success).toBe(true);
        expect(plugin.settings.renamePatterns.length).toBe(2);
        
        // Should default removeMode to false
        plugin.settings.renamePatterns.forEach(pattern => {
            expect(pattern.removeMode).toBe(false);
        });
    });

    test('complex content processing with multiple patterns', () => {
        const plugin = new MockTagRenamerPlugin();

        plugin.settings.renamePatterns = [
            { search: 'work', replace: 'professional', removeMode: false },
            { search: 'personal', replace: 'private', removeMode: false },
            { search: 'delete', replace: '', removeMode: true },
            { search: 'urgent', replace: 'priority', removeMode: false },
            { search: 'temp', replace: '', removeMode: true }
        ];

        // Test array format
        const arrayContent = `---
tags: [work, personal, delete, urgent, temp, keep]
---
# Array Test`;

        const arrayResult = plugin.processContent(arrayContent);
        expect(arrayResult).toContain('professional');
        expect(arrayResult).toContain('private');
        expect(arrayResult).toContain('priority');
        expect(arrayResult).toContain('keep');
        expect(arrayResult).not.toContain('work');
        expect(arrayResult).not.toContain('personal');
        expect(arrayResult).not.toContain('delete');
        expect(arrayResult).not.toContain('urgent');
        expect(arrayResult).not.toContain('temp');

        // Test list format
        const listContent = `---
tags:
  - work
  - personal
  - delete
  - urgent
  - temp
  - keep
---
# List Test`;

        const listResult = plugin.processContent(listContent);
        expect(listResult).toContain('professional');
        expect(listResult).toContain('private');
        expect(listResult).toContain('priority');
        expect(listResult).toContain('keep');
        expect(listResult).not.toContain('work');
        expect(listResult).not.toContain('delete');
        expect(listResult).not.toContain('temp');

        // Test single tag
        const singleContent = `---
tag: work
---
# Single Test`;

        const singleResult = plugin.processContent(singleContent);
        expect(singleResult).toContain('tag: "professional"');
        expect(singleResult).not.toContain('tag: work');
    });

    test('error recovery and graceful degradation', () => {
        const plugin = new MockTagRenamerPlugin();

        // Set patterns including some that might cause issues
        plugin.settings.renamePatterns = [
            { search: '', replace: 'invalid', removeMode: false }, // Empty search
            { search: 'valid', replace: 'good', removeMode: false }, // Valid pattern
            { search: 'remove', replace: '', removeMode: true } // Valid remove pattern
        ];

        const content = `---
tags: [valid, remove, other]
---
# Content`;

        // Should not throw error and should process valid patterns
        expect(() => plugin.processContent(content)).not.toThrow();
        
        const result = plugin.processContent(content);
        expect(result).toContain('good'); // Valid pattern applied
        expect(result).not.toContain('remove'); // Remove pattern applied
        expect(result).toContain('other'); // Unmatched tag preserved
    });

    test('performance with large pattern sets', () => {
        const plugin = new MockTagRenamerPlugin();

        // Create many patterns
        plugin.settings.renamePatterns = Array.from({length: 100}, (_, i) => ({
            search: `tag${i}`,
            replace: `newtag${i}`,
            removeMode: i % 10 === 0 // Every 10th pattern is remove mode
        }));

        const content = `---
tags: [tag0, tag5, tag10, tag15, tag50, tag99, unmatched]
---
# Performance Test`;

        const startTime = performance.now();
        const result = plugin.processContent(content);
        const duration = performance.now() - startTime;

        // Should complete quickly even with many patterns
        expect(duration).toBeLessThan(100);
        
        // Verify some patterns were applied
        expect(result).toContain('newtag5');
        expect(result).toContain('newtag50');
        expect(result).toContain('newtag99');
        expect(result).not.toContain('tag10'); // Remove mode pattern
        expect(result).toContain('unmatched'); // Preserved
    });

    test('special character handling in integrated workflow', () => {
        const plugin = new MockTagRenamerPlugin();

        plugin.settings.renamePatterns = [
            { search: 'tag.with.dots', replace: 'dotted', removeMode: false },
            { search: 'tag-with-dash', replace: 'dashed', removeMode: false },
            { search: 'tag_with_underscore', replace: 'underscored', removeMode: false },
            { search: 'tag with spaces', replace: 'spaced', removeMode: false },
            { search: 'tag[with]brackets', replace: 'bracketed', removeMode: false }
        ];

        const content = `---
tags: ["tag.with.dots", "tag-with-dash", "tag_with_underscore", "tag with spaces", "tag[with]brackets"]
---
# Special Characters Test`;

        const result = plugin.processContent(content);
        
        expect(result).toContain('dotted');
        expect(result).toContain('dashed');
        expect(result).toContain('underscored');
        expect(result).toContain('spaced');
        expect(result).toContain('bracketed');

        // Verify original tags are gone
        expect(result).not.toContain('tag.with.dots');
        expect(result).not.toContain('tag-with-dash');
        expect(result).not.toContain('tag_with_underscore');
        expect(result).not.toContain('tag with spaces');
        expect(result).not.toContain('tag[with]brackets');
    });
});

// Cross-component interaction tests
describe('Component Integration', () => {
    test('TagProcessor and FileService work together correctly', () => {
        const tagProcessor = new TagProcessor();
        
        // Test content processing flow
        const content = `---
tags: [work, work, project, temp]
---
# Test`;

        // Step 1: Remove duplicates
        const deduplicated = tagProcessor.removeDuplicateTagsFromContent(content);
        expect(deduplicated).toContain('work');
        expect(deduplicated).toContain('project');
        expect(deduplicated).toContain('temp');
        
        // Count work tags (should be 1)
        const workCount = (deduplicated.match(/"work"/g) || []).length;
        expect(workCount).toBe(1);

        // Step 2: Apply patterns
        const patterns: RenamePattern[] = [
            { search: 'work', replace: 'professional', removeMode: false },
            { search: 'temp', replace: '', removeMode: true }
        ];

        const processed = tagProcessor.processFileContent(deduplicated, patterns);
        expect(processed).toContain('professional');
        expect(processed).toContain('project');
        expect(processed).not.toContain('work');
        expect(processed).not.toContain('temp');
    });

    test('pattern validation integrates with processing', () => {
        const plugin = new MockTagRenamerPlugin();

        // Add mix of valid and invalid patterns
        plugin.settings.renamePatterns = [
            { search: 'valid', replace: 'good', removeMode: false },
            { search: '', replace: 'bad', removeMode: false }, // Invalid: empty search
            { search: 'remove', replace: '', removeMode: true },
            { search: 'another', replace: '', removeMode: false } // Edge case: empty replace but not remove mode
        ];

        const content = `---
tags: [valid, remove, another, untouched]
---
# Content`;

        const result = plugin.processContent(content);
        
        // Valid patterns should work
        expect(result).toContain('good');
        expect(result).not.toContain('remove');
        
        // Invalid patterns should be safely ignored
        expect(result).toContain('another'); // Should remain unchanged
        expect(result).toContain('untouched');
    });
});

export { framework as IntegrationTests };