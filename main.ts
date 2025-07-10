import { Editor, MarkdownView, Notice, Plugin, TFolder, TFile, Menu } from 'obsidian';
import { RenamePattern, TagRenamerSettings, ImportValidationResult, ImportResult, ExportData } from './src/types/interfaces';
import { FileService } from './src/services/FileService';
import { TocService } from './src/services/TocService';
import { RenameConfirmationModal } from './src/ui/modals/rename-confirmation-modal';
import { DuplicateRemovalConfirmationModal } from './src/ui/modals/duplicate-removal-modal';
import { TagRenamerSettingTab } from './src/ui/settings/settings-tab';

const DEFAULT_SETTINGS: TagRenamerSettings = {
	renamePatterns: [],
	propertyRenamePatterns: [],
	tocOptions: {
		maxDepth: 3,
		includeLinks: true,
		tocTitle: 'Table of Contents'
	}
}

export default class TagRenamerPlugin extends Plugin {
	settings!: TagRenamerSettings;
	private fileService!: FileService;
	private tocService!: TocService;

	async onload() {
		await this.loadSettings();
		
		// Initialize services
		this.fileService = new FileService(this.app);
		this.tocService = new TocService(this.app);

		// This creates an icon in the left ribbon.
		this.addRibbonIcon('tag', 'Tag Renamer', () => {
			// Called when the user clicks the icon.
			new Notice('Tag Renamer is active!');
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Tag Renamer');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-tag-renamer-settings',
			name: 'Open Tag Renamer settings',
			callback: () => {
				(this.app as any).setting.open();
				(this.app as any).setting.openTabById('tag-renamer');
			}
		});

		// Add command to remove duplicate tags from current file
		this.addCommand({
			id: 'remove-duplicate-tags-current',
			name: 'Remove duplicate tags from current file',
			editorCallback: async (_editor: Editor, ctx) => {
				const view = ctx as MarkdownView;
				const file = view.file;
				if (!file) {
					new Notice('No active file');
					return;
				}
				await this.removeDuplicatesFromFile(file);
			}
		});

		// Add command to insert/update TOC in current file
		this.addCommand({
			id: 'insert-toc-current',
			name: 'Insert/Update TOC in current file',
			editorCallback: async (_editor: Editor, ctx) => {
				const view = ctx as MarkdownView;
				const file = view.file;
				if (!file) {
					new Notice('No active file');
					return;
				}
				await this.insertTocInFile(file);
			}
		});
		
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TagRenamerSettingTab(this.app, this));

		// Register context menu for folders
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu: Menu, file) => {
				const folder = file as TFolder;
				if (folder instanceof TFolder) {
					menu.addItem((item) => {
						item
							.setTitle('Rename tags in folder')
							.setIcon('tag')
							.onClick(() => {
								this.showRenameConfirmation(folder);
							});
					});
					
					menu.addItem((item) => {
						item
							.setTitle('Remove duplicate tags in folder')
							.setIcon('layers')
							.onClick(() => {
								this.showDuplicateRemovalConfirmation(folder);
							});
					});
					
					menu.addItem((item) => {
						item
							.setTitle('Rename tag properties in folder')
							.setIcon('file-text')
							.onClick(() => {
								this.showPropertyRenameConfirmation(folder);
							});
					});
					
					menu.addItem((item) => {
						item
							.setTitle('Insert/Update TOC in folder')
							.setIcon('list')
							.onClick(() => {
								this.insertTocInFolder(folder);
							});
					});
				}
			})
		);

	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	showRenameConfirmation(folder: TFolder) {
		new RenameConfirmationModal(this.app, this, folder).open();
	}

	showDuplicateRemovalConfirmation(folder: TFolder) {
		new DuplicateRemovalConfirmationModal(this.app, this, folder).open();
	}

	showPropertyRenameConfirmation(folder: TFolder) {
		// Check if there are any property rename patterns configured
		const patterns = this.settings.propertyRenamePatterns || [];
		const validPatterns = patterns.filter(p => p.from && p.to);
		
		if (validPatterns.length === 0) {
			new Notice('No property rename patterns configured. Please add patterns in settings first.');
			return;
		}
		
		// For now, directly proceed with renaming - in the future we could add a confirmation modal
		this.renameTagProperties(folder);
	}

	async removeDuplicatesFromFile(file: TFile): Promise<boolean> {
		return await this.fileService.removeDuplicatesFromFile(file);
	}

	async removeDuplicatesFromFolder(folder: TFolder) {
		await this.fileService.removeDuplicatesFromFolder(folder);
	}

	async renameTags(folder: TFolder) {
		await this.fileService.renameTags(folder, this.settings.renamePatterns);
	}

	async getAllTagsInVault(): Promise<string[]> {
		return await this.fileService.getAllTagsInVault();
	}

	exportPatternsToJson(): string {
		const exportData: ExportData = {
			version: "1.0",
			exportDate: new Date().toISOString(),
			pluginName: "Tag Renamer",
			patterns: this.settings.renamePatterns,
			propertyPatterns: this.settings.propertyRenamePatterns || []
		};
		return JSON.stringify(exportData, null, 2);
	}

	validateImportData(data: any): ImportValidationResult {
		if (!data || typeof data !== 'object') {
			return { valid: false, error: 'Invalid JSON format' };
		}

		if (!data.patterns || !Array.isArray(data.patterns)) {
			return { valid: false, error: 'Missing or invalid patterns array' };
		}

		for (let i = 0; i < data.patterns.length; i++) {
			const pattern = data.patterns[i];
			if (!pattern || typeof pattern !== 'object') {
				return { valid: false, error: `Pattern ${i + 1} is invalid` };
			}
			if (typeof pattern.search !== 'string' || typeof pattern.replace !== 'string') {
				return { valid: false, error: `Pattern ${i + 1} must have search and replace strings` };
			}
			if (pattern.removeMode !== undefined && typeof pattern.removeMode !== 'boolean') {
				return { valid: false, error: `Pattern ${i + 1} removeMode must be boolean` };
			}
		}

		// Validate property patterns if present
		if (data.propertyPatterns) {
			if (!Array.isArray(data.propertyPatterns)) {
				return { valid: false, error: 'Property patterns must be an array' };
			}

			for (let i = 0; i < data.propertyPatterns.length; i++) {
				const pattern = data.propertyPatterns[i];
				if (!pattern || typeof pattern !== 'object') {
					return { valid: false, error: `Property pattern ${i + 1} is invalid` };
				}
				if (typeof pattern.from !== 'string' || typeof pattern.to !== 'string') {
					return { valid: false, error: `Property pattern ${i + 1} must have from and to strings` };
				}
			}
		}

		return { valid: true };
	}

	importPatternsFromJson(jsonString: string, mergeMode: boolean = false): ImportResult {
		try {
			const data = JSON.parse(jsonString);
			const validation = this.validateImportData(data);
			
			if (!validation.valid) {
				return { success: false, error: validation.error };
			}

			// Ensure backwards compatibility by setting removeMode to false if not specified
			const importedPatterns: RenamePattern[] = data.patterns.map((pattern: any) => ({
				search: pattern.search,
				replace: pattern.replace,
				removeMode: pattern.removeMode || false
			}));

			// Handle property patterns if present
			const importedPropertyPatterns = data.propertyPatterns ? 
				data.propertyPatterns.map((pattern: any) => ({
					from: pattern.from,
					to: pattern.to
				})) : [];
			
			if (mergeMode) {
				// Add new patterns to existing ones
				this.settings.renamePatterns.push(...importedPatterns);
				if (importedPropertyPatterns.length > 0) {
					if (!this.settings.propertyRenamePatterns) {
						this.settings.propertyRenamePatterns = [];
					}
					this.settings.propertyRenamePatterns.push(...importedPropertyPatterns);
				}
			} else {
				// Replace all patterns
				this.settings.renamePatterns = importedPatterns;
				this.settings.propertyRenamePatterns = importedPropertyPatterns;
			}

			this.saveSettings();
			return { 
				success: true, 
				imported: importedPatterns.length + importedPropertyPatterns.length 
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: 'Invalid JSON format: ' + errorMessage };
		}
	}

	async renameTagProperties(folder: TFolder): Promise<void> {
		await this.fileService.renameTagProperties(folder, this.settings.propertyRenamePatterns || []);
	}

	async findCustomTagPropertiesInVault(): Promise<string[]> {
		return await this.fileService.findCustomTagPropertiesInVault();
	}

	async insertTocInFile(file: TFile): Promise<void> {
		const tocOptions = this.settings.tocOptions || DEFAULT_SETTINGS.tocOptions!;
		const success = await this.tocService.insertTocInFile(file, tocOptions);
		
		if (success) {
			new Notice(`TOC updated in ${file.name}`);
		} else {
			// Check if file has headings
			const content = await this.app.vault.read(file);
			if (!this.tocService.hasHeadings(content)) {
				new Notice(`No headings found in ${file.name}`);
			} else {
				new Notice(`No changes needed in ${file.name}`);
			}
		}
	}

	async insertTocInFolder(folder: TFolder): Promise<void> {
		const tocOptions = this.settings.tocOptions || DEFAULT_SETTINGS.tocOptions!;
		let processedCount = 0;
		let updatedCount = 0;

		const processFile = async (file: TFile) => {
			if (file.extension === 'md') {
				processedCount++;
				const content = await this.app.vault.read(file);
				
				if (this.tocService.hasHeadings(content)) {
					const success = await this.tocService.insertTocInFile(file, tocOptions);
					if (success) {
						updatedCount++;
					}
				}
			}
		};

		const processFolder = async (currentFolder: TFolder) => {
			// Process files in current folder
			for (const child of currentFolder.children) {
				if (child instanceof TFile) {
					await processFile(child);
				} else if (child instanceof TFolder) {
					await processFolder(child);
				}
			}
		};

		new Notice('Inserting/updating TOCs in folder...');
		await processFolder(folder);
		
		new Notice(`TOC processing complete: ${updatedCount} files updated out of ${processedCount} processed`);
	}
}

