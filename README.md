# Tag Renamer - Obsidian Plugin

A powerful and intuitive plugin for renaming and removing tags across your entire Obsidian vault with advanced pattern management and safety features.

## ✨ Features

### 🔄 Smart Tag Operations
- **Rename tags** across all files in folders and subfolders
- **Remove unwanted tags** completely from your vault
- **Duplicate tag removal** within individual files
- **Bulk operations** with comprehensive safety warnings

### 🎛️ Advanced Pattern Management
- **Replace mode**: Transform old tags into new ones
- **Remove mode**: Delete specific tags entirely
- **Mixed workflows**: Combine rename and remove patterns
- **Manual sorting**: Organize patterns by mode and alphabetically

### 🔍 Intelligent Tag Discovery
- **Vault-wide tag scanning** to find all existing tags
- **Smart filtering**: Hide already-mapped tags from discovery
- **Click-to-add**: Instantly create patterns from discovered tags
- **Alphabetical sorting** for easy browsing

### 📤 Configuration Management
- **JSON export/import**: Share patterns between vaults
- **Merge or replace** import modes
- **Backwards compatibility** with older pattern formats
- **Comprehensive validation** with clear error messages

### 🛡️ Safety & User Experience
- **Backup warnings** before any destructive operations
- **Progress feedback** with processed/modified file counts
- **Error handling** with detailed notifications
- **Professional table UI** with clean column headers

## 🚀 Quick Start

### Installation
1. Download the plugin files (`main.js`, `manifest.json`, `styles.css`)
2. Copy to your vault: `.obsidian/plugins/tag-renamer/`
3. Enable the plugin in Obsidian settings

### Basic Usage

#### Creating Rename Patterns
1. Go to **Settings** → **Tag Renamer**
2. Click **"Scan Vault"** to discover existing tags
3. Click on any discovered tag to create a pattern
4. Enter replacement text or toggle to **Remove mode**
5. Click **"Sort Patterns"** to organize (optional)

#### Renaming Tags in Folders
1. **Right-click** any folder in the file explorer
2. Select **"Rename tags in folder"**
3. Review the warning and backup recommendation
4. Click **"Proceed with Rename"** to apply patterns

#### Removing Duplicate Tags
1. **Right-click** any folder in the file explorer
2. Select **"Remove duplicate tags in folder"**
3. Confirm the operation to clean up duplicates

### Commands
- **"Remove duplicate tags from current file"** - Clean up the active file
- **"Open Tag Renamer settings"** - Quick access to configuration

## 📋 Supported Tag Formats

The plugin handles all standard Obsidian frontmatter tag formats:

```yaml
# Array format
tags: [work, project, urgent]

# List format  
tags:
  - work
  - project
  - urgent

# Single tag
tag: work
```

## 🎯 Use Cases

### Vault Organization
- **Standardize naming**: `proj` → `project`, `wrk` → `work`
- **Fix typos**: `proejct` → `project`
- **Consolidate similar tags**: `urgent`, `high-priority` → `important`

### Tag Cleanup
- **Remove deprecated tags**: `old-system`, `legacy`
- **Delete temporary tags**: `draft`, `temp`, `wip`
- **Clean up duplicates**: `[work, personal, work]` → `[work, personal]`

### Team Collaboration
- **Export patterns** from master vault
- **Import standards** to team member vaults
- **Maintain consistency** across multiple projects

## 🔧 Development

### Building the Plugin
```bash
npm install
npm run dev    # Development with watch mode
npm run build  # Production build
```

### Project Structure
- `main.ts` - Main plugin logic with tag processing
- `manifest.json` - Plugin metadata and configuration
- `styles.css` - Custom styling for UI components
- `CLAUDE.md` - Development guidance for AI assistants

### Key Components
- **TagRenamerPlugin** - Main plugin class with tag processing logic
- **RenameConfirmationModal** - Safety warning for bulk operations
- **DuplicateRemovalConfirmationModal** - Confirmation for duplicate cleanup
- **ImportPatternsModal** - JSON import interface with validation
- **TagRenamerSettingTab** - Main settings interface with pattern management

## 🛡️ Safety Features

### Backup Recommendations
- **Clear warnings** before any destructive operations
- **File count display** so you know the scope
- **Cancellation options** at every step

### Validation & Error Handling
- **Pattern validation** ensures search terms exist
- **File access errors** are caught and reported
- **JSON import validation** prevents corrupted configurations
- **Progress tracking** shows exactly what was processed

### Non-Destructive Options
- **Preview mode** in JSON imports shows what will be imported
- **Separate operations** for rename vs remove
- **Granular control** over which patterns are applied

## 📄 License

BSD Zero Clause License - feel free to modify and distribute.

## 🤝 Contributing

Contributions welcome! Please:
1. Test thoroughly with backup vaults
2. Follow TypeScript best practices
3. Add appropriate error handling
4. Update documentation for new features

## 📞 Support

For issues, feature requests, or questions:
- Create an issue in the GitHub repository
- Ensure you have a backup before reporting tag-related bugs
- Include example frontmatter and expected behavior

---

**⚠️ Important**: Always backup your vault before performing bulk tag operations. While the plugin includes safety measures, tag modifications cannot be easily undone.