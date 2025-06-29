/**
 * Mock Factory - Test Data Generation Following CLAUDE.md Guidelines
 * Provides factory functions with optional overrides for test data
 */

import { App, TFolder, TFile } from 'obsidian';
import { RenamePattern, TagRenamerSettings } from '../../src/types/interfaces';

// Simple mock function implementation (no external dependencies)
const createMockFn = () => {
    const fn = (...args: any[]) => undefined;
    fn.calls = [] as any[][];
    fn.mockReturnValue = (value: any) => fn;
    fn.mockResolvedValue = (value: any) => fn;
    return fn;
};

// Mock Application Factory
export const createMockApp = (overrides?: Partial<App>): App => {
    return {
        vault: {
            adapter: {
                fs: {},
                path: {}
            },
            getName: () => 'test-vault',
            getRoot: () => createMockFolder(''),
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
    } as App;
};

// Mock Folder Factory
export const createMockFolder = (
    name = 'test-folder',
    overrides?: Partial<TFolder>
): TFolder => {
    return {
        name,
        path: name === '' ? '' : `/${name}`,
        children: [],
        parent: null,
        vault: null,
        isRoot: () => name === '',
        ...overrides
    } as TFolder;
};

// Mock File Factory  
export const createMockFile = (
    name = 'test-file.md',
    overrides?: Partial<TFile>
): TFile => {
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
    } as TFile;
};

// Mock Plugin Factory
export const createMockPlugin = (
    patterns: RenamePattern[] = [],
    overrides?: any
) => {
    return {
        app: createMockApp(),
        settings: {
            renamePatterns: patterns
        } as TagRenamerSettings,
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

// Mock Rename Pattern Factory
export const createMockRenamePattern = (
    overrides?: Partial<RenamePattern>
): RenamePattern => {
    return {
        search: 'old-tag',
        replace: 'new-tag', 
        removeMode: false,
        ...overrides
    };
};

// Mock Settings Factory
export const createMockSettings = (
    overrides?: Partial<TagRenamerSettings>
): TagRenamerSettings => {
    return {
        renamePatterns: [
            createMockRenamePattern(),
            createMockRenamePattern({ search: 'work', replace: 'professional' })
        ],
        ...overrides
    };
};

// Mock DOM Element Factory for UI Testing
export const createMockElement = (tagName = 'div') => {
    return {
        tagName: tagName.toUpperCase(),
        innerHTML: '',
        textContent: '',
        style: {} as CSSStyleDeclaration,
        onclick: null as (() => void) | null,
        onchange: null as ((event: Event) => void) | null,
        type: '',
        accept: '',
        files: null as FileList | null,
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

// Mock FileReader Factory
export const createMockFileReader = (result = '') => {
    return {
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((event: ProgressEvent<FileReader>) => void) | null,
        readAsText: createMockFn(),
        result,
        readyState: 2, // DONE
        error: null
    };
};

// Mock File Content Factory
export const createMockFileContent = (
    tags: string[] = ['tag1', 'tag2'],
    format: 'array' | 'list' | 'single' = 'array'
): string => {
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

// Setup Mock Environment
export const setupMocks = () => {
    // Mock global FileReader if needed
    if (typeof global !== 'undefined') {
        (global as any).FileReader = function() {
            return createMockFileReader();
        };
        
        // Mock performance if not available
        if (typeof (global as any).performance === 'undefined') {
            (global as any).performance = {
                now: () => Date.now()
            };
        }
    }
};

// Clean up mocks after tests (no-op for our simple implementation)
export const cleanupMocks = () => {
    // Nothing to clean up in our simple implementation
};