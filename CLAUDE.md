# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development mode with watch compilation from `main.ts` to `main.js`
- `npm run build` - Production build with TypeScript type checking and minified output
- `npm version patch|minor|major` - Bump version in manifest.json and package.json, update versions.json
- `eslint main.ts` - Run ESLint on main TypeScript file
- `eslint .` - Run ESLint on all files in project

## Architecture Overview

This is an Obsidian plugin built with TypeScript that follows the standard Obsidian plugin structure:

### Core Components
- **main.ts** - Main plugin entry point extending Obsidian's `Plugin` class
- **manifest.json** - Plugin metadata and configuration
- **esbuild.config.mjs** - Build configuration using esbuild for bundling

### Plugin Structure
- Main plugin class (`MyPlugin`) handles lifecycle (`onload`, `onunload`)
- Settings system with interface (`MyPluginSettings`) and tab (`SampleSettingTab`)
- Modal system (`SampleModal`) for UI interactions
- Commands registered via `addCommand()` for user interactions
- Ribbon icons and status bar integration

### Build System
- Uses esbuild for fast bundling with watch mode in development
- TypeScript compilation with strict settings (nullChecks, noImplicitAny)
- External dependencies (obsidian, electron, codemirror) are not bundled
- Output target is ES2018 with CommonJS format

### Key Patterns
- Settings are persisted using `loadData()`/`saveData()` 
- DOM events and intervals registered via plugin methods for automatic cleanup
- Commands can have simple callbacks or complex `checkCallback` for conditional execution
- UI elements follow Obsidian's component patterns (Modal, Setting, Notice)

The plugin currently contains sample/template code that demonstrates Obsidian API capabilities including ribbon icons, commands, modals, settings, and editor interactions.