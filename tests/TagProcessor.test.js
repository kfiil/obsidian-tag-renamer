"use strict";
/**
 * Comprehensive Automated Tests for TagProcessor Service
 * Tests all core functionality without manual intervention
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagProcessorTests = void 0;
const TagProcessor_1 = require("../services/TagProcessor");
const TestFramework_1 = require("./TestFramework");
const framework = new TestFramework_1.TestFramework();
exports.TagProcessorTests = framework;
const { describe, test, expect } = framework;
// Test data constants
const TEST_FRONTMATTER = {
    ARRAY_FORMAT: `---
tags: [work, project, urgent]
title: Test File
---
# Content`,
    LIST_FORMAT: `---
tags:
  - personal
  - notes
  - important
title: Test File
---
# Content`,
    SINGLE_TAG: `---
tag: meeting
title: Test File
---
# Content`,
    MIXED_QUOTES: `---
tags: ["quoted", 'single', unquoted, "special-chars!@#"]
---
# Content`,
    DUPLICATES_ARRAY: `---
tags: [work, personal, work, other, personal, work]
---
# Content`,
    DUPLICATES_LIST: `---
tags:
  - repeat
  - once
  - repeat
  - twice
  - once
---
# Content`,
    EMPTY_TAGS: `---
tags: []
title: Empty
---
# Content`,
    NO_FRONTMATTER: `# Just Content
No frontmatter at all`,
    SPECIAL_CHARACTERS: `---
tags: ["tag-with-dash", "tag_with_underscore", "tag.with.dots", "tag with spaces", "tag/with/slash"]
---
# Content`,
    MALFORMED_YAML: `---
tags: [unclosed, array
title: Broken
---
# Content`,
    COMPLEX_FRONTMATTER: `---
tags: [work, project, temp, urgent]
title: Complex Test
author: Test Author
created: 2025-01-01
categories:
  - test
  - automation
priority: high
---
# Complex Content

This has multiple frontmatter fields.`
};
const TEST_PATTERNS = [
    { search: 'work', replace: 'professional', removeMode: false },
    { search: 'proj', replace: 'project', removeMode: false },
    { search: 'temp', replace: '', removeMode: true },
    { search: 'urgent', replace: 'important', removeMode: false }
];
// ===== TAG EXTRACTION TESTS =====
describe('Tag Extraction', () => {
    const processor = new TagProcessor_1.TagProcessor();
    test('extracts tags from array format', () => {
        const tags = processor.extractTagsFromContent(TEST_FRONTMATTER.ARRAY_FORMAT);
        expect(tags).toEqual(['work', 'project', 'urgent']);
    });
    test('extracts tags from list format', () => {
        const tags = processor.extractTagsFromContent(TEST_FRONTMATTER.LIST_FORMAT);
        expect(tags).toEqual(['personal', 'notes', 'important']);
    });
    test('extracts single tag', () => {
        const tags = processor.extractTagsFromContent(TEST_FRONTMATTER.SINGLE_TAG);
        expect(tags).toEqual(['meeting']);
    });
    test('handles mixed quote formats', () => {
        const tags = processor.extractTagsFromContent(TEST_FRONTMATTER.MIXED_QUOTES);
        expect(tags).toEqual(['quoted', 'single', 'unquoted', 'special-chars!@#']);
    });
    test('handles empty tags array', () => {
        const tags = processor.extractTagsFromContent(TEST_FRONTMATTER.EMPTY_TAGS);
        expect(tags).toEqual([]);
    });
    test('handles no frontmatter', () => {
        const tags = processor.extractTagsFromContent(TEST_FRONTMATTER.NO_FRONTMATTER);
        expect(tags).toEqual([]);
    });
    test('handles special characters in tags', () => {
        const tags = processor.extractTagsFromContent(TEST_FRONTMATTER.SPECIAL_CHARACTERS);
        expect(tags).toEqual(['tag-with-dash', 'tag_with_underscore', 'tag.with.dots', 'tag with spaces', 'tag/with/slash']);
    });
    test('handles malformed YAML gracefully', () => {
        // Should not throw error, may return empty or partial results
        expect(() => processor.extractTagsFromContent(TEST_FRONTMATTER.MALFORMED_YAML)).not.toThrow();
    });
    test('preserves tag order', () => {
        const content = `---
tags: [third, first, second]
---
# Content`;
        const tags = processor.extractTagsFromContent(content);
        expect(tags).toEqual(['third', 'first', 'second']);
    });
    test('handles mixed format combinations', () => {
        const content = `---
tag: single
tags: [array1, array2]
other-tags:
  - list1
  - list2
---
# Content`;
        const tags = processor.extractTagsFromContent(content);
        expect(tags.length).toBeGreaterThan(0);
        expect(tags).toContain('single');
        expect(tags).toContain('array1');
    });
});
// ===== DUPLICATE REMOVAL TESTS =====
describe('Duplicate Removal', () => {
    const processor = new TagProcessor_1.TagProcessor();
    test('removes duplicates from array format', () => {
        const result = processor.removeDuplicateTagsFromContent(TEST_FRONTMATTER.DUPLICATES_ARRAY);
        expect(result).toContain('work');
        expect(result).toContain('personal');
        expect(result).toContain('other');
        // Count occurrences of each tag (should be 1 each)
        const workMatches = (result.match(/"work"/g) || []).length;
        const personalMatches = (result.match(/"personal"/g) || []).length;
        expect(workMatches).toBe(1);
        expect(personalMatches).toBe(1);
    });
    test('removes duplicates from list format', () => {
        const result = processor.removeDuplicateTagsFromContent(TEST_FRONTMATTER.DUPLICATES_LIST);
        expect(result).toContain('repeat');
        expect(result).toContain('once');
        expect(result).toContain('twice');
        // Count line occurrences
        const repeatLines = (result.match(/- "repeat"/g) || []).length;
        const onceLines = (result.match(/- "once"/g) || []).length;
        expect(repeatLines).toBe(1);
        expect(onceLines).toBe(1);
    });
    test('preserves content when no duplicates exist', () => {
        const result = processor.removeDuplicateTagsFromContent(TEST_FRONTMATTER.ARRAY_FORMAT);
        expect(result).toBe(TEST_FRONTMATTER.ARRAY_FORMAT);
    });
    test('handles empty arrays without modification', () => {
        const result = processor.removeDuplicateTagsFromContent(TEST_FRONTMATTER.EMPTY_TAGS);
        expect(result).toBe(TEST_FRONTMATTER.EMPTY_TAGS);
    });
    test('preserves frontmatter structure', () => {
        const result = processor.removeDuplicateTagsFromContent(TEST_FRONTMATTER.DUPLICATES_ARRAY);
        expect(result).toContain('title: Test File');
        expect(result).toContain('---');
        expect(result).toContain('# Content');
    });
});
// ===== TAG PROCESSING TESTS =====
describe('Tag Processing', () => {
    const processor = new TagProcessor_1.TagProcessor();
    test('performs basic tag rename', () => {
        const patterns = [
            { search: 'work', replace: 'professional', removeMode: false }
        ];
        const result = processor.processFileContent(TEST_FRONTMATTER.ARRAY_FORMAT, patterns);
        expect(result).toContain('professional');
        expect(result).not.toContain('"work"');
        expect(result).toContain('project'); // Other tags preserved
    });
    test('removes tags in remove mode', () => {
        const patterns = [
            { search: 'urgent', replace: '', removeMode: true }
        ];
        const result = processor.processFileContent(TEST_FRONTMATTER.ARRAY_FORMAT, patterns);
        expect(result).not.toContain('urgent');
        expect(result).toContain('work'); // Other tags preserved
        expect(result).toContain('project');
    });
    test('applies multiple patterns correctly', () => {
        const result = processor.processFileContent(TEST_FRONTMATTER.COMPLEX_FRONTMATTER, TEST_PATTERNS);
        expect(result).toContain('professional'); // work → professional
        expect(result).toContain('important'); // urgent → important
        expect(result).not.toContain('temp'); // temp removed
        expect(result).toContain('project'); // preserved
    });
    test('preserves non-tag frontmatter', () => {
        const result = processor.processFileContent(TEST_FRONTMATTER.COMPLEX_FRONTMATTER, TEST_PATTERNS);
        expect(result).toContain('title: Complex Test');
        expect(result).toContain('author: Test Author');
        expect(result).toContain('priority: high');
        expect(result).toContain('categories:');
    });
    test('handles exact matching with regex escaping', () => {
        const content = `---
tags: [work, workflow, work.done, "work-item"]
---
# Content`;
        const patterns = [
            { search: 'work', replace: 'professional', removeMode: false }
        ];
        const result = processor.processFileContent(content, patterns);
        expect(result).toContain('professional');
        expect(result).toContain('workflow'); // Should NOT be changed
        expect(result).toContain('work.done'); // Should NOT be changed
        expect(result).toContain('work-item'); // Should NOT be changed
    });
    test('processes single tag format', () => {
        const patterns = [
            { search: 'meeting', replace: 'conference', removeMode: false }
        ];
        const result = processor.processFileContent(TEST_FRONTMATTER.SINGLE_TAG, patterns);
        expect(result).toContain('tag: "conference"');
        expect(result).not.toContain('meeting');
    });
    test('removes single tag completely', () => {
        const patterns = [
            { search: 'meeting', replace: '', removeMode: true }
        ];
        const result = processor.processFileContent(TEST_FRONTMATTER.SINGLE_TAG, patterns);
        expect(result).not.toContain('tag: meeting');
        expect(result).not.toContain('meeting');
        expect(result).toContain('title: Test File'); // Other content preserved
    });
    test('handles special characters in patterns', () => {
        const patterns = [
            { search: 'tag-with-dash', replace: 'dash-tag', removeMode: false },
            { search: 'tag.with.dots', replace: 'dot-tag', removeMode: false }
        ];
        const result = processor.processFileContent(TEST_FRONTMATTER.SPECIAL_CHARACTERS, patterns);
        expect(result).toContain('dash-tag');
        expect(result).toContain('dot-tag');
        expect(result).toContain('tag_with_underscore'); // Unchanged
    });
    test('returns unchanged content when no matches', () => {
        const patterns = [
            { search: 'nonexistent', replace: 'something', removeMode: false }
        ];
        const result = processor.processFileContent(TEST_FRONTMATTER.ARRAY_FORMAT, patterns);
        expect(result).toBe(TEST_FRONTMATTER.ARRAY_FORMAT);
    });
    test('handles empty pattern array', () => {
        const result = processor.processFileContent(TEST_FRONTMATTER.ARRAY_FORMAT, []);
        expect(result).toBe(TEST_FRONTMATTER.ARRAY_FORMAT);
    });
    test('processes list format correctly', () => {
        const patterns = [
            { search: 'personal', replace: 'private', removeMode: false },
            { search: 'notes', replace: '', removeMode: true }
        ];
        const result = processor.processFileContent(TEST_FRONTMATTER.LIST_FORMAT, patterns);
        expect(result).toContain('private');
        expect(result).not.toContain('notes');
        expect(result).toContain('important');
    });
    test('cleans up empty tag sections', () => {
        const content = `---
tags: [onlytag]
---
# Content`;
        const patterns = [
            { search: 'onlytag', replace: '', removeMode: true }
        ];
        const result = processor.processFileContent(content, patterns);
        expect(result).toContain('tags: []');
    });
});
// ===== REGEX ESCAPING TESTS =====
describe('Regex Escaping', () => {
    const processor = new TagProcessor_1.TagProcessor();
    test('escapes basic special characters', () => {
        expect(processor.escapeRegex('hello.world')).toBe('hello\\.world');
        expect(processor.escapeRegex('tag+name')).toBe('tag\\+name');
        expect(processor.escapeRegex('name*star')).toBe('name\\*star');
        expect(processor.escapeRegex('name?question')).toBe('name\\?question');
    });
    test('escapes bracket characters', () => {
        expect(processor.escapeRegex('name[bracket]')).toBe('name\\[bracket\\]');
        expect(processor.escapeRegex('name{brace}')).toBe('name\\{brace\\}');
        expect(processor.escapeRegex('name(paren)')).toBe('name\\(paren\\)');
    });
    test('escapes anchor characters', () => {
        expect(processor.escapeRegex('name^caret')).toBe('name\\^caret');
        expect(processor.escapeRegex('name$dollar')).toBe('name\\$dollar');
    });
    test('escapes pipe and backslash', () => {
        expect(processor.escapeRegex('name|pipe')).toBe('name\\|pipe');
        expect(processor.escapeRegex('name\\backslash')).toBe('name\\\\backslash');
    });
    test('handles multiple special characters', () => {
        expect(processor.escapeRegex('test.tag+name*')).toBe('test\\.tag\\+name\\*');
        expect(processor.escapeRegex('[tag].(name)+{test}*')).toBe('\\[tag\\]\\.\\(name\\)\\+\\{test\\}\\*');
    });
    test('preserves normal characters', () => {
        expect(processor.escapeRegex('normal-tag_name123')).toBe('normal\\-tag_name123');
        expect(processor.escapeRegex('SimpleTag')).toBe('SimpleTag');
    });
});
// ===== PERFORMANCE TESTS =====
describe('Performance', () => {
    const processor = new TagProcessor_1.TagProcessor();
    test('processes large content efficiently', () => {
        // Create large content with many tags
        const largeTags = Array.from({ length: 100 }, (_, i) => `tag${i}`);
        const largeContent = `---
tags: [${largeTags.map(t => `"${t}"`).join(', ')}]
title: Large Test
---
${'# Content\n'.repeat(1000)}`;
        const startTime = performance.now();
        const result = processor.extractTagsFromContent(largeContent);
        const duration = performance.now() - startTime;
        expect(result.length).toBe(100);
        expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });
    test('handles many patterns efficiently', () => {
        const manyPatterns = Array.from({ length: 50 }, (_, i) => ({
            search: `tag${i}`,
            replace: `newtag${i}`,
            removeMode: false
        }));
        const content = `---
tags: [tag0, tag1, tag2, tag25, tag49, other]
---
# Content`;
        const startTime = performance.now();
        const result = processor.processFileContent(content, manyPatterns);
        const duration = performance.now() - startTime;
        expect(result).toContain('newtag0');
        expect(result).toContain('newtag1');
        expect(result).toContain('other');
        expect(duration).toBeLessThan(50); // Should complete in < 50ms
    });
    test('regex compilation is efficient', () => {
        const patterns = [
            { search: 'test.tag', replace: 'new', removeMode: false }
        ];
        const startTime = performance.now();
        for (let i = 0; i < 100; i++) {
            processor.escapeRegex('test.tag+name*special[chars]');
        }
        const duration = performance.now() - startTime;
        expect(duration).toBeLessThan(10); // 100 escapes in < 10ms
    });
});
// ===== ERROR HANDLING TESTS =====
describe('Error Handling', () => {
    const processor = new TagProcessor_1.TagProcessor();
    test('handles malformed frontmatter gracefully', () => {
        expect(() => processor.extractTagsFromContent(TEST_FRONTMATTER.MALFORMED_YAML)).not.toThrow();
        expect(() => processor.processFileContent(TEST_FRONTMATTER.MALFORMED_YAML, TEST_PATTERNS)).not.toThrow();
        expect(() => processor.removeDuplicateTagsFromContent(TEST_FRONTMATTER.MALFORMED_YAML)).not.toThrow();
    });
    test('handles empty or null inputs', () => {
        expect(() => processor.extractTagsFromContent('')).not.toThrow();
        expect(() => processor.processFileContent('', [])).not.toThrow();
        expect(() => processor.removeDuplicateTagsFromContent('')).not.toThrow();
        const emptyResult = processor.extractTagsFromContent('');
        expect(emptyResult).toEqual([]);
    });
    test('handles invalid pattern objects', () => {
        const invalidPatterns = [
            { search: '', replace: 'test', removeMode: false },
            { search: 'test', replace: '', removeMode: false }, // Empty replace (but not remove mode)
        ];
        expect(() => processor.processFileContent(TEST_FRONTMATTER.ARRAY_FORMAT, invalidPatterns)).not.toThrow();
    });
    test('handles very long tag names', () => {
        const longTag = 'a'.repeat(1000);
        const content = `---
tags: ["${longTag}"]
---
# Content`;
        expect(() => processor.extractTagsFromContent(content)).not.toThrow();
        const tags = processor.extractTagsFromContent(content);
        expect(tags).toContain(longTag);
    });
    test('handles content without frontmatter delimiters', () => {
        const noDelimiters = 'tags: [test]\ntitle: No Delimiters\n# Content';
        expect(() => processor.extractTagsFromContent(noDelimiters)).not.toThrow();
        const tags = processor.extractTagsFromContent(noDelimiters);
        expect(tags).toEqual([]);
    });
});
