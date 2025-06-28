# 🧪 Tag Renamer Plugin - Comprehensive Testing Plan

## 📋 **Test Categories Overview**

### **1. Core Functionality Tests**

#### **A. Tag Rename Operations**
- [ ] **Basic Rename**: `work` → `professional`
- [ ] **Multiple Patterns**: Apply 5+ patterns simultaneously  
- [ ] **Case Sensitivity**: Test exact matches vs case variants
- [ ] **Special Characters**: Tags with `-`, `_`, `.`, `/`, spaces
- [ ] **Regex Escaping**: Ensure pattern `work.` doesn't match `workflow`

#### **B. Remove Mode Tests**
- [ ] **Single Tag Removal**: Remove `temp` tags completely
- [ ] **Multiple Removals**: Remove several tag types in one operation
- [ ] **Mixed Mode**: Combine rename + remove patterns
- [ ] **Empty Result**: Remove all tags from a file

#### **C. Duplicate Removal**
- [ ] **Array Format**: `[tag, other, tag]` → `[tag, other]`
- [ ] **List Format**: Remove duplicates from YAML lists
- [ ] **Single File**: Command on active file
- [ ] **Folder Bulk**: Remove duplicates from entire folders

---

### **2. Frontmatter Format Tests**

#### **A. Array Format**: `tags: [tag1, tag2]`
```yaml
tags: [work, project, urgent]
tags: ["quoted", 'single', unquoted]
tags: []  # Empty array
```

#### **B. List Format**: `tags:\n  - tag1`
```yaml
tags:
  - personal
  - notes
  - important
```

#### **C. Single Tag**: `tag: value`
```yaml
tag: meeting
tag: "quoted-single"
```

#### **D. Mixed Formats in Same Vault**
- [ ] Process files with different formats simultaneously
- [ ] Maintain original formatting after modifications

---

### **3. JSON Export/Import Tests**

#### **A. Export Functionality**
- [ ] **Valid Patterns**: Export patterns with both modes
- [ ] **Empty Patterns**: Handle empty pattern list
- [ ] **File Download**: Verify filename format includes date
- [ ] **JSON Structure**: Validate exported JSON schema

#### **B. Import Functionality**  
- [ ] **Valid JSON**: Import well-formed pattern files
- [ ] **Invalid JSON**: Handle malformed JSON gracefully
- [ ] **Missing Fields**: Handle incomplete pattern data
- [ ] **Merge Mode**: Add to existing patterns
- [ ] **Replace Mode**: Overwrite all patterns
- [ ] **Backwards Compatibility**: Import old format files

#### **C. Validation Tests**
```json
// Test these JSON structures:
{"patterns": []}  // Empty
{"patterns": [{"search": "test"}]}  // Missing replace
{"patterns": [{"search": "", "replace": ""}]}  // Empty values
{"version": "1.0", "patterns": [...]}  // Valid structure
```

---

### **4. UI & User Experience Tests**

#### **A. Settings Interface**
- [ ] **Pattern Management**: Add, edit, delete patterns
- [ ] **Toggle Behavior**: Remove mode toggle functionality  
- [ ] **Validation**: Prevent empty search terms
- [ ] **Sorting**: Manual pattern organization
- [ ] **Headers**: Verify table-style layout

#### **B. Tag Discovery**
- [ ] **Vault Scan**: Find all existing tags
- [ ] **Filter Mapped**: Hide already-configured tags
- [ ] **Click to Add**: Create patterns from discovered tags
- [ ] **Alphabetical Sort**: Verify tag ordering
- [ ] **Large Vault**: Performance with 1000+ tags

#### **C. Context Menus**
- [ ] **Folder Right-Click**: Verify menu items appear
- [ ] **Nested Folders**: Test on various folder depths
- [ ] **File Count**: Accurate file counting in warnings

#### **D. Modal Dialogs**
- [ ] **Confirmation Warnings**: Clear backup messages
- [ ] **Progress Feedback**: File processing counts
- [ ] **Error Messages**: User-friendly error display
- [ ] **Cancellation**: Ability to abort operations

---

### **5. Performance & Scalability Tests**

#### **A. Large Vault Testing**
- [ ] **File Count**: Test with 100, 500, 1000+ files
- [ ] **Processing Time**: Measure bulk operation speed  
- [ ] **Memory Usage**: Monitor resource consumption
- [ ] **Batch Processing**: Verify 10-file batch efficiency

#### **B. Pattern Complexity**
- [ ] **Many Patterns**: 50+ rename patterns
- [ ] **Complex Regex**: Special characters requiring escaping
- [ ] **Large Files**: Files with 100+ tags each

#### **C. Concurrent Operations**
- [ ] **Multiple Users**: Simulate vault sharing scenarios
- [ ] **File Locks**: Handle file access conflicts
- [ ] **Interrupted Operations**: Recovery from crashes

---

### **6. Error Handling & Edge Cases**

#### **A. File System Errors**
- [ ] **Read-Only Files**: Handle permission errors gracefully
- [ ] **Missing Files**: Files deleted during processing
- [ ] **Corrupt Files**: Binary files with .md extension
- [ ] **Network Drives**: Files on slow/unreliable storage

#### **B. Malformed Content**
- [ ] **Invalid YAML**: Broken frontmatter syntax
- [ ] **No Frontmatter**: Files without YAML headers
- [ ] **Multiple Frontmatter**: Files with duplicate `---` sections
- [ ] **Empty Files**: Zero-byte .md files

#### **C. Plugin State**
- [ ] **Settings Corruption**: Handle corrupted plugin data
- [ ] **Version Upgrades**: Migration from older versions
- [ ] **Obsidian Updates**: Compatibility with API changes

---

### **7. Cross-Platform Compatibility**

#### **A. Operating Systems**
- [ ] **Windows**: Test on Windows 10/11
- [ ] **macOS**: Test on Intel and Apple Silicon Macs
- [ ] **Linux**: Test on Ubuntu/Debian distributions

#### **B. File System Differences**
- [ ] **Path Separators**: Windows `\` vs Unix `/`
- [ ] **Case Sensitivity**: macOS vs Linux file systems
- [ ] **File Permissions**: Unix permission handling
- [ ] **Unicode**: International characters in file names

#### **C. Obsidian Versions**
- [ ] **Desktop**: Latest stable release
- [ ] **Mobile**: iOS and Android (if applicable)
- [ ] **Beta**: Test with insider builds

---

### **8. Security & Data Integrity**

#### **A. Data Safety**
- [ ] **Backup Warnings**: Prominent user notifications
- [ ] **Atomic Operations**: File modifications are complete or rolled back
- [ ] **Validation**: Input sanitization prevents injection
- [ ] **Rollback**: Ability to undo accidental changes

#### **B. Import Security**
- [ ] **JSON Size Limits**: Prevent memory exhaustion
- [ ] **Pattern Validation**: Sanitize imported patterns
- [ ] **File Size**: Handle large import files gracefully

---

## 🧪 **Detailed Test Scenarios**

### **Scenario 1: Real-World Vault Migration**
```
Setup: Vault with 200 files, inconsistent tagging
Patterns: 
- proj → project
- wrk → work  
- temp → (remove)
- urgent → important

Expected: Clean, consistent tag system
```

### **Scenario 2: Team Standardization**
```
Setup: Multiple vaults need same tag standards
Process: Export from master vault → Import to team vaults
Expected: Identical tag patterns across all vaults
```

### **Scenario 3: Large Academic Vault**
```
Setup: 1000+ research papers with 10+ tags each
Operation: Bulk rename of academic categories
Expected: Fast processing, progress feedback, no data loss
```

### **Scenario 4: Recovery Testing**
```
Setup: Deliberately corrupt some test files
Operation: Run bulk operations
Expected: Graceful failures, detailed error reporting
```

---

## 📊 **Success Criteria**

### **✅ Must Pass:**
- All core rename/remove operations work correctly
- No data loss or corruption in any test scenario
- Graceful error handling for all edge cases
- UI remains responsive during bulk operations
- Export/Import maintains data integrity

### **🎯 Performance Targets:**
- **Small Vault** (< 100 files): < 2 seconds
- **Medium Vault** (100-500 files): < 10 seconds  
- **Large Vault** (500+ files): < 30 seconds
- **Memory Usage**: < 100MB for 1000 files

### **🔍 Quality Metrics:**
- Zero crashes during testing
- Clear error messages for all failure modes
- UI responsiveness maintained throughout
- Consistent behavior across platforms
- No regression from previous functionality

---

## 🚀 **Testing Execution Order**

1. **Unit Tests**: Individual functions and methods
2. **Integration Tests**: Component interactions  
3. **UI Tests**: User interface workflows
4. **Performance Tests**: Large-scale operations
5. **Edge Case Tests**: Error conditions and malformed data
6. **Cross-Platform Tests**: Different environments
7. **User Acceptance Tests**: Real-world scenarios

---

**⚠️ Important**: Always test on backup vaults. Never run tests on production data.