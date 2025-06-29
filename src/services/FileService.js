"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
const obsidian_1 = require("obsidian");
const TagProcessor_1 = require("./TagProcessor");
const TagPropertyProcessor_1 = require("./TagPropertyProcessor");
class FileService {
    constructor(app) {
        this.app = app;
        this.tagProcessor = new TagProcessor_1.TagProcessor();
        this.propertyProcessor = new TagPropertyProcessor_1.TagPropertyProcessor();
    }
    getAllMarkdownFiles(folder) {
        const files = [];
        const processFolder = (currentFolder) => {
            for (const child of currentFolder.children) {
                if (child instanceof obsidian_1.TFile && child.extension === 'md') {
                    files.push(child);
                }
                else if (child instanceof obsidian_1.TFolder) {
                    processFolder(child);
                }
            }
        };
        processFolder(folder);
        return files;
    }
    async getAllTagsInVault() {
        const allTags = new Set();
        const markdownFiles = this.app.vault.getMarkdownFiles();
        // Process files in batches to avoid memory issues
        const BATCH_SIZE = 10;
        for (let i = 0; i < markdownFiles.length; i += BATCH_SIZE) {
            const batch = markdownFiles.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async (file) => {
                try {
                    const content = await this.app.vault.read(file);
                    return this.tagProcessor.extractTagsFromContent(content);
                }
                catch (error) {
                    console.error(`Error reading file ${file.path}:`, error);
                    return [];
                }
            });
            const batchResults = await Promise.all(batchPromises);
            batchResults.forEach(tags => {
                tags.forEach(tag => allTags.add(tag));
            });
        }
        return Array.from(allTags).sort();
    }
    async removeDuplicatesFromFile(file) {
        try {
            const content = await this.app.vault.read(file);
            const modifiedContent = this.tagProcessor.removeDuplicateTagsFromContent(content);
            if (modifiedContent !== content) {
                await this.app.vault.modify(file, modifiedContent);
                new obsidian_1.Notice(`Removed duplicate tags from ${file.name}`);
                return true;
            }
            else {
                new obsidian_1.Notice(`No duplicate tags found in ${file.name}`);
                return false;
            }
        }
        catch (error) {
            console.error(`Error processing file ${file.path}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            new obsidian_1.Notice(`Error processing ${file.name}: ${errorMessage}`);
            return false;
        }
    }
    async removeDuplicatesFromFolder(folder) {
        const files = this.getAllMarkdownFiles(folder);
        let processedCount = 0;
        let modifiedCount = 0;
        new obsidian_1.Notice(`Processing ${files.length} files for duplicate tags...`);
        for (const file of files) {
            const wasModified = await this.removeDuplicatesFromFile(file);
            if (wasModified) {
                modifiedCount++;
            }
            processedCount++;
        }
        new obsidian_1.Notice(`Completed! Processed ${processedCount} files, removed duplicates from ${modifiedCount} files.`);
    }
    async renameTags(folder, patterns) {
        const validPatterns = patterns.filter(p => p.search && (p.removeMode || p.replace));
        if (validPatterns.length === 0) {
            new obsidian_1.Notice('No rename patterns configured. Please add patterns in settings.');
            return;
        }
        const files = this.getAllMarkdownFiles(folder);
        let processedCount = 0;
        let modifiedCount = 0;
        new obsidian_1.Notice(`Processing ${files.length} files...`);
        for (const file of files) {
            try {
                const content = await this.app.vault.read(file);
                const modifiedContent = this.tagProcessor.processFileContent(content, validPatterns);
                if (modifiedContent !== content) {
                    await this.app.vault.modify(file, modifiedContent);
                    modifiedCount++;
                }
                processedCount++;
            }
            catch (error) {
                console.error(`Error processing file ${file.path}:`, error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                new obsidian_1.Notice(`Error processing ${file.name}: ${errorMessage}`);
            }
        }
        new obsidian_1.Notice(`Completed! Processed ${processedCount} files, modified ${modifiedCount} files.`);
    }
    /**
     * Renames tag properties in a single file
     */
    async renameTagPropertiesInFile(file, patterns) {
        if (patterns.length === 0) {
            return false;
        }
        try {
            const content = await this.app.vault.read(file);
            const modifiedContent = this.propertyProcessor.renameTagProperties(content, patterns);
            if (modifiedContent !== content) {
                await this.app.vault.modify(file, modifiedContent);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error(`Error processing file ${file.path}:`, error);
            throw error;
        }
    }
    /**
     * Renames tag properties in all markdown files within a folder
     */
    async renameTagProperties(folder, patterns) {
        const validPatterns = patterns.filter(p => p.from && p.to);
        if (validPatterns.length === 0) {
            new obsidian_1.Notice('No property rename patterns configured. Please add patterns in settings.');
            return;
        }
        const files = this.getAllMarkdownFiles(folder);
        let processedCount = 0;
        let modifiedCount = 0;
        new obsidian_1.Notice(`Processing ${files.length} files for property renaming...`);
        for (const file of files) {
            try {
                const wasModified = await this.renameTagPropertiesInFile(file, validPatterns);
                if (wasModified) {
                    modifiedCount++;
                }
                processedCount++;
            }
            catch (error) {
                console.error(`Error processing file ${file.path}:`, error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                new obsidian_1.Notice(`Error processing ${file.name}: ${errorMessage}`);
            }
        }
        new obsidian_1.Notice(`Property renaming completed! Processed ${processedCount} files, modified ${modifiedCount} files.`);
    }
    /**
     * Finds all custom tag properties in the vault
     */
    async findCustomTagPropertiesInVault() {
        const allProperties = new Set();
        const markdownFiles = this.app.vault.getMarkdownFiles();
        // Process files in batches to avoid memory issues
        const BATCH_SIZE = 10;
        for (let i = 0; i < markdownFiles.length; i += BATCH_SIZE) {
            const batch = markdownFiles.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async (file) => {
                try {
                    const content = await this.app.vault.read(file);
                    return this.propertyProcessor.findCustomTagProperties(content);
                }
                catch (error) {
                    console.error(`Error reading file ${file.path}:`, error);
                    return [];
                }
            });
            const batchResults = await Promise.all(batchPromises);
            batchResults.forEach(properties => {
                properties.forEach(prop => allProperties.add(prop));
            });
        }
        return Array.from(allProperties).sort();
    }
}
exports.FileService = FileService;
