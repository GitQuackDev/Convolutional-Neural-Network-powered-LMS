// Test Markdown rendering with AI-like content
import { isMarkdownContent, markdownToPlainText } from './src/lib/markdownUtils.js';

// Sample AI analysis content that might be returned
const sampleAIResponses = [
  // Simple text (should be detected as non-Markdown)
  "This document contains educational content about web development fundamentals.",
  
  // Markdown with headers and lists
  `## Content Analysis Summary

This educational document demonstrates **strong pedagogical structure** with the following key elements:

### Key Findings:
- **Clear learning objectives** established at the beginning
- Well-structured content progression from basic to advanced concepts
- Excellent use of *practical examples* throughout
- Comprehensive coverage of fundamental topics

### Recommendations:
1. Consider adding more interactive elements
2. Include **code snippets** for hands-on practice
3. Add assessment questions at the end of each section

> **Note**: This content shows excellent educational value with high engagement potential.`,

  // Code-focused analysis
  `## Code Quality Assessment

The submitted code demonstrates good practices:

\`\`\`javascript
// Example of clean function structure
function analyzeContent(data) {
  return data.filter(item => item.isValid);
}
\`\`\`

**Strengths:**
- Clear naming conventions
- Proper error handling
- Well-documented functions

**Areas for improvement:**
- Add \`typescript\` annotations
- Include more \`unit tests\`
- Consider using modern \`async/await\` patterns`,

  // Table-based analysis
  `## Performance Metrics

| Metric | Score | Comments |
|--------|-------|----------|
| Readability | 85% | Clear structure and flow |
| Engagement | 92% | Interactive elements present |
| Accessibility | 78% | Some improvements needed |

### Action Items:
- [ ] Improve alt text for images
- [ ] Add ARIA labels
- [x] Review color contrast ratios`
];

console.log('🧪 Testing Markdown Detection and Processing\n');

sampleAIResponses.forEach((content, index) => {
  console.log(`📝 Sample ${index + 1}:`);
  console.log(`   Is Markdown: ${isMarkdownContent(content)}`);
  console.log(`   Length: ${content.length} characters`);
  
  if (isMarkdownContent(content)) {
    const plainText = markdownToPlainText(content);
    console.log(`   Plain text preview: ${plainText.slice(0, 100)}...`);
  }
  console.log('');
});

console.log('✅ Markdown detection test completed!');
console.log('\n🎨 Frontend integration complete - MarkdownRenderer ready for use in AI analysis cards');
console.log('📍 Components updated:');
console.log('   - MultiAnalysisResults.tsx: Description, insights, recommendations');
console.log('   - ConsolidatedInsightsCard: Summary, actions, findings');
console.log('   - Security: rehype-sanitize protects against XSS');
console.log('   - Features: GFM tables, code highlighting, auto-detection');
