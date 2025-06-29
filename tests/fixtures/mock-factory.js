"use strict";
/**
 * Mock Factory - Test Data Generation Following CLAUDE.md Guidelines
 * Provides factory functions with optional overrides for test data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupMocks = exports.setupMocks = exports.createMockFileContent = exports.createMockFileReader = exports.createMockElement = exports.createMockSettings = exports.createMockRenamePattern = exports.createMockPlugin = exports.createMockFile = exports.createMockFolder = exports.createMockApp = void 0;
// Simple mock function implementation (no external dependencies)
const createMockFn = () => {
    const fn = (...args) => undefined;
    fn.calls = [];
    fn.mockReturnValue = (value) => fn;
    fn.mockResolvedValue = (value) => fn;
    return fn;
};
// Mock Application Factory
const createMockApp = (overrides) => {
    return {
        vault: {
            adapter: {
                fs: {},
                path: {}
            },
            getName: () => 'test-vault',
            getRoot: () => (0, exports.createMockFolder)(''),
            getAbstractFileByPath: createMockFn(),
            read: createMockFn(),
            modify: createMockFn(),
            delete: createMockFn()
        },
        workspace: {
            getActiveFile: createMockFn(),
            openLinkText: createMockFn()
        },
        fileManager: {
            generateMarkdownLink: createMockFn()
        },
        ...overrides
    };
};
exports.createMockApp = createMockApp;
// Mock Folder Factory
const createMockFolder = (name = 'test-folder', overrides) => {
    return {
        name,
        path: name === '' ? '' : `/${name}`,
        children: [],
        parent: null,
        vault: null,
        isRoot: () => name === '',
        ...overrides
    };
};
exports.createMockFolder = createMockFolder;
// Mock File Factory  
const createMockFile = (name = 'test-file.md', overrides) => {
    return {
        name,
        path: `/${name}`,
        basename: name.replace('.md', ''),
        extension: 'md',
        parent: null,
        vault: null,
        stat: {
            ctime: Date.now(),
            mtime: Date.now(),
            size: 100
        },
        ...overrides
    };
};
exports.createMockFile = createMockFile;
// Mock Plugin Factory
const createMockPlugin = (patterns = [], overrides) => {
    return {
        app: (0, exports.createMockApp)(),
        settings: {
            renamePatterns: patterns
        },
        renameTags: createMockFn(),
        removeDuplicatesFromFolder: createMockFn(),
        saveSettings: createMockFn(),
        loadSettings: createMockFn(),
        exportPatternsToJson: createMockFn(),
        importPatternsFromJson: createMockFn(),
        getAllTagsInVault: createMockFn(),
        ...overrides
    };
};
exports.createMockPlugin = createMockPlugin;
// Mock Rename Pattern Factory
const createMockRenamePattern = (overrides) => {
    return {
        search: 'old-tag',
        replace: 'new-tag',
        removeMode: false,
        ...overrides
    };
};
exports.createMockRenamePattern = createMockRenamePattern;
// Mock Settings Factory
const createMockSettings = (overrides) => {
    return {
        renamePatterns: [
            (0, exports.createMockRenamePattern)(),
            (0, exports.createMockRenamePattern)({ search: 'work', replace: 'professional' })
        ],
        ...overrides
    };
};
exports.createMockSettings = createMockSettings;
// Mock DOM Element Factory for UI Testing
const createMockElement = (tagName = 'div') => {
    return {
        tagName: tagName.toUpperCase(),
        innerHTML: '',
        textContent: '',
        style: {},
        onclick: null,
        onchange: null,
        type: '',
        accept: '',
        files: null,
        createEl: createMockFn(),
        createDiv: createMockFn(),
        empty: createMockFn(),
        addClass: createMockFn(),
        removeClass: createMockFn(),
        setAttribute: createMockFn(),
        getAttribute: createMockFn(),
        appendChild: createMockFn(),
        removeChild: createMockFn()
    };
};
exports.createMockElement = createMockElement;
// Mock FileReader Factory
const createMockFileReader = (result = '') => {
    return {
        onload: null,
        onerror: null,
        readAsText: createMockFn(),
        result,
        readyState: 2,
        error: null
    };
};
exports.createMockFileReader = createMockFileReader;
// Mock File Content Factory
const createMockFileContent = (tags = ['tag1', 'tag2'], format = 'array') => {
    let frontmatter = '';
    switch (format) {
        case 'array':
            frontmatter = `tags: [${tags.map(t => `"${t}"`).join(', ')}]`;
            break;
        case 'list':
            frontmatter = `tags:\n${tags.map(t => `  - ${t}`).join('\n')}`;
            break;
        case 'single':
            frontmatter = `tag: ${tags[0] || 'single-tag'}`;
            break;
    }
    return `---
${frontmatter}
---

# Test Content

This is a test markdown file with tags in the frontmatter.`;
};
exports.createMockFileContent = createMockFileContent;
// Setup Mock Environment
const setupMocks = () => {
    // Mock global FileReader if needed
    if (typeof global !== 'undefined') {
        global.FileReader = function () {
            return (0, exports.createMockFileReader)();
        };
        // Mock performance if not available
        if (typeof global.performance === 'undefined') {
            global.performance = {
                now: () => Date.now()
            };
        }
    }
};
exports.setupMocks = setupMocks;
// Clean up mocks after tests (no-op for our simple implementation)
const cleanupMocks = () => {
    // Nothing to clean up in our simple implementation
};
exports.cleanupMocks = cleanupMocks;
