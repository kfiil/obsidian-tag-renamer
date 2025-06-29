/**
 * Property Settings UI Tests
 * Tests for property rename pattern management UI components
 */

import { TestFramework } from '../../TestFramework';
import { PropertyRenamePattern } from '../../../src/types/interfaces';

const framework = new TestFramework();
export { framework as PropertySettingsUITests };
const { describe, test, expect } = framework;

// Mock DOM elements for testing UI components
class MockHTMLElement {
    public innerHTML: string = '';
    public style: Record<string, string> = {};
    public classList: string[] = [];
    public children: MockHTMLElement[] = [];
    public textContent: string = '';
    
    constructor(public tagName: string = 'div') {}
    
    createEl(tag: string, attrs?: { text?: string; cls?: string }): MockHTMLElement {
        const el = new MockHTMLElement(tag);
        if (attrs?.text) el.textContent = attrs.text;
        if (attrs?.cls) el.classList.push(attrs.cls);
        this.children.push(el);
        return el;
    }
    
    createDiv(className?: string): MockHTMLElement {
        const div = new MockHTMLElement('div');
        if (className) div.classList.push(className);
        this.children.push(div);
        return div;
    }
    
    querySelector(selector: string): MockHTMLElement | null {
        if (selector === '.setting-item-control') {
            return this.children.find(c => c.classList.includes('setting-item-control')) || null;
        }
        if (selector === '.setting-item-info') {
            return this.children.find(c => c.classList.includes('setting-item-info')) || null;
        }
        return null;
    }
    
    remove(): void {
        // Mock remove functionality
    }
    
    addEventListener(event: string, handler: Function): void {
        // Mock event listener
    }
    
    empty(): void {
        this.children = [];
        this.innerHTML = '';
    }
    
    setClass(className: string): MockHTMLElement {
        this.classList.push(className);
        return this;
    }
}

// Mock Setting class
class MockSetting {
    public settingEl: MockHTMLElement;
    
    constructor(public containerEl: MockHTMLElement) {
        this.settingEl = new MockHTMLElement('div');
        this.settingEl.classList.push('setting-item');
        containerEl.children.push(this.settingEl);
    }
    
    setName(name: string): MockSetting {
        return this;
    }
    
    setDesc(desc: string): MockSetting {
        return this;
    }
    
    setHeading(): MockSetting {
        return this;
    }
    
    setClass(className: string): MockSetting {
        this.settingEl.setClass(className);
        return this;
    }
    
    addText(callback: (text: MockTextComponent) => void): MockSetting {
        const textComponent = new MockTextComponent();
        callback(textComponent);
        return this;
    }
    
    addButton(callback: (button: MockButtonComponent) => void): MockSetting {
        const buttonComponent = new MockButtonComponent();
        callback(buttonComponent);
        return this;
    }
    
    addToggle(callback: (toggle: MockToggleComponent) => void): MockSetting {
        const toggleComponent = new MockToggleComponent();
        callback(toggleComponent);
        return this;
    }
}

class MockTextComponent {
    public value: string = '';
    public placeholder: string = '';
    public disabled: boolean = false;
    
    setPlaceholder(text: string): MockTextComponent {
        this.placeholder = text;
        return this;
    }
    
    setValue(value: string): MockTextComponent {
        this.value = value;
        return this;
    }
    
    setDisabled(disabled: boolean): MockTextComponent {
        this.disabled = disabled;
        return this;
    }
    
    onChange(callback: (value: string) => void): MockTextComponent {
        return this;
    }
}

class MockButtonComponent {
    public text: string = '';
    public icon: string = '';
    public tooltip: string = '';
    public disabled: boolean = false;
    
    setButtonText(text: string): MockButtonComponent {
        this.text = text;
        return this;
    }
    
    setIcon(icon: string): MockButtonComponent {
        this.icon = icon;
        return this;
    }
    
    setTooltip(tooltip: string): MockButtonComponent {
        this.tooltip = tooltip;
        return this;
    }
    
    setDisabled(disabled: boolean): MockButtonComponent {
        this.disabled = disabled;
        return this;
    }
    
    setCta(): MockButtonComponent {
        return this;
    }
    
    onClick(callback: () => void): MockButtonComponent {
        return this;
    }
}

class MockToggleComponent {
    public value: boolean = false;
    public tooltip: string = '';
    
    setValue(value: boolean): MockToggleComponent {
        this.value = value;
        return this;
    }
    
    setTooltip(tooltip: string): MockToggleComponent {
        this.tooltip = tooltip;
        return this;
    }
    
    onChange(callback: (value: boolean) => void): MockToggleComponent {
        return this;
    }
}

// Mock plugin for testing
class MockPlugin {
    public settings = {
        propertyRenamePatterns: [] as PropertyRenamePattern[]
    };
    
    async saveSettings(): Promise<void> {
        // Mock save
    }
    
    async findCustomTagPropertiesInVault(): Promise<string[]> {
        return ['🗄️ Tags Database', 'custom-tags', 'tag-list'];
    }
}

describe('Property Rename Settings UI', () => {
    let containerEl: MockHTMLElement;
    let mockPlugin: MockPlugin;
    
    framework.beforeEach(() => {
        containerEl = new MockHTMLElement('div');
        mockPlugin = new MockPlugin();
    });
    
    test('should create property discovery section', () => {
        const setting = new MockSetting(containerEl);
        setting.setName('Property Discovery')
              .setDesc('Find custom tag properties in your vault')
              .setHeading();
        
        expect(containerEl.children.length).toBe(1);
        expect(containerEl.children[0].classList).toContain('setting-item');
    });
    
    test('should create property discovery scan button', () => {
        const setting = new MockSetting(containerEl);
        let buttonComponent: MockButtonComponent;
        
        setting.addButton(button => {
            buttonComponent = button;
            button.setButtonText('Scan for Properties')
                  .setCta()
                  .onClick(() => {
                      button.setButtonText('Scanning...')
                           .setDisabled(true);
                  });
        });
        
        expect(buttonComponent!.text).toBe('Scan for Properties');
    });
    
    test('should display found properties in clickable format', async () => {
        const properties = await mockPlugin.findCustomTagPropertiesInVault();
        const propertiesDiv = containerEl.createDiv('properties-discovery-results');
        
        properties.forEach(property => {
            const propertyEl = propertiesDiv.createEl('span', { 
                text: property,
                cls: 'property-pill'
            });
        });
        
        expect(propertiesDiv.children.length).toBe(3);
        expect(propertiesDiv.children[0].textContent).toBe('🗄️ Tags Database');
        expect(propertiesDiv.children[1].textContent).toBe('custom-tags');
        expect(propertiesDiv.children[2].textContent).toBe('tag-list');
    });
    
    test('should create property rename pattern headers', () => {
        const headerSetting = new MockSetting(containerEl);
        headerSetting.setClass('property-pattern-header');
        
        const headerControl = headerSetting.settingEl.querySelector('.setting-item-control');
        if (headerControl) {
            const fromHeader = headerControl.createEl('div', { text: 'From Property' });
            fromHeader.style.width = '40%';
            
            const toHeader = headerControl.createEl('div', { text: 'To Property' });
            toHeader.style.width = '40%';
            
            const actionHeader = headerControl.createEl('div', { text: 'Action' });
            actionHeader.style.width = '20%';
        }
        
        expect(containerEl.children.length).toBe(1);
    });
    
    test('should create property rename pattern input fields', () => {
        const pattern: PropertyRenamePattern = {
            from: '🗄️ Tags Database',
            to: 'tags'
        };
        
        const setting = new MockSetting(containerEl);
        let fromInput: MockTextComponent;
        let toInput: MockTextComponent;
        
        setting.addText(text => {
            fromInput = text;
            text.setPlaceholder('From property name...')
                .setValue(pattern.from);
        })
        .addText(text => {
            toInput = text;
            text.setPlaceholder('To property name...')
                .setValue(pattern.to);
        });
        
        expect(fromInput!.value).toBe('🗄️ Tags Database');
        expect(toInput!.value).toBe('tags');
        expect(fromInput!.placeholder).toBe('From property name...');
        expect(toInput!.placeholder).toBe('To property name...');
    });
    
    test('should create delete button for property patterns', () => {
        const setting = new MockSetting(containerEl);
        let deleteButton: MockButtonComponent;
        
        setting.addButton(button => {
            deleteButton = button;
            button.setIcon('trash')
                  .setTooltip('Remove property pattern')
                  .onClick(() => {
                      // Mock delete functionality
                  });
        });
        
        expect(deleteButton!.icon).toBe('trash');
        expect(deleteButton!.tooltip).toBe('Remove property pattern');
    });
    
    test('should create add property pattern button', () => {
        const setting = new MockSetting(containerEl);
        let addButton: MockButtonComponent;
        
        setting.addButton(button => {
            addButton = button;
            button.setButtonText('Add Property Pattern')
                  .setCta()
                  .onClick(() => {
                      mockPlugin.settings.propertyRenamePatterns.push({
                          from: '',
                          to: ''
                      });
                  });
        });
        
        expect(addButton!.text).toBe('Add Property Pattern');
    });
    
    test('should handle empty property patterns gracefully', () => {
        mockPlugin.settings.propertyRenamePatterns = [];
        
        const setting = new MockSetting(containerEl);
        setting.setName('Property Rename Patterns')
              .setDesc('No property patterns configured');
        
        expect(containerEl.children.length).toBe(1);
    });
    
    test('should validate property pattern inputs', () => {
        const pattern: PropertyRenamePattern = {
            from: '',
            to: 'tags'
        };
        
        const isValid = pattern.from.trim().length > 0 && pattern.to.trim().length > 0;
        expect(isValid).toBe(false);
        
        pattern.from = '🗄️ Tags Database';
        const isValidAfter = pattern.from.trim().length > 0 && pattern.to.trim().length > 0;
        expect(isValidAfter).toBe(true);
    });
    
    test('should prevent duplicate property patterns', () => {
        mockPlugin.settings.propertyRenamePatterns = [
            { from: '🗄️ Tags Database', to: 'tags' }
        ];
        
        const newPattern = { from: '🗄️ Tags Database', to: 'categories' };
        const isDuplicate = mockPlugin.settings.propertyRenamePatterns.some(
            p => p.from === newPattern.from
        );
        
        expect(isDuplicate).toBe(true);
    });
    
    test('should filter out mapped properties from discovery results', async () => {
        mockPlugin.settings.propertyRenamePatterns = [
            { from: '🗄️ Tags Database', to: 'tags' }
        ];
        
        const allProperties = await mockPlugin.findCustomTagPropertiesInVault();
        const mappedProperties = new Set(mockPlugin.settings.propertyRenamePatterns.map(p => p.from));
        const unmappedProperties = allProperties.filter(prop => !mappedProperties.has(prop));
        
        expect(unmappedProperties.length).toBe(2);
        expect(unmappedProperties).toContain('custom-tags');
        expect(unmappedProperties).toContain('tag-list');
        expect(unmappedProperties).not.toContain('🗄️ Tags Database');
    });
});

describe('Property Rename Pattern Management', () => {
    let mockPlugin: MockPlugin;
    
    framework.beforeEach(() => {
        mockPlugin = new MockPlugin();
    });
    
    test('should add new property pattern', () => {
        const initialCount = mockPlugin.settings.propertyRenamePatterns.length;
        
        mockPlugin.settings.propertyRenamePatterns.push({
            from: '🗄️ Tags Database',
            to: 'tags'
        });
        
        expect(mockPlugin.settings.propertyRenamePatterns.length).toBe(initialCount + 1);
        expect(mockPlugin.settings.propertyRenamePatterns[0].from).toBe('🗄️ Tags Database');
        expect(mockPlugin.settings.propertyRenamePatterns[0].to).toBe('tags');
    });
    
    test('should remove property pattern by index', () => {
        mockPlugin.settings.propertyRenamePatterns = [
            { from: '🗄️ Tags Database', to: 'tags' },
            { from: 'custom-tags', to: 'categories' }
        ];
        
        mockPlugin.settings.propertyRenamePatterns.splice(0, 1);
        
        expect(mockPlugin.settings.propertyRenamePatterns.length).toBe(1);
        expect(mockPlugin.settings.propertyRenamePatterns[0].from).toBe('custom-tags');
    });
    
    test('should update property pattern values', async () => {
        mockPlugin.settings.propertyRenamePatterns = [
            { from: '🗄️ Tags Database', to: 'tags' }
        ];
        
        mockPlugin.settings.propertyRenamePatterns[0].from = 'Updated Property';
        mockPlugin.settings.propertyRenamePatterns[0].to = 'updated-tags';
        
        await mockPlugin.saveSettings();
        
        expect(mockPlugin.settings.propertyRenamePatterns[0].from).toBe('Updated Property');
        expect(mockPlugin.settings.propertyRenamePatterns[0].to).toBe('updated-tags');
    });
    
    test('should handle property pattern export', () => {
        mockPlugin.settings.propertyRenamePatterns = [
            { from: '🗄️ Tags Database', to: 'tags' },
            { from: 'custom-tags', to: 'categories' }
        ];
        
        const exportData = {
            version: "1.0",
            exportDate: new Date().toISOString(),
            pluginName: "Tag Renamer",
            propertyPatterns: mockPlugin.settings.propertyRenamePatterns
        };
        
        const jsonString = JSON.stringify(exportData, null, 2);
        
        expect(jsonString).toContain('propertyPatterns');
        expect(jsonString).toContain('🗄️ Tags Database');
        expect(jsonString).toContain('custom-tags');
    });
    
    test('should handle property pattern import validation', () => {
        const validImportData = {
            version: "1.0",
            propertyPatterns: [
                { from: '🗄️ Tags Database', to: 'tags' }
            ]
        };
        
        const isValid = validImportData.propertyPatterns && 
                       Array.isArray(validImportData.propertyPatterns) &&
                       validImportData.propertyPatterns.every(p => 
                           typeof p.from === 'string' && 
                           typeof p.to === 'string'
                       );
        
        expect(isValid).toBe(true);
    });
});