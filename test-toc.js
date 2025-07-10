/**
 * Simple test for TOC functionality
 */

// Mock the necessary Obsidian imports
const REGEX_PATTERNS = {
    FRONTMATTER: /^---\n(.*?)\n---/s,
};

class MockApp {
    vault = {
        read: async (file) => file.content,
        modify: async (file, content) => {
            file.content = content;
            return true;
        }
    };
}

// Simple TOC Service implementation for testing
class TocService {
    constructor(app) {
        this.app = app;
    }

    generateToc(content, options) {
        const headings = this.extractHeadings(content);
        const filteredHeadings = headings.filter(h => h.level <= options.maxDepth);
        
        if (filteredHeadings.length === 0) {
            return '';
        }

        let toc = `## ${options.tocTitle}\n\n`;
        
        for (const heading of filteredHeadings) {
            const indent = '  '.repeat(heading.level - 1);
            if (options.includeLinks) {
                toc += `${indent}- [[#${heading.title}]]\n`;
            } else {
                toc += `${indent}- ${heading.title}\n`;
            }
        }
        
        return toc + '\n';
    }

    extractHeadings(content) {
        const headings = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            const match = line.match(/^(#{1,6})\s+(.+)$/);
            if (match) {
                const level = match[1].length;
                const title = match[2].trim();
                
                headings.push({
                    level,
                    title
                });
            }
        }
        
        return headings;
    }


    insertToc(content, options) {
        const cleanContent = this.removeToc(content);
        const toc = this.generateToc(cleanContent, options);
        
        if (!toc) {
            return cleanContent;
        }

        const insertionPoint = this.findTocInsertionPoint(cleanContent);
        const beforeToc = cleanContent.substring(0, insertionPoint);
        const afterToc = cleanContent.substring(insertionPoint);
        
        return beforeToc + toc + afterToc;
    }

    findTocInsertionPoint(content) {
        const frontmatterMatch = content.match(REGEX_PATTERNS.FRONTMATTER);
        
        if (frontmatterMatch) {
            const frontmatterEnd = frontmatterMatch.index + frontmatterMatch[0].length;
            const afterFrontmatter = content.substring(frontmatterEnd);
            const nextContentMatch = afterFrontmatter.match(/\n*(.)/);
            if (nextContentMatch) {
                return frontmatterEnd + (nextContentMatch.index || 0);
            }
            return frontmatterEnd + 1;
        } else {
            return 0;
        }
    }

    removeToc(content) {
        const tocRegex = /^##\s+(Table of Contents|TOC|Contents)\s*\n\n((?:\s*-\s+.*\n)*)\n*/gmi;
        return content.replace(tocRegex, '');
    }

    hasHeadings(content) {
        return /^#{1,6}\s+.+$/m.test(content);
    }
}

// Test cases
console.log('🧪 Testing TOC Service...');

const app = new MockApp();
const tocService = new TocService(app);

const testOptions = {
    maxDepth: 3,
    includeLinks: true,
    tocTitle: 'Table of Contents'
};

// Test 1: Content with frontmatter
const contentWithFrontmatter = `---
tags: [test, example]
title: Test Document
---

# Introduction

This is an introduction.

## Getting Started

Let's get started.

### Prerequisites

You need these prerequisites.

## Advanced Topics

More advanced content here.
`;

console.log('\n📝 Test 1: Content with frontmatter');
const result1 = tocService.insertToc(contentWithFrontmatter, testOptions);
console.log('Result:');
console.log(result1);

// Test 2: Content without frontmatter
const contentWithoutFrontmatter = `# My Document

This is the main content.

## Section One

First section content.

## Section Two

Second section content.

### Subsection

A subsection here.
`;

console.log('\n📝 Test 2: Content without frontmatter');
const result2 = tocService.insertToc(contentWithoutFrontmatter, testOptions);
console.log('Result:');
console.log(result2);

// Test 3: Check heading detection
console.log('\n📝 Test 3: Heading detection');
console.log('Has headings (with frontmatter):', tocService.hasHeadings(contentWithFrontmatter));
console.log('Has headings (without frontmatter):', tocService.hasHeadings(contentWithoutFrontmatter));
console.log('Has headings (no headings):', tocService.hasHeadings('Just plain text content'));

console.log('\n✅ TOC Service tests completed!');