// Import removed - TFile not used in this module
import { RenamePattern } from '../types/interfaces';
import { REGEX_PATTERNS } from '../constants/patterns';

export class TagProcessor {
	escapeRegex(string: string): string {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	extractTagsFromContent(content: string): string[] {
		const tags: string[] = [];
		const frontmatterMatch = content.match(REGEX_PATTERNS.FRONTMATTER);
		
		if (!frontmatterMatch) return tags;

		const frontmatter = frontmatterMatch[1];

		// Extract from tag arrays (tags: [tag1, tag2])
		const arrayMatches = frontmatter.match(REGEX_PATTERNS.TAG_ARRAY);
		if (arrayMatches) {
			arrayMatches.forEach(line => {
				const tagContent = line.replace(/^tags:\s*\[|\]$/g, '');
				const tagList = tagContent.split(',').map(tag => tag.trim().replace(/['"]/g, ''));
				tags.push(...tagList.filter(tag => tag.length > 0));
			});
		}

		// Extract from tag lists (tags:\n  - tag1\n  - tag2)
		const listMatches = frontmatter.match(REGEX_PATTERNS.TAG_LIST);
		if (listMatches) {
			listMatches.forEach(block => {
				const tagLines = block.match(REGEX_PATTERNS.TAG_LINE_MATCH);
				if (tagLines) {
					tagLines.forEach(line => {
						const tag = line.replace(/^\s*-\s*/, '').trim().replace(/['"]/g, '');
						if (tag.length > 0) tags.push(tag);
					});
				}
			});
		}

		// Extract from single tag line (tag: tagname)
		const singleMatches = frontmatter.match(REGEX_PATTERNS.SINGLE_TAG);
		if (singleMatches) {
			singleMatches.forEach(line => {
				const tag = line.replace(/^tag:\s*/, '').trim().replace(/['"]/g, '');
				if (tag.length > 0) tags.push(tag);
			});
		}

		return tags;
	}

	removeDuplicateTagsFromContent(content: string): string {
		const frontmatterMatch = content.match(REGEX_PATTERNS.FRONTMATTER);
		
		if (!frontmatterMatch) return content;

		let frontmatter = frontmatterMatch[1];
		let modified = false;

		// Process tag arrays (tags: [tag1, tag2, tag1])
		frontmatter = frontmatter.replace(REGEX_PATTERNS.TAG_ARRAY, (line, tagContent) => {
			const tags = tagContent.split(',').map((tag: string) => tag.trim().replace(/['"]/g, ''));
			const uniqueTags = [...new Set(tags.filter((tag: string) => tag.length > 0))];
			
			if (uniqueTags.length !== tags.filter((tag: string) => tag.length > 0).length) {
				modified = true;
				const formattedTags = (uniqueTags as string[]).map((tag: string) => `"${tag}"`).join(', ');
				return `tags: [${formattedTags}]`;
			}
			return line;
		});

		// Process tag lists (tags:\n  - tag1\n  - tag2\n  - tag1)
		frontmatter = frontmatter.replace(REGEX_PATTERNS.TAG_LIST, (block) => {
			const tagLines = block.match(REGEX_PATTERNS.TAG_LINE_MATCH);
			if (tagLines) {
				const tags = tagLines.map(line => 
					line.replace(/^\s*-\s*/, '').trim().replace(/['"]/g, '')
				).filter(tag => tag.length > 0);
				
				const uniqueTags = [...new Set(tags)];
				
				if (uniqueTags.length !== tags.length) {
					modified = true;
					const newTagLines = uniqueTags.map((tag: string) => `  - "${tag}"`).join('\n');
					return `tags:\n${newTagLines}\n`;
				}
			}
			return block;
		});

		if (modified) {
			return content.replace(REGEX_PATTERNS.FRONTMATTER, `---\n${frontmatter}\n---`);
		}

		return content;
	}

	processFileContent(content: string, patterns: RenamePattern[]): string {
		const frontmatterMatch = content.match(REGEX_PATTERNS.FRONTMATTER);
		
		if (!frontmatterMatch) return content;

		let frontmatter = frontmatterMatch[1];
		let modified = false;

		// Pre-compile regexes for better performance
		const compiledPatterns = patterns.map(p => ({
			...p,
			regex: new RegExp(`^${this.escapeRegex(p.search)}$`)
		}));

		// Process tag arrays (tags: [tag1, tag2])
		frontmatter = frontmatter.replace(REGEX_PATTERNS.TAG_ARRAY, (_line, tagContent) => {
			let tags = tagContent.split(',').map((tag: string) => tag.trim().replace(/['"]/g, ''));
			let originalLength = tags.length;
			
			for (const pattern of compiledPatterns) {
				if (pattern.removeMode) {
					// Remove matching tags
					tags = tags.filter((tag: string) => !pattern.regex.test(tag.trim()));
				} else {
					// Replace matching tags
					tags = tags.map((tag: string) => {
						if (pattern.regex.test(tag.trim())) {
							modified = true;
							return pattern.replace;
						}
						return tag;
					});
				}
			}
			
			if (tags.length !== originalLength) {
				modified = true;
			}
			
			const formattedTags = tags.filter((tag: string) => tag.length > 0).map((tag: string) => `"${tag}"`).join(', ');
			return `tags: [${formattedTags}]`;
		});

		// Process tag lists (tags:\n  - tag1\n  - tag2)
		frontmatter = frontmatter.replace(REGEX_PATTERNS.TAG_LIST, (block) => {
			const tagLines = block.match(REGEX_PATTERNS.TAG_LINE_MATCH);
			if (tagLines) {
				let tags = tagLines.map(line => 
					line.replace(/^\s*-\s*/, '').trim().replace(/['"]/g, '')
				).filter(tag => tag.length > 0);
				
				let originalLength = tags.length;
				
				for (const pattern of compiledPatterns) {
					if (pattern.removeMode) {
						// Remove matching tags
						tags = tags.filter(tag => !pattern.regex.test(tag));
					} else {
						// Replace matching tags
						tags = tags.map(tag => {
							if (pattern.regex.test(tag)) {
								modified = true;
								return pattern.replace;
							}
							return tag;
						});
					}
				}
				
				if (tags.length !== originalLength) {
					modified = true;
				}
				
				if (tags.length === 0) {
					return ''; // Remove the entire tags section if no tags remain
				}
				
				const newTagLines = tags.map((tag: string) => `  - "${tag}"`).join('\n');
				return `tags:\n${newTagLines}\n`;
			}
			return block;
		});

		// Process single tag line (tag: tagname)
		frontmatter = frontmatter.replace(REGEX_PATTERNS.SINGLE_TAG, (line, tag) => {
			const cleanTag = tag.trim().replace(/['"]/g, '');
			
			for (const pattern of compiledPatterns) {
				if (pattern.regex.test(cleanTag)) {
					modified = true;
					if (pattern.removeMode) {
						return ''; // Remove the entire tag line
					} else {
						return `tag: "${pattern.replace}"`;
					}
				}
			}
			return line;
		});

		// Clean up empty lines left by removed tags
		frontmatter = frontmatter.replace(REGEX_PATTERNS.EMPTY_LINES, '\n').replace(REGEX_PATTERNS.TRIM_LINES, '');

		if (modified) {
			return content.replace(REGEX_PATTERNS.FRONTMATTER, `---\n${frontmatter}\n---`);
		}

		return content;
	}
}