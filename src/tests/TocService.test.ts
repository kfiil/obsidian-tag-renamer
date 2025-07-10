/**
 * TOC Service Tests
 */

import { TocService } from '../services/TocService';
import { TocOptions } from '../types/interfaces';
import { TestFramework } from './TestFramework';

const framework = new TestFramework();
export { framework };

const { describe, test, expect } = framework;

// Mock App class for testing
class MockApp {
	vault = {
		read: async (file: any) => file.content,
		modify: async (file: any, content: string) => {
			file.content = content;
			return true;
		}
	};
}

describe('TOC Service Tests', () => {
	const app = new MockApp() as any;
	const tocService = new TocService(app);
	
	const defaultOptions: TocOptions = {
		maxDepth: 3,
		includeLinks: true,
		tocTitle: 'Table of Contents'
	};

	test('should extract headings correctly', () => {
		const content = `# Main Title
## Section One
### Subsection
## Section Two
#### Deep Section
##### Very Deep
###### Max Depth`;

		const headings = (tocService as any).extractHeadings(content);
		
		expect(headings).toHaveLength(7);
		expect(headings[0].level).toBe(1);
		expect(headings[0].title).toBe('Main Title');
		expect(headings[1].level).toBe(2);
		expect(headings[1].title).toBe('Section One');
	});

	test('should generate TOC with links', () => {
		const content = `# Introduction
## Getting Started
### Prerequisites
## Advanced Topics`;

		const toc = tocService.generateToc(content, defaultOptions);
		
		expect(toc).toContain('## Table of Contents');
		expect(toc).toContain('- [[#Introduction]]');
		expect(toc).toContain('- [[#Getting Started]]');
		expect(toc).toContain('  - [[#Prerequisites]]');
		expect(toc).toContain('- [[#Advanced Topics]]');
	});

	test('should generate TOC without links', () => {
		const content = `# Introduction
## Getting Started`;

		const optionsNoLinks: TocOptions = {
			...defaultOptions,
			includeLinks: false
		};

		const toc = tocService.generateToc(content, optionsNoLinks);
		
		expect(toc).toContain('## Table of Contents');
		expect(toc).toContain('- Introduction');
		expect(toc).toContain('- Getting Started');
		expect(toc).not.toContain('[[#');
	});

	test('should respect maxDepth setting', () => {
		const content = `# Level 1
## Level 2
### Level 3
#### Level 4
##### Level 5`;

		const optionsDepth2: TocOptions = {
			...defaultOptions,
			maxDepth: 2
		};

		const toc = tocService.generateToc(content, optionsDepth2);
		
		expect(toc).toContain('Level 1');
		expect(toc).toContain('Level 2');
		expect(toc).not.toContain('Level 3');
		expect(toc).not.toContain('Level 4');
		expect(toc).not.toContain('Level 5');
	});

	test('should return empty string for content without headings', () => {
		const content = 'Just plain text content without any headings.';
		const toc = tocService.generateToc(content, defaultOptions);
		
		expect(toc).toBe('');
	});

	test('should detect headings correctly', () => {
		const contentWithHeadings = '# Title\n\nSome content\n\n## Section';
		const contentWithoutHeadings = 'Just plain text content.';
		
		expect(tocService.hasHeadings(contentWithHeadings)).toBe(true);
		expect(tocService.hasHeadings(contentWithoutHeadings)).toBe(false);
	});

	test('should insert TOC after frontmatter', () => {
		const content = `---
tags: [test, example]
title: Test Document
---

# Introduction

This is the content.

## Getting Started

Let's begin.`;

		const result = tocService.insertToc(content, defaultOptions);
		
		// Should contain original frontmatter
		expect(result).toContain('tags: [test, example]');
		expect(result).toContain('title: Test Document');
		
		// Should contain TOC after frontmatter
		expect(result).toContain('## Table of Contents');
		expect(result).toContain('[[#Introduction]]');
		expect(result).toContain('[[#Getting Started]]');
		
		// TOC should come after frontmatter but before content
		const frontmatterEnd = result.indexOf('---\n\n') + 5;
		const tocStart = result.indexOf('## Table of Contents');
		const contentStart = result.indexOf('# Introduction');
		
		expect(tocStart).toBeGreaterThan(frontmatterEnd);
		expect(contentStart).toBeGreaterThan(tocStart);
	});

	test('should insert TOC at beginning when no frontmatter', () => {
		const content = `# My Document

This is the main content.

## Section One

First section.`;

		const result = tocService.insertToc(content, defaultOptions);
		
		// Should start with TOC
		expect(result.trim().startsWith('## Table of Contents')).toBe(true);
		expect(result).toContain('[[#My Document]]');
		expect(result).toContain('[[#Section One]]');
		
		// Original content should still be there
		expect(result).toContain('# My Document');
		expect(result).toContain('This is the main content.');
	});

	test('should remove existing TOC before inserting new one', () => {
		const contentWithExistingToc = `---
title: Test
---

## Table of Contents

- [[#old-section|Old Section]]

# New Heading

## New Section

Content here.`;

		const result = tocService.insertToc(contentWithExistingToc, defaultOptions);
		
		// Should not contain old TOC entries
		expect(result).not.toContain('Old Section');
		
		// Should contain new TOC
		expect(result).toContain('[[#New Heading]]');
		expect(result).toContain('[[#New Section]]');
		
		// Should only have one TOC section
		const tocMatches = result.match(/## Table of Contents/g);
		expect(tocMatches).toHaveLength(1);
	});

	test('should handle custom TOC title', () => {
		const content = '# Test\n## Section';
		const customOptions: TocOptions = {
			...defaultOptions,
			tocTitle: 'Contents'
		};

		const result = tocService.insertToc(content, customOptions);
		
		expect(result).toContain('## Contents');
		expect(result).not.toContain('## Table of Contents');
	});

	test('should return unchanged content when no headings found', () => {
		const content = 'Just plain text with no headings.';
		const result = tocService.insertToc(content, defaultOptions);
		
		expect(result).toBe(content);
	});
});