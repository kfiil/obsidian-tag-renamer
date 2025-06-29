/**
 * Tag Renamer Settings Tab - Extracted from main.ts following TDD
 * Handles plugin configuration UI and pattern management
 */

import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import { TagRenamerPlugin } from '../../types/plugin-types';
import { RenamePattern } from '../../types/interfaces';
import { CSS_STYLES } from '../../constants/patterns';
import { ImportPatternsModal } from '../modals/import-patterns-modal';

export class TagRenamerSettingTab extends PluginSettingTab {
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
						new Notice('Error scanning vault: ' + (error instanceof Error ? error.message : String(error)));
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