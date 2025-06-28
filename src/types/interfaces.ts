export interface RenamePattern {
	search: string;
	replace: string;
	removeMode?: boolean; // true = remove tag, false/undefined = replace tag
}

export interface TagRenamerSettings {
	renamePatterns: RenamePattern[];
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