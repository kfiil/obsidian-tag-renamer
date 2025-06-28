import { App, TFolder, TFile, Notice } from 'obsidian';
import { TagProcessor } from './TagProcessor';
import { RenamePattern } from '../types/interfaces';

export class FileService {
	private app: App;
	private tagProcessor: TagProcessor;

	constructor(app: App) {
		this.app = app;
		this.tagProcessor = new TagProcessor();
	}

	getAllMarkdownFiles(folder: TFolder): TFile[] {
		const files: TFile[] = [];
		
		const processFolder = (currentFolder: TFolder) => {
			for (const child of currentFolder.children) {
				if (child instanceof TFile && child.extension === 'md') {
					files.push(child);
				} else if (child instanceof TFolder) {
					processFolder(child);
				}
			}
		};

		processFolder(folder);
		return files;
	}

	async getAllTagsInVault(): Promise<string[]> {
		const allTags = new Set<string>();
		const markdownFiles = this.app.vault.getMarkdownFiles();

		// Process files in batches to avoid memory issues
		const BATCH_SIZE = 10;
		for (let i = 0; i < markdownFiles.length; i += BATCH_SIZE) {
			const batch = markdownFiles.slice(i, i + BATCH_SIZE);
			const batchPromises = batch.map(async (file) => {
				try {
					const content = await this.app.vault.read(file);
					return this.tagProcessor.extractTagsFromContent(content);
				} catch (error) {
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

	async removeDuplicatesFromFile(file: TFile): Promise<boolean> {
		try {
			const content = await this.app.vault.read(file);
			const modifiedContent = this.tagProcessor.removeDuplicateTagsFromContent(content);
			
			if (modifiedContent !== content) {
				await this.app.vault.modify(file, modifiedContent);
				new Notice(`Removed duplicate tags from ${file.name}`);
				return true;
			} else {
				new Notice(`No duplicate tags found in ${file.name}`);
				return false;
			}
		} catch (error) {
			console.error(`Error processing file ${file.path}:`, error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			new Notice(`Error processing ${file.name}: ${errorMessage}`);
			return false;
		}
	}

	async removeDuplicatesFromFolder(folder: TFolder): Promise<void> {
		const files = this.getAllMarkdownFiles(folder);
		let processedCount = 0;
		let modifiedCount = 0;

		new Notice(`Processing ${files.length} files for duplicate tags...`);

		for (const file of files) {
			const wasModified = await this.removeDuplicatesFromFile(file);
			if (wasModified) {
				modifiedCount++;
			}
			processedCount++;
		}

		new Notice(`Completed! Processed ${processedCount} files, removed duplicates from ${modifiedCount} files.`);
	}

	async renameTags(folder: TFolder, patterns: RenamePattern[]): Promise<void> {
		const validPatterns = patterns.filter(p => 
			p.search && (p.removeMode || p.replace)
		);
		
		if (validPatterns.length === 0) {
			new Notice('No rename patterns configured. Please add patterns in settings.');
			return;
		}

		const files = this.getAllMarkdownFiles(folder);
		let processedCount = 0;
		let modifiedCount = 0;

		new Notice(`Processing ${files.length} files...`);

		for (const file of files) {
			try {
				const content = await this.app.vault.read(file);
				const modifiedContent = this.tagProcessor.processFileContent(content, validPatterns);
				
				if (modifiedContent !== content) {
					await this.app.vault.modify(file, modifiedContent);
					modifiedCount++;
				}
				processedCount++;
			} catch (error) {
				console.error(`Error processing file ${file.path}:`, error);
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				new Notice(`Error processing ${file.name}: ${errorMessage}`);
			}
		}

		new Notice(`Completed! Processed ${processedCount} files, modified ${modifiedCount} files.`);
	}
}