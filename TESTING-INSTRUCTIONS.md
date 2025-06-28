# 🧪 **Testing Instructions for Tag Renamer Plugin**

## 🚀 **Quick Start Testing**

### **Prerequisites**
1. ✅ Plugin successfully built (`npm run build`)
2. ✅ Test vault created with sample files
3. ✅ Backup of any existing data

### **Test Environment Setup**
```bash
# Verify test files are created
ls -la test-vault/
# Should show 13+ test files across multiple folders
```

---

## **🔍 Phase 1: Basic Functionality Tests**

### **Test 1A: Tag Discovery**
1. Open Obsidian with the test vault
2. Navigate to **Settings → Tag Renamer**
3. Click **"Scan Vault"** button
4. **✅ Expected Results:**
   - Button shows "Scanning..." temporarily
   - Notice shows "Found X unique tags"
   - Tags appear as clickable pills below
   - Should include: `work`, `project`, `urgent`, `development`, `personal`, `notes`, etc.

### **Test 1B: Basic Rename Pattern**
1. In settings, click on the `work` tag pill
2. Enter `professional` in the replace field
3. Save settings
4. Right-click on root test vault folder
5. Select **"Rename tags in folder"**
6. Review warning dialog → Click **"Proceed with Rename"**
7. **✅ Expected Results:**
   - Notice: "Processing X files..."
   - Notice: "Completed! Processed X files, modified Y files."
   - Check `array-format.md`: `work` should become `professional`
   - Other tags remain unchanged

---

## **🔄 Phase 2: Remove Mode Tests**

### **Test 2A: Remove Mode Toggle**
1. In settings, add new pattern: search `temp`
2. Toggle **Remove** switch ON
3. Notice replace field becomes disabled and shows "Remove mode (ignored)"
4. Apply to folder with temp tags
5. **✅ Expected Results:**
   - Any `temp` tags completely removed
   - No replacement value appears
   - Other tags preserved

### **Test 2B: Mixed Operations**
1. Create patterns:
   - `urgent` → `important` (replace mode)
   - `development` → remove (remove mode)
   - `notes` → `documentation` (replace mode)
2. Apply to entire test vault
3. **✅ Expected Results:**
   - `urgent` becomes `important`
   - `development` disappears completely
   - `notes` becomes `documentation`
   - All other tags unchanged

---

## **♻️ Phase 3: Duplicate Removal Tests**

### **Test 3A: Array Format Duplicates**
1. Open `duplicates.md` 
2. Verify current content: `[duplicate, unique, duplicate, another, unique, duplicate]`
3. Right-click file → **"Remove duplicate tags from current file"**
4. **✅ Expected Results:**
   - Content becomes: `[duplicate, unique, another]`
   - Notice: "Removed duplicate tags from duplicates.md"

### **Test 3B: List Format Duplicates**  
1. Open `list-duplicates.md`
2. Command palette: **"Remove duplicate tags from current file"**
3. **✅ Expected Results:**
   - Each tag appears only once in list
   - Original YAML list format preserved

### **Test 3C: Bulk Duplicate Removal**
1. Right-click test vault folder
2. Select **"Remove duplicate tags in folder"**
3. **✅ Expected Results:**
   - Processes all files recursively
   - Progress notices appear
   - All duplicate tags removed vault-wide

---

## **📤 Phase 4: Export/Import Tests**

### **Test 4A: Export Functionality**
1. Create 3-5 varied patterns (mix of rename/remove)
2. Click **"Export to JSON"** button
3. **✅ Expected Results:**
   - File downloads automatically
   - Filename format: `tag-renamer-patterns-YYYY-MM-DD.json`
   - JSON contains version, date, and patterns array
   - File opens correctly in text editor

### **Test 4B: Import - Replace Mode**
1. Clear all existing patterns
2. Click **"Import from JSON"**
3. Select the exported JSON file
4. Choose **"Replace all existing patterns"**
5. Click **"Import"**
6. **✅ Expected Results:**
   - Preview shows pattern count
   - Success notice appears
   - All patterns restored exactly
   - Settings UI updates immediately

### **Test 4C: Import - Merge Mode**
1. Create 2 new patterns manually
2. Import same JSON file again  
3. Choose **"Merge with existing patterns"**
4. **✅ Expected Results:**
   - Total patterns = original + new patterns
   - No duplicates created
   - All patterns functional

### **Test 4D: Invalid JSON Handling**
1. Create malformed JSON file:
```json
{
  "patterns": [
    {"search": "test"}  // Missing replace field
  }
}
```
2. Attempt to import
3. **✅ Expected Results:**
   - Clear error message displayed
   - No changes to existing patterns
   - Plugin remains stable

---

## **⚡ Phase 5: Performance Tests**

### **Test 5A: Large Vault Processing**
1. Navigate to `Large Test` folder (50 files)
2. Create pattern: `performance` → `speed-test`
3. Right-click folder → Rename tags
4. **✅ Expected Results:**
   - Processing completes within 5 seconds
   - Progress notices appear
   - All 50 files processed correctly
   - Memory usage stays reasonable

### **Test 5B: Many Patterns Test**
1. Create 20+ different patterns
2. Apply to entire test vault
3. **✅ Expected Results:**
   - All patterns applied correctly
   - No performance degradation
   - Consistent processing speed

---

## **🚨 Phase 6: Edge Cases & Error Handling**

### **Test 6A: Malformed Content**
1. Apply patterns to `malformed-frontmatter.md`
2. **✅ Expected Results:**
   - File processed without errors
   - Plugin doesn't crash
   - Clear error notice if processing fails

### **Test 6B: No Frontmatter**
1. Process `no-frontmatter.md` 
2. **✅ Expected Results:**
   - File unchanged
   - No errors generated
   - Included in "processed" count

### **Test 6C: Empty Tags**
1. Process `empty-tags.md`
2. **✅ Expected Results:**
   - File handled gracefully
   - Empty array preserved or cleaned up appropriately

### **Test 6D: Special Characters**
1. Create pattern for `tag-with-dash` → `tag_with_underscore`
2. Apply to `special-characters.md`
3. **✅ Expected Results:**
   - Exact match only (not partial matches)
   - Special characters handled correctly
   - No regex escaping errors

---

## **🖱️ Phase 7: UI/UX Tests**

### **Test 7A: Settings Interface**
1. **Pattern Management:**
   - Add 5 patterns using different methods
   - Edit existing patterns
   - Delete patterns  
   - Verify table layout with headers

2. **Toggle Behavior:**
   - Switch patterns between rename/remove modes
   - Verify UI updates immediately
   - Check disabled state for remove mode replace field

3. **Sorting:**
   - Create mixed rename/remove patterns
   - Click **"Sort Patterns"** button
   - Verify: replace patterns first, then remove, both alphabetical

### **Test 7B: Modal Dialogs**
1. **Warning Modals:**
   - Clear backup warnings displayed
   - Accurate file counts shown
   - Cancel/Proceed options work

2. **Progress Feedback:**
   - Processing notices appear promptly
   - Completion statistics accurate
   - Error messages user-friendly

---

## **📊 Phase 8: Validation & Verification**

### **Test 8A: Data Integrity**
1. Before any operation, copy test files
2. Run complex rename/remove operations
3. Compare original vs processed files
4. **✅ Expected Results:**
   - Only specified tags modified
   - No content outside frontmatter changed
   - No file corruption or data loss

### **Test 8B: Consistency Check**
1. Apply same patterns multiple times
2. **✅ Expected Results:**
   - Idempotent operations (same result each time)
   - No further changes after first application

### **Test 8C: Undo Simulation**
1. Create reverse patterns (`important` → `urgent`)
2. Apply to previously processed files
3. **✅ Expected Results:**
   - Successfully reverses previous changes
   - Demonstrates reversibility concept

---

## **🏁 Final Validation Checklist**

### **Core Functionality** ✅
- [ ] Tag discovery finds all tags
- [ ] Rename patterns work correctly
- [ ] Remove mode eliminates tags
- [ ] Duplicate removal functions properly
- [ ] JSON export/import maintains integrity

### **User Experience** ✅  
- [ ] Clear, intuitive UI
- [ ] Helpful error messages
- [ ] Progress feedback during operations
- [ ] Backup warnings prominent
- [ ] Fast response times

### **Reliability** ✅
- [ ] No crashes during testing
- [ ] Graceful error handling
- [ ] Data integrity maintained
- [ ] Memory usage reasonable
- [ ] Cross-platform compatible

### **Performance** ✅
- [ ] Small vaults: < 2 seconds
- [ ] Medium vaults: < 10 seconds
- [ ] Large vaults: < 30 seconds
- [ ] Responsive UI throughout

---

## **🐛 Issue Reporting Template**

When reporting issues found during testing:

```
**Test Phase:** [e.g., Phase 2: Remove Mode Tests]
**Test Case:** [e.g., Test 2A: Remove Mode Toggle]
**Environment:** [OS, Obsidian version, plugin version]
**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Result:** What should have happened
**Actual Result:** What actually happened
**Screenshots:** [If applicable]
**Additional Notes:** [Any other relevant information]
```

---

## **✅ Success Criteria Summary**

The plugin passes testing if:
1. **All core features work as documented**
2. **No data loss or corruption occurs**
3. **UI remains responsive during operations**
4. **Error handling is graceful and informative**
5. **Performance meets target benchmarks**
6. **Cross-platform compatibility verified**

**🎉 Ready for production when all tests pass!**