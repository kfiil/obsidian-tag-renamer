/**
 * Import Patterns Modal - Extracted from main.ts following TDD
 * Handles importing tag rename patterns from JSON files
 */

import { App, Modal, Notice } from 'obsidian';
import { TagRenamerPlugin } from '../../types/plugin-types';
import { CSS_STYLES } from '../../constants/patterns';

// Type for settings tab interface (to avoid circular dependency)
interface SettingsTab {
    display(): void;
}

export class ImportPatternsModal extends Modal {
	plugin: TagRenamerPlugin;
	settingsTab: SettingsTab;

	constructor(app: App, plugin: TagRenamerPlugin, settingsTab: SettingsTab) {
		super(app);
		this.plugin = plugin;
		this.settingsTab = settingsTab;
	}

	onOpen(): void {
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

		modeContainer.createEl('input', {
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
						previewContent.textContent = `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`;
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

	onClose(): void {
		const {contentEl} = this;
		contentEl.empty();
	}
}