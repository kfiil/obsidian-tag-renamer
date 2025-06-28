# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development mode with watch compilation from `main.ts` to `main.js`
- `npm run build` - Production build with TypeScript type checking and minified output
- `npm version patch|minor|major` - Bump version in manifest.json and package.json, update versions.json
- `eslint main.ts` - Run ESLint on main TypeScript file
- `eslint .` - Run ESLint on all files in project

## Architecture Overview

This is the **Tag Renamer** Obsidian plugin - a comprehensive tag management system for renaming, removing, and organizing tags across entire vaults.

### Core Plugin Architecture

#### Main Plugin Class: `TagRenamerPlugin`
- **Lifecycle Management**: Handles `onload`, `onunload`, settings persistence
- **Tag Processing Engine**: Core logic for finding and modifying tags in frontmatter
- **Command Registration**: Editor commands and context menu integration
- **File Operations**: Bulk processing with progress tracking and error handling

#### Settings System: `TagRenamerSettings`
- **RenamePattern Interface**: `{search: string, replace: string, removeMode?: boolean}`
- **Pattern Array**: Stores multiple rename/remove patterns with mode toggles
- **JSON Export/Import**: Full configuration sharing between vaults
- **Validation Logic**: Ensures pattern integrity and backwards compatibility

### UI Components & Modals

#### Settings Tab: `TagRenamerSettingTab`
- **Tag Discovery**: Vault-wide scanning with intelligent filtering
- **Pattern Management**: Professional table UI with column headers
- **Export/Import Interface**: JSON configuration management
- **Manual Sorting**: User-controlled pattern organization

#### Modal System
- **RenameConfirmationModal**: Safety warnings for bulk tag operations
- **DuplicateRemovalConfirmationModal**: Confirmation for duplicate cleanup
- **ImportPatternsModal**: JSON import with validation and preview

### Tag Processing Engine

#### Frontmatter Format Support
- **Array Format**: `tags: [tag1, tag2, tag3]`
- **List Format**: `tags:\n  - tag1\n  - tag2`
- **Single Tag**: `tag: tagname`
- **Mixed Support**: Handles all formats in same file

#### Processing Logic
- **Pattern Filtering**: `p.search && (p.removeMode || p.replace)`
- **Regex Matching**: Exact word boundary matching with escaping
- **Remove Mode**: Filters out matching tags completely
- **Replace Mode**: Maps old tags to new tags
- **Cleanup**: Removes empty tag sections and extra whitespace

### Key Features Implementation

#### Tag Discovery System
- **Vault Scanning**: `getAllTagsInVault()` processes all markdown files
- **Intelligent Filtering**: Hides already-mapped tags from UI
- **Alphabetical Sorting**: Clean, scannable tag lists
- **Click-to-Add**: Instant pattern creation from discovered tags

#### Duplicate Removal
- **File-Level**: `removeDuplicateTagsFromContent()` for individual files
- **Bulk Processing**: Folder-wide duplicate cleanup
- **Set-Based Logic**: Uses `Set` data structure for efficient deduplication
- **Format Preservation**: Maintains original frontmatter structure

#### Safety & Error Handling
- **Backup Warnings**: Clear user notifications before destructive operations
- **Progress Tracking**: File count and modification statistics
- **Error Isolation**: Individual file failures don't stop bulk operations
- **Validation**: Pattern and JSON import validation with clear error messages

### File Operations

#### Context Menu Integration
- **Folder Operations**: Right-click menus for bulk tag operations
- **Recursive Processing**: Handles nested folder structures
- **File Filtering**: Only processes `.md` files
- **Progress Feedback**: Real-time operation status

#### Commands
- **"Remove duplicate tags from current file"**: Single file cleanup
- **"Open Tag Renamer settings"**: Quick settings access
- **Folder context actions**: Bulk rename and duplicate removal

### Development Patterns

#### State Management
- **Settings Persistence**: Automatic save/load with `loadData()`/`saveData()`
- **Real-time Updates**: UI refreshes on pattern changes
- **Reference-Based Updates**: Handles dynamic pattern indexing safely

#### Error Handling
- **Graceful Degradation**: Operations continue despite individual failures
- **User Feedback**: Clear error messages with file-specific details
- **Validation**: Pre-operation checks prevent invalid states

#### Performance Considerations
- **Efficient Regex**: Compiled patterns with proper escaping
- **Batch Operations**: Processes multiple files in single operation
- **Memory Management**: Handles large vaults without memory issues

### Code Organization

#### Interface Definitions
- **RenamePattern**: Core pattern structure with optional remove mode
- **TagRenamerSettings**: Plugin configuration container
- **Validation Results**: Structured error reporting for imports

#### Method Responsibilities
- **Tag Extraction**: `extractTagsFromContent()` parses all frontmatter formats
- **Pattern Application**: `processFileContent()` applies patterns to file content
- **File Processing**: `getAllMarkdownFiles()` recursively finds target files
- **UI Management**: Clean separation between data operations and UI updates

### Build System & Dependencies

#### TypeScript Configuration
- **Strict Mode**: Full type checking with nullChecks and noImplicitAny
- **ES2018 Target**: Modern JavaScript with CommonJS modules
- **External Dependencies**: Obsidian API, electron, codemirror excluded from bundle

#### Development Workflow
- **Watch Mode**: `npm run dev` for live compilation
- **Production Build**: `npm run build` with minification and type checking
- **ESLint Integration**: Code quality enforcement

### Testing & Quality Assurance

#### Manual Testing Scenarios
- **Mixed Format Files**: Test all frontmatter combinations
- **Large Vault Operations**: Verify performance with many files
- **Edge Cases**: Empty tags, special characters, malformed frontmatter
- **Error Recovery**: Test behavior with file access errors

#### Safety Measures
- **Backup Reminders**: Prominent warnings in all destructive operations
- **Cancellation Options**: User can abort operations before execution
- **Validation**: Multiple layers prevent invalid or dangerous operations

This architecture provides a robust, user-friendly tag management system with comprehensive safety features and professional UI design.