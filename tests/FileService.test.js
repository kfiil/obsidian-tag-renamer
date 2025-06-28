"use strict";
/**
 * Automated Tests for FileService
 * Tests file operations and vault scanning without manual intervention
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileServiceTests = void 0;
const FileService_1 = require("../services/FileService");
const TestFramework_1 = require("./TestFramework");
const framework = new TestFramework_1.TestFramework();
exports.FileServiceTests = framework;
const { describe, test, expect } = framework;
// Mock Obsidian App and TFile for testing
class MockTFile {
    constructor(path) {
        this.path = path;
        this.name = path.split('/').pop() || '';
        this.extension = this.name.split('.').pop() || '';
    }
}
class MockTFolder {
    constructor(path, children = []) {
        this.path = path;
        this.name = path.split('/').pop() || '';
        this.children = children;
    }
}
class MockVault {
    constructor() {
        this.files = new Map();
    }
    setFileContent(path, content) {
        this.files.set(path, content);
    }
    async read(file) {
        const content = this.files.get(file.path);
        if (content === undefined) {
            throw new Error(`File not found: ${file.path}`);
        }
        return content;
    }
    async modify(file, content) {
        this.files.set(file.path, content);
    }
    getMarkdownFiles() {
        return Array.from(this.files.keys())
            .filter(path => path.endsWith('.md'))
            .map(path => new MockTFile(path));
    }
}
class MockApp {
    constructor() {
        this.vault = new MockVault();
    }
}
// Test data
const TEST_FILES = {
    'test1.md': `---
tags: [work, project, urgent]
---
# Test 1`,
    'test2.md': `---
tags:
  - personal
  - notes
---
# Test 2`,
    'test3.md': `---
tag: meeting
---
# Test 3`,
    'test4.md': `---
tags: [work, work, project, project]
---
# Test 4 with duplicates`,
    'test5.md': `# No frontmatter`,
    'empty.md': `---
tags: []
---
# Empty tags`
};
describe('FileService', () => {
    let mockApp;
    let fileService;
    // Setup before each test
    framework.beforeEach(() => {
        mockApp = new MockApp();
        // Set up test files
        Object.entries(TEST_FILES).forEach(([path, content]) => {
            mockApp.vault.setFileContent(path, content);
        });
        fileService = new FileService_1.FileService(mockApp);
    });
    test('getAllTagsInVault extracts all unique tags', async () => {
        const tags = await fileService.getAllTagsInVault();
        expect(tags).toContain('work');
        expect(tags).toContain('project');
        expect(tags).toContain('urgent');
        expect(tags).toContain('personal');
        expect(tags).toContain('notes');
        expect(tags).toContain('meeting');
        // Should be sorted alphabetically
        const sortedTags = [...tags].sort();
        expect(tags).toEqual(sortedTags);
    });
    test('getAllTagsInVault returns unique tags only', async () => {
        const tags = await fileService.getAllTagsInVault();
        const uniqueTags = [...new Set(tags)];
        expect(tags.length).toBe(uniqueTags.length);
    });
    test('getAllTagsInVault handles files without tags', async () => {
        // Should not throw error and should still return tags from other files
        const tags = await fileService.getAllTagsInVault();
        expect(tags.length).toBeGreaterThan(0);
    });
    test('getAllMarkdownFiles returns only .md files', () => {
        const folder = new MockTFolder('test', [
            new MockTFile('test/file1.md'),
            new MockTFile('test/file2.txt'),
            new MockTFile('test/file3.md'),
            new MockTFile('test/image.png')
        ]);
        const mdFiles = fileService.getAllMarkdownFiles(folder);
        expect(mdFiles.length).toBe(2);
        expect(mdFiles.every(f => f.extension === 'md')).toBe(true);
    });
    test('getAllMarkdownFiles processes nested folders recursively', () => {
        const subfolder = new MockTFolder('test/sub', [
            new MockTFile('test/sub/nested.md')
        ]);
        const folder = new MockTFolder('test', [
            new MockTFile('test/root.md'),
            subfolder
        ]);
        const mdFiles = fileService.getAllMarkdownFiles(folder);
        expect(mdFiles.length).toBe(2);
        expect(mdFiles.some(f => f.path === 'test/root.md')).toBe(true);
        expect(mdFiles.some(f => f.path === 'test/sub/nested.md')).toBe(true);
    });
    test('removeDuplicatesFromFile processes file correctly', async () => {
        const file = new MockTFile('test4.md');
        const wasModified = await fileService.removeDuplicatesFromFile(file);
        expect(wasModified).toBe(true);
        // Check that file was actually modified
        const content = await mockApp.vault.read(file);
        expect(content).toContain('work');
        expect(content).toContain('project');
        // Should only appear once each
        const workMatches = (content.match(/"work"/g) || []).length;
        const projectMatches = (content.match(/"project"/g) || []).length;
        expect(workMatches).toBe(1);
        expect(projectMatches).toBe(1);
    });
    test('removeDuplicatesFromFile returns false when no duplicates', async () => {
        const file = new MockTFile('test1.md'); // No duplicates in this file
        const wasModified = await fileService.removeDuplicatesFromFile(file);
        expect(wasModified).toBe(false);
    });
    test('removeDuplicatesFromFile handles file read errors', async () => {
        const nonExistentFile = new MockTFile('nonexistent.md');
        const wasModified = await fileService.removeDuplicatesFromFile(nonExistentFile);
        expect(wasModified).toBe(false);
    });
    test('renameTags applies patterns correctly', async () => {
        const folder = new MockTFolder('test', [
            new MockTFile('test1.md'),
            new MockTFile('test2.md')
        ]);
        const patterns = [
            { search: 'work', replace: 'professional', removeMode: false },
            { search: 'personal', replace: '', removeMode: true }
        ];
        await fileService.renameTags(folder, patterns);
        // Check test1.md was modified
        const content1 = await mockApp.vault.read(new MockTFile('test1.md'));
        expect(content1).toContain('professional');
        expect(content1).not.toContain('work');
        // Check test2.md was modified (personal tag removed)
        const content2 = await mockApp.vault.read(new MockTFile('test2.md'));
        expect(content2).not.toContain('personal');
        expect(content2).toContain('notes'); // Other tags preserved
    });
    test('renameTags handles empty patterns array', async () => {
        const folder = new MockTFolder('test', [new MockTFile('test1.md')]);
        // Should not throw error
        await fileService.renameTags(folder, []);
        // File should remain unchanged
        const content = await mockApp.vault.read(new MockTFile('test1.md'));
        expect(content).toBe(TEST_FILES['test1.md']);
    });
    test('renameTags skips invalid patterns', async () => {
        const folder = new MockTFolder('test', [new MockTFile('test1.md')]);
        const patterns = [
            { search: '', replace: 'invalid', removeMode: false },
            { search: 'work', replace: 'professional', removeMode: false } // Valid
        ];
        await fileService.renameTags(folder, patterns);
        // Valid pattern should still be applied
        const content = await mockApp.vault.read(new MockTFile('test1.md'));
        expect(content).toContain('professional');
    });
    test('removeDuplicatesFromFolder processes all files', async () => {
        const folder = new MockTFolder('test', [
            new MockTFile('test1.md'),
            new MockTFile('test4.md') // Has duplicates
        ]);
        await fileService.removeDuplicatesFromFolder(folder);
        // Check that duplicates were removed from test4.md
        const content4 = await mockApp.vault.read(new MockTFile('test4.md'));
        const workMatches = (content4.match(/"work"/g) || []).length;
        expect(workMatches).toBe(1);
    });
});
// Performance tests
describe('FileService Performance', () => {
    test('getAllTagsInVault handles large number of files efficiently', async () => {
        const mockApp = new MockApp();
        // Create 100 test files
        for (let i = 0; i < 100; i++) {
            mockApp.vault.setFileContent(`test${i}.md`, `---
tags: [tag${i}, common, shared]
---
# Test ${i}`);
        }
        const fileService = new FileService_1.FileService(mockApp);
        const startTime = performance.now();
        const tags = await fileService.getAllTagsInVault();
        const duration = performance.now() - startTime;
        expect(tags.length).toBeGreaterThan(100); // Should include tag0-tag99 plus common/shared
        expect(duration).toBeLessThan(1000); // Should complete in < 1 second
    });
    test('batch processing works efficiently', async () => {
        const mockApp = new MockApp();
        // Create many files to test batch processing
        for (let i = 0; i < 25; i++) {
            mockApp.vault.setFileContent(`batch${i}.md`, `---
tags: [test${i}]
---
# Batch ${i}`);
        }
        const fileService = new FileService_1.FileService(mockApp);
        const startTime = performance.now();
        const tags = await fileService.getAllTagsInVault();
        const duration = performance.now() - startTime;
        expect(tags.length).toBe(25);
        expect(duration).toBeLessThan(500); // Should be efficient with batching
    });
});
// Error handling tests
describe('FileService Error Handling', () => {
    test('handles vault read errors gracefully', async () => {
        const mockApp = new MockApp();
        // Create a vault that throws errors
        mockApp.vault.read = async () => {
            throw new Error('Read error');
        };
        const fileService = new FileService_1.FileService(mockApp);
        // Should not throw, should return empty array
        const tags = await fileService.getAllTagsInVault();
        expect(tags).toEqual([]);
    });
    test('continues processing after individual file errors', async () => {
        const mockApp = new MockApp();
        // Set up good files
        mockApp.vault.setFileContent('good1.md', `---
tags: [good1]
---
# Good 1`);
        mockApp.vault.setFileContent('good2.md', `---
tags: [good2]
---
# Good 2`);
        // Mock read to fail on specific file but succeed on others
        const originalRead = mockApp.vault.read.bind(mockApp.vault);
        mockApp.vault.read = async (file) => {
            if (file.path === 'good1.md') {
                throw new Error('Simulated error');
            }
            return originalRead(file);
        };
        const fileService = new FileService_1.FileService(mockApp);
        const tags = await fileService.getAllTagsInVault();
        // Should still get tags from good2.md
        expect(tags).toContain('good2');
        expect(tags).not.toContain('good1'); // Failed file excluded
    });
});
