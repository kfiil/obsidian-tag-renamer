import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFolder, TFile, Menu } from 'obsidian';
import { RenamePattern, TagRenamerSettings, ImportValidationResult, ImportResult, ExportData } from './src/types/interfaces';
import { FileService } from './src/services/FileService';
import { TagProcessor } from './src/services/TagProcessor';
import { CSS_STYLES } from './src/constants/patterns';

const DEFAULT_SETTINGS: TagRenamerSettings = {
	renamePatterns: []
}

export default class TagRenamerPlugin extends Plugin {
	settings: TagRenamerSettings;
	private fileService: FileService;
	private tagProcessor: TagProcessor;

	async onload() {
		await this.loadSettings();
		
		// Initialize services
		this.fileService = new FileService(this.app);
		this.tagProcessor = new TagProcessor();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('tag', 'Tag Renamer', (evt: MouseEvent) => {
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
			editorCallback: async (editor: Editor, ctx) => {
				const view = ctx as MarkdownView;
				const file = view.file;
				if (!file) {
					new Notice('No active file');
					return;
				}
				await this.removeDuplicatesFromFile(file);
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
			patterns: this.settings.renamePatterns
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
			
			if (mergeMode) {
				// Add new patterns to existing ones
				this.settings.renamePatterns.push(...importedPatterns);
			} else {
				// Replace all patterns
				this.settings.renamePatterns = importedPatterns;
			}

			this.saveSettings();
			return { success: true, imported: importedPatterns.length };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: 'Invalid JSON format: ' + errorMessage };
		}
	}
}

class RenameConfirmationModal extends Modal {
	plugin: TagRenamerPlugin;
	folder: TFolder;

	constructor(app: App, plugin: TagRenamerPlugin, folder: TFolder) {
		super(app);
		this.plugin = plugin;
		this.folder = folder;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();

		contentEl.createEl('h2', {text: 'Rename Tags - Warning'});
		
		contentEl.createEl('p', {
			text: `⚠️ This action will modify files in the folder "${this.folder.name}" and all its subfolders.`
		});

		contentEl.createEl('p', {
			text: 'IMPORTANT: Please backup your vault before proceeding. This operation cannot be undone.'
		});

		const patternCount = this.plugin.settings.renamePatterns.filter(p => p.search && p.replace).length;
		contentEl.createEl('p', {
			text: `${patternCount} rename pattern(s) will be applied to all markdown files in this folder.`
		});

		if (patternCount === 0) {
			contentEl.createEl('p', {
				text: 'No valid rename patterns found. Please configure patterns in the plugin settings first.',
				cls: 'mod-warning'
			});
		}

		const buttonContainer = contentEl.createDiv('modal-button-container');
		
		const cancelButton = buttonContainer.createEl('button', {
			text: 'Cancel',
			cls: 'mod-cta'
		});
		cancelButton.onclick = () => this.close();

		if (patternCount > 0) {
			const proceedButton = buttonContainer.createEl('button', {
				text: 'Proceed with Rename',
				cls: 'mod-warning'
			});
			proceedButton.onclick = () => {
				this.close();
				this.plugin.renameTags(this.folder);
			};
		}
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class DuplicateRemovalConfirmationModal extends Modal {
	plugin: TagRenamerPlugin;
	folder: TFolder;

	constructor(app: App, plugin: TagRenamerPlugin, folder: TFolder) {
		super(app);
		this.plugin = plugin;
		this.folder = folder;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();

		contentEl.createEl('h2', {text: 'Remove Duplicate Tags - Warning'});
		
		contentEl.createEl('p', {
			text: `⚠️ This action will modify files in the folder "${this.folder.name}" and all its subfolders.`
		});

		contentEl.createEl('p', {
			text: 'IMPORTANT: Please backup your vault before proceeding. This operation cannot be undone.'
		});

		contentEl.createEl('p', {
			text: 'This will remove duplicate tags from the frontmatter of all markdown files in this folder.'
		});

		contentEl.createEl('p', {
			text: 'Example: tags: [work, personal, work] → tags: [work, personal]',
			cls: 'setting-item-description'
		});

		const buttonContainer = contentEl.createDiv('modal-button-container');
		
		const cancelButton = buttonContainer.createEl('button', {
			text: 'Cancel',
			cls: 'mod-cta'
		});
		cancelButton.onclick = () => this.close();

		const proceedButton = buttonContainer.createEl('button', {
			text: 'Remove Duplicates',
			cls: 'mod-warning'
		});
		proceedButton.onclick = () => {
			this.close();
			this.plugin.removeDuplicatesFromFolder(this.folder);
		};
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class TagRenamerSettingTab extends PluginSettingTab {
	plugin: TagRenamerPlugin;
	allTags: string[] = [];

	constructor(app: App, plugin: TagRenamerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async display(): Promise<void> {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Tag Renamer Settings'});

		// Tag Discovery Section
		new Setting(containerEl)
			.setName('Tag Discovery')
			.setDesc('Find all tags in your vault for inspiration')
			.setHeading();

		const tagDiscoveryContainer = containerEl.createDiv();
		
		new Setting(tagDiscoveryContainer)
			.setName('Discover Tags')
			.setDesc('Scan your vault to find all existing tags')
			.addButton(button => button
				.setButtonText('Scan Vault')
				.setCta()
				.onClick(async () => {
					button.setButtonText('Scanning...');
					button.setDisabled(true);
					try {
						this.allTags = await this.plugin.getAllTagsInVault();
						this.displayFoundTags(tagDiscoveryContainer);
						new Notice(`Found ${this.allTags.length} unique tags`);
					} catch (error) {
						new Notice('Error scanning vault: ' + error.message);
					}
					button.setButtonText('Scan Vault');
					button.setDisabled(false);
				}));

		this.displayFoundTags(tagDiscoveryContainer);

		// Export/Import Section
		new Setting(containerEl)
			.setName('Export & Import')
			.setDesc('Share patterns between vaults or import from other sources')
			.setHeading();

		new Setting(containerEl)
			.setName('Export Patterns')
			.setDesc('Export all current patterns to JSON file')
			.addButton(button => button
				.setButtonText('Export to JSON')
				.setIcon('download')
				.onClick(() => {
					this.exportPatterns();
				}));

		new Setting(containerEl)
			.setName('Import Patterns')
			.setDesc('Import patterns from JSON file')
			.addButton(button => button
				.setButtonText('Import from JSON')
				.setIcon('upload')
				.onClick(() => {
					this.importPatterns();
				}));

		// Rename Patterns Section
		new Setting(containerEl)
			.setName('Tag Rename Patterns')
			.setDesc('Define patterns to rename tags across your vault')
			.setHeading();

		// Add column headers
		if (this.plugin.settings.renamePatterns.length > 0) {
			this.createPatternHeaders(containerEl);
		}

		this.plugin.settings.renamePatterns.forEach((pattern, index) => {
			this.createPatternSetting(containerEl, pattern, index);
		});

		// Action buttons
		const actionSetting = new Setting(containerEl);
		
		// Add sort button if there are patterns to sort
		if (this.plugin.settings.renamePatterns.length > 1) {
			actionSetting.addButton(button => button
				.setButtonText('Sort Patterns')
				.setIcon('arrow-up-down')
				.setTooltip('Sort by mode (replace first, then remove) and alphabetically')
				.onClick(async () => {
					this.sortPatterns();
					await this.plugin.saveSettings();
					this.display();
					new Notice('Patterns sorted successfully');
				}));
		}
		
		// Add pattern button
		actionSetting.addButton(button => button
			.setButtonText('Add Pattern')
			.setCta()
			.onClick(() => {
				this.plugin.settings.renamePatterns.push({ search: '', replace: '', removeMode: false });
				this.plugin.saveSettings();
				this.display();
			}));
	}

	createPatternHeaders(containerEl: HTMLElement): void {
		const headerSetting = new Setting(containerEl)
			.setClass('pattern-header');

		// Create header layout
		const headerControl = headerSetting.settingEl.querySelector('.setting-item-control');
		if (headerControl instanceof HTMLElement) {
			headerControl.innerHTML = '';
			headerControl.style.cssText = CSS_STYLES.HEADER_CONTROL;

			const searchHeader = headerControl.createEl('div', {text: 'Search'});
			searchHeader.style.width = '35%';

			const removeHeader = headerControl.createEl('div', {text: 'Remove'});
			removeHeader.style.width = '60px';
			removeHeader.style.textAlign = 'center';

			const replaceHeader = headerControl.createEl('div', {text: 'Replace With'});
			replaceHeader.style.width = '35%';

			const actionHeader = headerControl.createEl('div', {text: 'Action'});
			actionHeader.style.width = '40px';
			actionHeader.style.textAlign = 'center';
		}

		// Hide the setting name area for headers
		const settingInfo = headerSetting.settingEl.querySelector('.setting-item-info');
		if (settingInfo instanceof HTMLElement) {
			settingInfo.style.display = 'none';
		}
	}

	createPatternSetting(containerEl: HTMLElement, pattern: RenamePattern, index: number): void {
		const setting = new Setting(containerEl)
			.addText(text => text
				.setPlaceholder('Search for...')
				.setValue(pattern.search)
				.onChange(async (value) => {
					this.plugin.settings.renamePatterns[index].search = value;
					await this.plugin.saveSettings();
				}))
			.addToggle(toggle => toggle
				.setValue(pattern.removeMode || false)
				.setTooltip('Enable to remove tag instead of replacing')
				.onChange(async (value) => {
					this.plugin.settings.renamePatterns[index].removeMode = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to update UI state
				}))
			.addText(text => text
				.setPlaceholder(pattern.removeMode ? 'Remove mode (ignored)' : 'Replace with...')
				.setValue(pattern.replace)
				.setDisabled(pattern.removeMode || false)
				.onChange(async (value) => {
					this.plugin.settings.renamePatterns[index].replace = value;
					await this.plugin.saveSettings();
				}))
			.addButton(button => button
				.setIcon('trash')
				.setTooltip('Remove pattern')
				.onClick(() => {
					this.plugin.settings.renamePatterns.splice(index, 1);
					this.plugin.saveSettings();
					this.display();
				}));

		// Style the components to align with headers
		const settingControl = setting.settingEl.querySelector('.setting-item-control');
		if (settingControl instanceof HTMLElement) {
			settingControl.style.cssText = CSS_STYLES.PATTERN_CONTROL;
			
			const elements = settingControl.children;
			if (elements.length >= 4) {
				(elements[0] as HTMLElement).style.width = '35%'; // Search input
				(elements[1] as HTMLElement).style.width = '60px'; // Toggle
				(elements[1] as HTMLElement).style.textAlign = 'center';
				(elements[2] as HTMLElement).style.width = '35%'; // Replace input
				(elements[3] as HTMLElement).style.width = '40px'; // Delete button
				(elements[3] as HTMLElement).style.textAlign = 'center';
			}
		}

		// Hide the setting name area
		const settingInfo = setting.settingEl.querySelector('.setting-item-info');
		if (settingInfo instanceof HTMLElement) {
			settingInfo.style.display = 'none';
		}
	}

	getMappedTags(): Set<string> {
		const mappedTags = new Set<string>();
		for (const pattern of this.plugin.settings.renamePatterns) {
			if (pattern.search && pattern.search.trim()) {
				mappedTags.add(pattern.search.trim());
			}
		}
		return mappedTags;
	}

	sortPatterns(): void {
		this.plugin.settings.renamePatterns.sort((a, b) => {
			// First sort by mode: replace patterns (false/undefined) before remove patterns (true)
			const aModeValue = a.removeMode ? 1 : 0;
			const bModeValue = b.removeMode ? 1 : 0;
			
			if (aModeValue !== bModeValue) {
				return aModeValue - bModeValue;
			}
			
			// Then sort alphabetically by search term
			return a.search.toLowerCase().localeCompare(b.search.toLowerCase());
		});
	}

	displayFoundTags(container: HTMLElement): void {
		// Remove existing tag display
		const existingTagsDiv = container.querySelector('.tag-discovery-results');
		if (existingTagsDiv) {
			existingTagsDiv.remove();
		}

		if (this.allTags.length === 0) return;

		// Filter out tags that are already mapped in patterns
		const mappedTags = this.getMappedTags();
		const unmappedTags = this.allTags.filter(tag => !mappedTags.has(tag)).sort((a, b) => 
			a.toLowerCase().localeCompare(b.toLowerCase())
		);

		const tagsDiv = container.createDiv('tag-discovery-results');
		
		if (unmappedTags.length === 0) {
			tagsDiv.createEl('h4', {text: 'Found Tags'});
			tagsDiv.createEl('p', {
				text: `All ${this.allTags.length} discovered tags are already mapped in patterns above.`,
				cls: 'setting-item-description'
			});
			return;
		}

		tagsDiv.createEl('h4', {text: `Available Tags (${unmappedTags.length})`});
		
		const subtitleText = mappedTags.size > 0 
			? `Click to add patterns • ${mappedTags.size} already mapped, ${unmappedTags.length} available`
			: 'Click on any tag to add it to a new pattern search field';
			
		tagsDiv.createEl('p', {
			text: subtitleText,
			cls: 'setting-item-description'
		});

		const tagContainer = tagsDiv.createDiv('tag-container');
		tagContainer.style.display = 'flex';
		tagContainer.style.flexWrap = 'wrap';
		tagContainer.style.gap = '5px';
		tagContainer.style.marginTop = '10px';

		unmappedTags.forEach(tag => {
			const tagEl = tagContainer.createEl('span', {
				text: tag,
				cls: 'tag-pill'
			});
			
			tagEl.style.cssText = CSS_STYLES.TAG_PILL;

			tagEl.addEventListener('click', () => {
				this.addPatternWithTag(tag);
			});

			tagEl.addEventListener('mouseenter', () => {
				tagEl.style.opacity = '0.8';
			});

			tagEl.addEventListener('mouseleave', () => {
				tagEl.style.opacity = '1';
			});
		});
	}

	addPatternWithTag(tag: string): void {
		this.plugin.settings.renamePatterns.push({ search: tag, replace: '', removeMode: false });
		this.plugin.saveSettings();
		this.display();
		new Notice(`Added "${tag}" to search patterns`);
	}

	exportPatterns(): void {
		if (this.plugin.settings.renamePatterns.length === 0) {
			new Notice('No patterns to export');
			return;
		}

		const jsonData = this.plugin.exportPatternsToJson();
		const blob = new Blob([jsonData], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		
		const a = document.createElement('a');
		a.href = url;
		a.download = `tag-renamer-patterns-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		
		new Notice(`Exported ${this.plugin.settings.renamePatterns.length} patterns to JSON`);
	}

	importPatterns(): void {
		new ImportPatternsModal(this.app, this.plugin, this).open();
	}
}

class ImportPatternsModal extends Modal {
	plugin: TagRenamerPlugin;
	settingsTab: TagRenamerSettingTab;

	constructor(app: App, plugin: TagRenamerPlugin, settingsTab: TagRenamerSettingTab) {
		super(app);
		this.plugin = plugin;
		this.settingsTab = settingsTab;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();

		contentEl.createEl('h2', {text: 'Import Patterns from JSON'});
		
		contentEl.createEl('p', {
			text: 'Select a JSON file containing tag rename patterns to import.'
		});

		const fileInputContainer = contentEl.createDiv('file-input-container');
		fileInputContainer.style.marginBottom = '20px';

		const fileInput = fileInputContainer.createEl('input', {
			type: 'file',
			attr: { accept: '.json' }
		});
		fileInput.style.width = '100%';

		const modeContainer = contentEl.createDiv('import-mode-container');
		modeContainer.style.marginBottom = '20px';

		const modeLabel = modeContainer.createEl('label', {text: 'Import Mode:'});
		modeLabel.style.display = 'block';
		modeLabel.style.marginBottom = '10px';

		const replaceRadio = modeContainer.createEl('input', {
			type: 'radio',
			attr: { name: 'importMode', value: 'replace', checked: 'checked' }
		});
		const replaceLabel = modeContainer.createEl('label', {text: ' Replace all existing patterns'});
		replaceLabel.style.marginLeft = '5px';
		modeContainer.createEl('br');

		const mergeRadio = modeContainer.createEl('input', {
			type: 'radio',
			attr: { name: 'importMode', value: 'merge' }
		});
		const mergeLabel = modeContainer.createEl('label', {text: ' Merge with existing patterns'});
		mergeLabel.style.marginLeft = '5px';

		const previewContainer = contentEl.createDiv('preview-container');
		previewContainer.style.marginBottom = '20px';
		previewContainer.style.display = 'none';

		const previewLabel = previewContainer.createEl('h4', {text: 'Preview:'});
		const previewContent = previewContainer.createEl('pre');
		previewContent.style.cssText = CSS_STYLES.PREVIEW_CONTENT;

		fileInput.addEventListener('change', (event) => {
			const file = (event.target as HTMLInputElement).files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					const content = e.target?.result as string;
					try {
						const data = JSON.parse(content);
						const validation = this.plugin.validateImportData(data);
						
						if (validation.valid) {
							previewContent.textContent = JSON.stringify(data.patterns, null, 2);
							previewContainer.style.display = 'block';
							previewLabel.textContent = `Preview (${data.patterns.length} patterns):`;
						} else {
							previewContent.textContent = `Error: ${validation.error}`;
							previewContainer.style.display = 'block';
							previewLabel.textContent = 'Error:';
						}
					} catch (error) {
						previewContent.textContent = `Invalid JSON: ${error.message}`;
						previewContainer.style.display = 'block';
						previewLabel.textContent = 'Error:';
					}
				};
				reader.readAsText(file);
			}
		});

		const buttonContainer = contentEl.createDiv('modal-button-container');
		
		const cancelButton = buttonContainer.createEl('button', {
			text: 'Cancel',
			cls: 'mod-cta'
		});
		cancelButton.onclick = () => this.close();

		const importButton = buttonContainer.createEl('button', {
			text: 'Import',
			cls: 'mod-warning'
		});
		importButton.onclick = () => {
			const file = fileInput.files?.[0];
			if (!file) {
				new Notice('Please select a file');
				return;
			}

			const reader = new FileReader();
			reader.onload = (e) => {
				const content = e.target?.result as string;
				const mergeMode = (mergeRadio as HTMLInputElement).checked;
				const result = this.plugin.importPatternsFromJson(content, mergeMode);
				
				if (result.success) {
					new Notice(`Successfully imported ${result.imported} patterns`);
					this.settingsTab.display();
					this.close();
				} else {
					new Notice(`Import failed: ${result.error}`);
				}
			};
			reader.readAsText(file);
		};
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
