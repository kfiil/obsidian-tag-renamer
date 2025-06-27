import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFolder, TFile, Menu } from 'obsidian';

interface RenamePattern {
	search: string;
	replace: string;
}

interface TagRenamerSettings {
	renamePatterns: RenamePattern[];
}

const DEFAULT_SETTINGS: TagRenamerSettings = {
	renamePatterns: []
}

export default class TagRenamerPlugin extends Plugin {
	settings: TagRenamerSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('tag', 'Tag Renamer', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('Tag Renamer is active!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Tag Renamer');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-tag-renamer-settings',
			name: 'Open Tag Renamer settings',
			callback: () => {
				// @ts-ignore
				this.app.setting.open();
				// @ts-ignore
				this.app.setting.openTabById('tag-renamer');
			}
		});
		
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TagRenamerSettingTab(this.app, this));

		// Register context menu for folders
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu: Menu, folder: TFolder) => {
				if (folder instanceof TFolder) {
					menu.addItem((item) => {
						item
							.setTitle('Rename tags in folder')
							.setIcon('tag')
							.onClick(() => {
								this.showRenameConfirmation(folder);
							});
					});
				}
			})
		);

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
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

	async renameTags(folder: TFolder) {
		const patterns = this.settings.renamePatterns.filter(p => p.search && p.replace);
		
		if (patterns.length === 0) {
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
				const modifiedContent = this.processFileContent(content, patterns);
				
				if (modifiedContent !== content) {
					await this.app.vault.modify(file, modifiedContent);
					modifiedCount++;
				}
				processedCount++;
			} catch (error) {
				console.error(`Error processing file ${file.path}:`, error);
				new Notice(`Error processing ${file.name}: ${error.message}`);
			}
		}

		new Notice(`Completed! Processed ${processedCount} files, modified ${modifiedCount} files.`);
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

	processFileContent(content: string, patterns: RenamePattern[]): string {
		// Match YAML frontmatter
		const frontmatterRegex = /^---\n(.*?)\n---/s;
		const match = content.match(frontmatterRegex);
		
		if (!match) return content;

		let frontmatter = match[1];
		let modified = false;

		// Process tag arrays (tags: [tag1, tag2])
		frontmatter = frontmatter.replace(/^tags:\s*\[(.*?)\]$/gm, (line, tagContent) => {
			let newTagContent = tagContent;
			for (const pattern of patterns) {
				const searchRegex = new RegExp(`\\b${this.escapeRegex(pattern.search)}\\b`, 'g');
				if (searchRegex.test(newTagContent)) {
					newTagContent = newTagContent.replace(searchRegex, pattern.replace);
					modified = true;
				}
			}
			return `tags: [${newTagContent}]`;
		});

		// Process tag lists (tags:\n  - tag1\n  - tag2)
		frontmatter = frontmatter.replace(/^(\s*-\s+)([^\n]+)$/gm, (line, prefix, tag) => {
			let newTag = tag;
			for (const pattern of patterns) {
				const searchRegex = new RegExp(`\\b${this.escapeRegex(pattern.search)}\\b`, 'g');
				if (searchRegex.test(newTag)) {
					newTag = newTag.replace(searchRegex, pattern.replace);
					modified = true;
				}
			}
			return `${prefix}${newTag}`;
		});

		// Process single tag line (tag: tagname)
		frontmatter = frontmatter.replace(/^tag:\s*(.+)$/gm, (line, tag) => {
			let newTag = tag;
			for (const pattern of patterns) {
				const searchRegex = new RegExp(`\\b${this.escapeRegex(pattern.search)}\\b`, 'g');
				if (searchRegex.test(newTag)) {
					newTag = newTag.replace(searchRegex, pattern.replace);
					modified = true;
				}
			}
			return `tag: ${newTag}`;
		});

		if (modified) {
			return content.replace(frontmatterRegex, `---\n${frontmatter}\n---`);
		}

		return content;
	}

	escapeRegex(string: string): string {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

class TagRenamerSettingTab extends PluginSettingTab {
	plugin: TagRenamerPlugin;

	constructor(app: App, plugin: TagRenamerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Tag Renamer Settings'});

		new Setting(containerEl)
			.setName('Tag Rename Patterns')
			.setDesc('Define patterns to rename tags across your vault')
			.setHeading();

		this.plugin.settings.renamePatterns.forEach((pattern, index) => {
			this.createPatternSetting(containerEl, pattern, index);
		});

		new Setting(containerEl)
			.addButton(button => button
				.setButtonText('Add Pattern')
				.setCta()
				.onClick(() => {
					this.plugin.settings.renamePatterns.push({ search: '', replace: '' });
					this.plugin.saveSettings();
					this.display();
				}));
	}

	createPatternSetting(containerEl: HTMLElement, pattern: RenamePattern, index: number): void {
		const setting = new Setting(containerEl)
			.setName(`Pattern ${index + 1}`)
			.addText(text => text
				.setPlaceholder('Search for...')
				.setValue(pattern.search)
				.onChange(async (value) => {
					this.plugin.settings.renamePatterns[index].search = value;
					await this.plugin.saveSettings();
				}))
			.addText(text => text
				.setPlaceholder('Replace with...')
				.setValue(pattern.replace)
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

		// Style the text inputs to be side by side
		const textInputs = setting.settingEl.querySelectorAll('input[type="text"]');
		if (textInputs.length === 2) {
			(textInputs[0] as HTMLElement).style.width = '45%';
			(textInputs[0] as HTMLElement).style.marginRight = '10px';
			(textInputs[1] as HTMLElement).style.width = '45%';
		}
	}
}
