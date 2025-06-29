/**
 * Duplicate Removal Confirmation Modal - Extracted from main.ts following TDD
 * Handles user confirmation before removing duplicate tags from a folder
 */

import { App, Modal, TFolder } from 'obsidian';
import { TagRenamerPlugin } from '../../types/plugin-types';

export class DuplicateRemovalConfirmationModal extends Modal {
	plugin: TagRenamerPlugin;
	folder: TFolder;

	constructor(app: App, plugin: TagRenamerPlugin, folder: TFolder) {
		super(app);
		this.plugin = plugin;
		this.folder = folder;
	}

	onOpen(): void {
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

	onClose(): void {
		const {contentEl} = this;
		contentEl.empty();
	}
}