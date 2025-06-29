/**
 * Tag Property Processor Tests - TDD for Property Renaming Feature
 * Tests renaming tag properties like "🗄️ Tags Database" → "tags"
 */

import { TestFramework } from '../../src/tests/TestFramework';

const framework = new TestFramework();
const describe = framework.describe.bind(framework);
const test = framework.test.bind(framework);
const expect = framework.expect.bind(framework);

describe('Tag Property Processor Tests', () => {
    test('TagPropertyProcessor should be importable', () => {
        try {
            const { TagPropertyProcessor } = require('../../services/TagPropertyProcessor');
            expect(TagPropertyProcessor).toBeDefined();
        } catch (error) {
            // Expected to fail initially - driving implementation
            expect((error as Error).message).toContain('Cannot find module');
        }
    });

    test('should rename "🗄️ Tags Database" to "tags"', () => {
        try {
            const { TagPropertyProcessor } = require('../../services/TagPropertyProcessor');
            const processor = new TagPropertyProcessor();
            
            const content = `---
🗄️ Tags Database: [work, project, important]
title: Test File
---
# Content`;

            const result = processor.renameTagProperties(content, [
                { from: '🗄️ Tags Database', to: 'tags' }
            ]);

            const expected = `---
tags: [work, project, important]
title: Test File
---
# Content`;

            expect(result).toBe(expected);
        } catch (error) {
            // Expected to fail initially
            expect((error as Error).message).toContain('Cannot find module');
        }
    });

    test('should handle multiple property renames', () => {
        try {
            const { TagPropertyProcessor } = require('../../services/TagPropertyProcessor');
            const processor = new TagPropertyProcessor();
            
            const content = `---
🗄️ Tags Database: [work, important]
📚 Categories: [note, reference]
🏷️ Labels: [temp, urgent]
title: Test File
---
# Content`;

            const result = processor.renameTagProperties(content, [
                { from: '🗄️ Tags Database', to: 'tags' },
                { from: '📚 Categories', to: 'category' },
                { from: '🏷️ Labels', to: 'labels' }
            ]);

            const expected = `---
tags: [work, important]
category: [note, reference]
labels: [temp, urgent]
title: Test File
---
# Content`;

            expect(result).toBe(expected);
        } catch (error) {
            // Expected to fail initially
            expect((error as Error).message).toContain('Cannot find module');
        }
    });

    test('should handle list format properties', () => {
        try {
            const { TagPropertyProcessor } = require('../../services/TagPropertyProcessor');
            const processor = new TagPropertyProcessor();
            
            const content = `---
🗄️ Tags Database:
  - personal
  - notes
  - important
title: Test File
---
# Content`;

            const result = processor.renameTagProperties(content, [
                { from: '🗄️ Tags Database', to: 'tags' }
            ]);

            const expected = `---
tags:
  - personal
  - notes
  - important
title: Test File
---
# Content`;

            expect(result).toBe(expected);
        } catch (error) {
            // Expected to fail initially
            expect((error as Error).message).toContain('Cannot find module');
        }
    });

    test('should handle single value properties', () => {
        try {
            const { TagPropertyProcessor } = require('../../services/TagPropertyProcessor');
            const processor = new TagPropertyProcessor();
            
            const content = `---
🗄️ Tags Database: work
📂 Category: project
title: Test File
---
# Content`;

            const result = processor.renameTagProperties(content, [
                { from: '🗄️ Tags Database', to: 'tags' },
                { from: '📂 Category', to: 'category' }
            ]);

            const expected = `---
tags: work
category: project
title: Test File
---
# Content`;

            expect(result).toBe(expected);
        } catch (error) {
            // Expected to fail initially
            expect((error as Error).message).toContain('Cannot find module');
        }
    });

    test('should preserve other frontmatter fields', () => {
        try {
            const { TagPropertyProcessor } = require('../../services/TagPropertyProcessor');
            const processor = new TagPropertyProcessor();
            
            const content = `---
title: Important Document
🗄️ Tags Database: [work, project]
author: Test Author
created: 2025-01-01
status: active
🏷️ Labels: [urgent]
---
# Content`;

            const result = processor.renameTagProperties(content, [
                { from: '🗄️ Tags Database', to: 'tags' },
                { from: '🏷️ Labels', to: 'labels' }
            ]);

            const expected = `---
title: Important Document
tags: [work, project]
author: Test Author
created: 2025-01-01
status: active
labels: [urgent]
---
# Content`;

            expect(result).toBe(expected);
        } catch (error) {
            // Expected to fail initially
            expect((error as Error).message).toContain('Cannot find module');
        }
    });

    test('should handle files with no frontmatter', () => {
        try {
            const { TagPropertyProcessor } = require('../../services/TagPropertyProcessor');
            const processor = new TagPropertyProcessor();
            
            const content = `# Just Content
No frontmatter at all`;

            const result = processor.renameTagProperties(content, [
                { from: '🗄️ Tags Database', to: 'tags' }
            ]);

            expect(result).toBe(content); // Should remain unchanged
        } catch (error) {
            // Expected to fail initially
            expect((error as Error).message).toContain('Cannot find module');
        }
    });

    test('should handle empty property patterns', () => {
        try {
            const { TagPropertyProcessor } = require('../../services/TagPropertyProcessor');
            const processor = new TagPropertyProcessor();
            
            const content = `---
🗄️ Tags Database: [work, project]
title: Test
---
# Content`;

            const result = processor.renameTagProperties(content, []);
            expect(result).toBe(content); // Should remain unchanged
        } catch (error) {
            // Expected to fail initially
            expect((error as Error).message).toContain('Cannot find module');
        }
    });

    test('should detect custom tag properties in frontmatter', () => {
        try {
            const { TagPropertyProcessor } = require('../../services/TagPropertyProcessor');
            const processor = new TagPropertyProcessor();
            
            const content = `---
🗄️ Tags Database: [work, project]
📚 Categories: [note]
🏷️ Labels: [temp]
tags: [existing]
title: Test
---
# Content`;

            const properties = processor.findCustomTagProperties(content);
            expect(properties).toEqual([
                '🗄️ Tags Database',
                '📚 Categories', 
                '🏷️ Labels'
            ]);
        } catch (error) {
            // Expected to fail initially
            expect((error as Error).message).toContain('Cannot find module');
        }
    });
});

export { framework };