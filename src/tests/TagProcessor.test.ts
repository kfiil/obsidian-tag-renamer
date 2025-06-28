/**
 * Unit Tests for TagProcessor Service
 * Run these tests to verify core functionality before manual testing
 */

import { TagProcessor } from '../services/TagProcessor';
import { RenamePattern } from '../types/interfaces';

// Mock test class (would use Jest or similar in real implementation)
class TestRunner {
    private tests: Array<{name: string, fn: () => void}> = [];
    private passed = 0;
    private failed = 0;

    test(name: string, fn: () => void) {
        this.tests.push({name, fn});
    }

    expect(actual: any) {
        return {
            toBe: (expected: any) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, got ${actual}`);
                }
            },
            toEqual: (expected: any) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
                }
            },
            toContain: (expected: string) => {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected "${actual}" to contain "${expected}"`);
                }
            },
            not: {
                toContain: (expected: string) => {
                    if (actual.includes(expected)) {
                        throw new Error(`Expected "${actual}" not to contain "${expected}"`);
                    }
                }
            }
        };
    }

    run() {
        console.log('🧪 Running TagProcessor Unit Tests\n');
        
        this.tests.forEach(test => {
            try {
                test.fn();
                console.log(`✅ ${test.name}`);
                this.passed++;
            } catch (error) {
                console.log(`❌ ${test.name}: ${error.message}`);
                this.failed++;
            }
        });

        console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`);
        return this.failed === 0;
    }
}

// Test suite
const test = new TestRunner();
const processor = new TagProcessor();

// ===== TAG EXTRACTION TESTS =====
test.test('Extract tags from array format', () => {
    const content = `---
tags: [work, project, urgent]
title: Test
---
# Content`;
    
    const tags = processor.extractTagsFromContent(content);
    test.expect(tags).toEqual(['work', 'project', 'urgent']);
});

test.test('Extract tags from list format', () => {
    const content = `---
tags:
  - personal
  - notes
  - important
---
# Content`;
    
    const tags = processor.extractTagsFromContent(content);
    test.expect(tags).toEqual(['personal', 'notes', 'important']);
});

test.test('Extract single tag', () => {
    const content = `---
tag: meeting
title: Test
---
# Content`;
    
    const tags = processor.extractTagsFromContent(content);
    test.expect(tags).toEqual(['meeting']);
});

test.test('Extract tags with quotes', () => {
    const content = `---
tags: ["quoted", 'single', unquoted]
---
# Content`;
    
    const tags = processor.extractTagsFromContent(content);
    test.expect(tags).toEqual(['quoted', 'single', 'unquoted']);
});

test.test('Handle no frontmatter', () => {
    const content = `# Just Content
No frontmatter here`;
    
    const tags = processor.extractTagsFromContent(content);
    test.expect(tags).toEqual([]);
});

test.test('Handle empty tags array', () => {
    const content = `---
tags: []
---
# Content`;
    
    const tags = processor.extractTagsFromContent(content);
    test.expect(tags).toEqual([]);
});

// ===== DUPLICATE REMOVAL TESTS =====
test.test('Remove duplicates from array format', () => {
    const content = `---
tags: [work, personal, work, other, personal]
---
# Content`;
    
    const result = processor.removeDuplicateTagsFromContent(content);
    test.expect(result).toContain('tags: ["work", "personal", "other"]');
});

test.test('Remove duplicates from list format', () => {
    const content = `---
tags:
  - repeat
  - once
  - repeat
  - twice
---
# Content`;
    
    const result = processor.removeDuplicateTagsFromContent(content);
    test.expect(result).toContain('- "repeat"');
    test.expect(result).toContain('- "once"');
    test.expect(result).toContain('- "twice"');
    // Should not contain duplicate entries
    const repeatCount = (result.match(/- "repeat"/g) || []).length;
    test.expect(repeatCount).toBe(1);
});

test.test('No change when no duplicates', () => {
    const content = `---
tags: [unique, different, separate]
---
# Content`;
    
    const result = processor.removeDuplicateTagsFromContent(content);
    test.expect(result).toBe(content); // Should be unchanged
});

// ===== TAG PROCESSING TESTS =====
test.test('Basic tag rename', () => {
    const content = `---
tags: [work, project, personal]
---
# Content`;
    
    const patterns: RenamePattern[] = [
        { search: 'work', replace: 'professional', removeMode: false }
    ];
    
    const result = processor.processFileContent(content, patterns);
    test.expect(result).toContain('professional');
    test.expect(result).not.toContain('"work"');
    test.expect(result).toContain('project');
});

test.test('Tag removal', () => {
    const content = `---
tags: [keep, remove, other]
---
# Content`;
    
    const patterns: RenamePattern[] = [
        { search: 'remove', replace: '', removeMode: true }
    ];
    
    const result = processor.processFileContent(content, patterns);
    test.expect(result).not.toContain('remove');
    test.expect(result).toContain('keep');
    test.expect(result).toContain('other');
});

test.test('Multiple patterns', () => {
    const content = `---
tags: [work, proj, temp, urgent]
---
# Content`;
    
    const patterns: RenamePattern[] = [
        { search: 'work', replace: 'professional', removeMode: false },
        { search: 'proj', replace: 'project', removeMode: false },
        { search: 'temp', replace: '', removeMode: true },
        { search: 'urgent', replace: 'important', removeMode: false }
    ];
    
    const result = processor.processFileContent(content, patterns);
    test.expect(result).toContain('professional');
    test.expect(result).toContain('project');
    test.expect(result).toContain('important');
    test.expect(result).not.toContain('work');
    test.expect(result).not.toContain('proj');
    test.expect(result).not.toContain('temp');
    test.expect(result).not.toContain('urgent');
});

test.test('Exact match only - regex escaping', () => {
    const content = `---
tags: [work, workflow, work.done]
---
# Content`;
    
    const patterns: RenamePattern[] = [
        { search: 'work', replace: 'professional', removeMode: false }
    ];
    
    const result = processor.processFileContent(content, patterns);
    test.expect(result).toContain('professional');
    test.expect(result).toContain('workflow'); // Should NOT be changed
    test.expect(result).toContain('work.done'); // Should NOT be changed
});

test.test('Special characters in tags', () => {
    const content = `---
tags: ["tag-with-dash", "tag_with_underscore", "tag.with.dots"]
---
# Content`;
    
    const patterns: RenamePattern[] = [
        { search: 'tag-with-dash', replace: 'dash-tag', removeMode: false },
        { search: 'tag.with.dots', replace: 'dot-tag', removeMode: false }
    ];
    
    const result = processor.processFileContent(content, patterns);
    test.expect(result).toContain('dash-tag');
    test.expect(result).toContain('dot-tag');
    test.expect(result).toContain('tag_with_underscore'); // Unchanged
});

test.test('Process single tag format', () => {
    const content = `---
tag: oldtag
title: Test
---
# Content`;
    
    const patterns: RenamePattern[] = [
        { search: 'oldtag', replace: 'newtag', removeMode: false }
    ];
    
    const result = processor.processFileContent(content, patterns);
    test.expect(result).toContain('tag: "newtag"');
    test.expect(result).not.toContain('oldtag');
});

test.test('Remove single tag completely', () => {
    const content = `---
tag: removeme
title: Test
---
# Content`;
    
    const patterns: RenamePattern[] = [
        { search: 'removeme', replace: '', removeMode: true }
    ];
    
    const result = processor.processFileContent(content, patterns);
    test.expect(result).not.toContain('tag: removeme');
    test.expect(result).not.toContain('removeme');
    test.expect(result).toContain('title: Test'); // Other frontmatter preserved
});

test.test('No change when no matches', () => {
    const content = `---
tags: [nomatch, different, other]
---
# Content`;
    
    const patterns: RenamePattern[] = [
        { search: 'nonexistent', replace: 'something', removeMode: false }
    ];
    
    const result = processor.processFileContent(content, patterns);
    test.expect(result).toBe(content); // Should be unchanged
});

// ===== REGEX ESCAPING TESTS =====
test.test('Escape regex special characters', () => {
    test.expect(processor.escapeRegex('hello.world')).toBe('hello\\.world');
    test.expect(processor.escapeRegex('tag+name')).toBe('tag\\+name');
    test.expect(processor.escapeRegex('name[bracket]')).toBe('name\\[bracket\\]');
    test.expect(processor.escapeRegex('name(paren)')).toBe('name\\(paren\\)');
    test.expect(processor.escapeRegex('name*star')).toBe('name\\*star');
    test.expect(processor.escapeRegex('name?question')).toBe('name\\?question');
    test.expect(processor.escapeRegex('name^caret')).toBe('name\\^caret');
    test.expect(processor.escapeRegex('name$dollar')).toBe('name\\$dollar');
});

// Export for running
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { test };
} else {
    // Browser environment - run tests immediately
    test.run();
}