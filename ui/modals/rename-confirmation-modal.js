"use strict";
/**
 * Rename Confirmation Modal - Extracted from main.ts following TDD
 * Handles user confirmation before applying tag rename patterns to a folder
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenameConfirmationModal = void 0;
const obsidian_1 = require("obsidian");
class RenameConfirmationModal extends obsidian_1.Modal {
    constructor(app, plugin, folder) {
        super(app);
        this.plugin = plugin;
        this.folder = folder;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Rename Tags - Warning' });
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
        const { contentEl } = this;
        contentEl.empty();
    }
}
exports.RenameConfirmationModal = RenameConfirmationModal;
