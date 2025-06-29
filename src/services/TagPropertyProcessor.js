"use strict";
/**
 * Tag Property Processor Service
 * Handles renaming of tag property names in frontmatter
 * (e.g., "🗄️ Tags Database" → "tags")
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagPropertyProcessor = void 0;
const patterns_1 = require("../constants/patterns");
class TagPropertyProcessor {
    /**
     * Renames tag properties in frontmatter according to patterns
     */
    renameTagProperties(content, patterns) {
        const frontmatterMatch = content.match(patterns_1.REGEX_PATTERNS.FRONTMATTER);
        if (!frontmatterMatch || patterns.length === 0) {
            return content;
        }
        let frontmatter = frontmatterMatch[1];
        let modified = false;
        // Apply each pattern
        for (const pattern of patterns) {
            const { from, to } = pattern;
            // Escape special characters in the property name for regex
            const escapedFrom = this.escapeRegexSpecialChars(from);
            // Pattern to match property lines: "property:" or "property: value" or "property:\n  - item"
            const propertyRegex = new RegExp(`^(\\s*)(${escapedFrom})(\\s*:)(.*?)$`, 'gm');
            const beforeReplace = frontmatter;
            frontmatter = frontmatter.replace(propertyRegex, (_match, indent, _oldProp, colon, rest) => {
                modified = true;
                return `${indent}${to}${colon}${rest}`;
            });
            // If we made changes, continue to next pattern
            if (frontmatter !== beforeReplace) {
                continue;
            }
        }
        if (modified) {
            return content.replace(patterns_1.REGEX_PATTERNS.FRONTMATTER, `---\n${frontmatter}\n---`);
        }
        return content;
    }
    /**
     * Finds custom tag properties in frontmatter (excludes standard "tags", "tag", etc.)
     */
    findCustomTagProperties(content) {
        const frontmatterMatch = content.match(patterns_1.REGEX_PATTERNS.FRONTMATTER);
        if (!frontmatterMatch) {
            return [];
        }
        const frontmatter = frontmatterMatch[1];
        const properties = [];
        // Standard tag properties to exclude
        const standardProps = new Set(['tags', 'tag', 'category', 'categories']);
        // Common metadata fields to exclude  
        const commonMetadata = new Set(['title', 'author', 'date', 'created', 'modified', 'status', 'priority']);
        // Match all property lines in frontmatter
        // Handle property names that may contain spaces (like emoji properties)
        const propertyRegex = /^(\s*)([^:]+?)(\s*:)/gmu;
        let match;
        while ((match = propertyRegex.exec(frontmatter)) !== null) {
            const propertyName = match[2].trim();
            // Skip standard properties and common metadata
            if (standardProps.has(propertyName.toLowerCase()) || commonMetadata.has(propertyName.toLowerCase())) {
                continue;
            }
            // Look for properties that might contain tag-like data
            const restOfLine = frontmatter.slice(match.index + match[0].length);
            const lineEnd = restOfLine.indexOf('\n');
            const line = lineEnd === -1 ? restOfLine : restOfLine.slice(0, lineEnd);
            // Check if this looks like a tag property (array, list, or single values)
            if (this.looksLikeTagProperty(line, frontmatter, match.index + match[0].length)) {
                if (!properties.includes(propertyName)) {
                    properties.push(propertyName);
                }
            }
        }
        return properties;
    }
    /**
     * Determines if a property value looks like it contains tags
     */
    looksLikeTagProperty(line, fullFrontmatter, startPos) {
        const trimmedLine = line.trim();
        // Array format: [item1, item2]
        if (trimmedLine.match(/^\s*\[.*\]\s*$/)) {
            return true;
        }
        // List format: check if next lines are list items
        if (trimmedLine === '' || trimmedLine === '\n') {
            const remainingText = fullFrontmatter.slice(startPos);
            const nextLines = remainingText.split('\n').slice(1, 4); // Check next few lines
            // Check if we have list items
            for (const nextLine of nextLines) {
                if (nextLine.trim().startsWith('- ')) {
                    return true;
                }
                if (nextLine.trim() && !nextLine.trim().startsWith('- ')) {
                    break; // Hit a non-list item
                }
            }
        }
        // Single value that looks like a tag (no spaces, reasonable length)
        if (trimmedLine && !trimmedLine.includes(' ') && trimmedLine.length < 50) {
            return true;
        }
        return false;
    }
    /**
     * Escapes special regex characters in property names
     */
    escapeRegexSpecialChars(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
exports.TagPropertyProcessor = TagPropertyProcessor;
