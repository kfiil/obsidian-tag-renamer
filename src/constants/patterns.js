"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSS_STYLES = exports.UI_CONSTANTS = exports.REGEX_PATTERNS = void 0;
exports.REGEX_PATTERNS = {
    FRONTMATTER: /^---\n(.*?)\n---/s,
    TAG_ARRAY: /^tags:\s*\[(.*?)\]$/gm,
    TAG_LIST: /^tags:\s*\n((?:\s*-\s*[^\n]+\n?)+)/gm,
    SINGLE_TAG: /^tag:\s*(.+)$/gm,
    TAG_LINE_MATCH: /^\s*-\s*([^\n]+)$/gm,
    EMPTY_LINES: /\n\n+/g,
    TRIM_LINES: /^\n+|\n+$/g
};
exports.UI_CONSTANTS = {
    BATCH_SIZE: 10,
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    NOTIFICATION_DURATION: 3000
};
exports.CSS_STYLES = {
    HEADER_CONTROL: `
		display: flex;
		align-items: center;
		gap: 10px;
		font-weight: bold;
		font-size: 12px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	`,
    PATTERN_CONTROL: `
		display: flex;
		align-items: center;
		gap: 10px;
	`,
    TAG_PILL: `
		background: var(--interactive-accent);
		color: var(--text-on-accent);
		padding: 2px 8px;
		border-radius: 12px;
		font-size: 12px;
		cursor: pointer;
		user-select: none;
	`,
    PREVIEW_CONTENT: `
		background: var(--background-secondary);
		padding: 10px;
		border-radius: 5px;
		max-height: 200px;
		overflow-y: auto;
		font-size: 12px;
	`
};
