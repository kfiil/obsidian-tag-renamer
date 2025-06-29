/**
 * Plugin Type Definitions
 * Defines interfaces for the main plugin and its components
 */

import { Plugin, TFolder, TFile } from 'obsidian';
import { TagRenamerSettings } from './interfaces';

export interface TagRenamerPlugin extends Plugin {
    settings: TagRenamerSettings;
    
    // Core plugin methods
    loadSettings(): Promise<void>;
    saveSettings(): Promise<void>;
    
    // Tag processing methods
    renameTags(folder: TFolder): Promise<void>;
    removeDuplicatesFromFolder(folder: TFolder): Promise<void>;
    removeDuplicatesFromFile(file: TFile): Promise<boolean>;
    getAllTagsInVault(): Promise<string[]>;
    
    // Import/Export methods
    exportPatternsToJson(): string;
    importPatternsFromJson(jsonData: string, mergeMode?: boolean): any;
    validateImportData(data: any): any;
    
    // UI methods
    showRenameConfirmation(folder: TFolder): void;
    showDuplicateRemovalConfirmation(folder: TFolder): void;
}