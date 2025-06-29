export interface RenamePattern {
	search: string;
	replace: string;
	removeMode?: boolean; // true = remove tag, false/undefined = replace tag
}

export interface PropertyRenamePattern {
	from: string; // Original property name (e.g., "🗄️ Tags Database")
	to: string;   // Target property name (e.g., "tags")
}

export interface TagRenamerSettings {
	renamePatterns: RenamePattern[];
	propertyRenamePatterns?: PropertyRenamePattern[]; // Optional for backward compatibility
}

export interface ImportValidationResult {
	valid: boolean;
	error?: string;
}

export interface ImportResult {
	success: boolean;
	error?: string;
	imported?: number;
}

export interface ExportData {
	version: string;
	exportDate: string;
	pluginName: string;
	patterns: RenamePattern[];
}