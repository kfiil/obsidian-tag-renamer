/**
 * Table of Contents Service
 * Handles TOC generation and insertion in markdown files
 */

import { TFile, App } from 'obsidian';
import { REGEX_PATTERNS } from '../constants/patterns';
import { TocOptions } from '../types/interfaces';

export interface TocEntry {
	level: number;
	title: string;
}

export class TocService {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * Generate TOC from markdown content
	 */
	generateToc(content: string, options: TocOptions): string {
		const headings = this.extractHeadings(content);
		const filteredHeadings = headings.filter(h => h.level <= options.maxDepth);
		
		if (filteredHeadings.length === 0) {
			return '';
		}

		let toc = `## ${options.tocTitle}\n\n`;
		
		for (const heading of filteredHeadings) {
			const indent = '  '.repeat(heading.level - 1);
			if (options.includeLinks) {
				// Use correct Obsidian heading link format: [[#heading text]]
				toc += `${indent}- [[#${heading.title}]]\n`;
			} else {
				toc += `${indent}- ${heading.title}\n`;
			}
		}
		
		return toc + '\n';
	}

	/**
	 * Extract headings from markdown content
	 */
	private extractHeadings(content: string): TocEntry[] {
		const headings: TocEntry[] = [];
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


	/**
	 * Insert or update TOC in file content
	 */
	insertToc(content: string, options: TocOptions): string {
		// Remove existing TOC if present
		const cleanContent = this.removeToc(content);
		
		// Generate new TOC
		const toc = this.generateToc(cleanContent, options);
		
		if (!toc) {
			return cleanContent; // No headings found
		}

		// Find insertion point
		const insertionPoint = this.findTocInsertionPoint(cleanContent);
		
		// Insert TOC
		const beforeToc = cleanContent.substring(0, insertionPoint);
		const afterToc = cleanContent.substring(insertionPoint);
		
		return beforeToc + toc + afterToc;
	}

	/**
	 * Find the correct position to insert TOC
	 * After frontmatter (if exists) or at the beginning
	 */
	private findTocInsertionPoint(content: string): number {
		const frontmatterMatch = content.match(REGEX_PATTERNS.FRONTMATTER);
		
		if (frontmatterMatch) {
			// Insert after frontmatter
			const frontmatterEnd = frontmatterMatch.index! + frontmatterMatch[0].length;
			// Add some spacing after frontmatter
			const afterFrontmatter = content.substring(frontmatterEnd);
			const nextContentMatch = afterFrontmatter.match(/\n*(.)/);
			if (nextContentMatch) {
				return frontmatterEnd + (nextContentMatch.index || 0);
			}
			return frontmatterEnd + 1;
		} else {
			// Insert at the beginning
			return 0;
		}
	}

	/**
	 * Remove existing TOC from content
	 */
	private removeToc(content: string): string {
		// Match TOC section (starts with "## Table of Contents" or similar, followed by list items)
		const tocRegex = /^##\s+(Table of Contents|TOC|Contents)\s*\n\n((?:\s*-\s+.*\n)*)\n*/gmi;
		return content.replace(tocRegex, '');
	}

	/**
	 * Insert TOC in a specific file
	 */
	async insertTocInFile(file: TFile, options: TocOptions): Promise<boolean> {
		try {
			const content = await this.app.vault.read(file);
			const newContent = this.insertToc(content, options);
			
			if (newContent !== content) {
				await this.app.vault.modify(file, newContent);
				return true;
			}
			return false;
		} catch (error) {
			console.error('Error inserting TOC in file:', error);
			return false;
		}
	}

	/**
	 * Check if content has any headings
	 */
	hasHeadings(content: string): boolean {
		return /^#{1,6}\s+.+$/m.test(content);
	}
}