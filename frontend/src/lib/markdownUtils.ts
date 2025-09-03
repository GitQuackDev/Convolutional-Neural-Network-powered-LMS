/**
 * Utility functions for Markdown detection and processing
 */

/**
 * Detects if content contains Markdown syntax
 * @param content - Text content to analyze
 * @returns boolean indicating if Markdown syntax is detected
 */
export const isMarkdownContent = (content: string): boolean => {
  if (!content || typeof content !== 'string') return false;
  
  // Common Markdown patterns to detect
  const markdownPatterns = [
    /\*\*[^*]+\*\*/,           // Bold text **text**
    /\*[^*]+\*/,               // Italic text *text*
    /^#{1,6}\s+/m,             // Headers # ## ###
    /^\s*\d+\.\s+/m,           // Numbered lists 1. 2. 3.
    /^\s*[-*+]\s+/m,           // Bullet lists - * +
    /```[\s\S]*?```/,          // Code blocks ```code```
    /`[^`]+`/,                 // Inline code `code`
    /\[.+?\]\(.+?\)/,          // Links [text](url)
    /!\[.*?\]\(.+?\)/,         // Images ![alt](url)
    /^\s*>\s+/m,               // Blockquotes > text
    /\|.+\|/,                  // Tables | cell |
    /^---+$/m,                 // Horizontal rules ---
    /~~[^~]+~~/,               // Strikethrough ~~text~~
  ];
  
  return markdownPatterns.some(pattern => pattern.test(content));
};

/**
 * Safely truncates content while preserving Markdown structure
 * @param content - Markdown content to truncate
 * @param maxLength - Maximum length in characters
 * @returns Truncated content with proper Markdown structure
 */
export const truncateMarkdown = (content: string, maxLength: number = 500): string => {
  if (!content || content.length <= maxLength) return content;
  
  const truncated = content.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const lastNewline = truncated.lastIndexOf('\n');
  
  // Try to break at a natural boundary
  const breakPoint = Math.max(lastSpace, lastNewline);
  const result = breakPoint > maxLength * 0.8 ? truncated.substring(0, breakPoint) : truncated;
  
  return result + '...';
};

/**
 * Extracts plain text from Markdown content for previews
 * @param content - Markdown content
 * @returns Plain text without Markdown syntax
 */
export const markdownToPlainText = (content: string): string => {
  if (!content) return '';
  
  return content
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[.*?\]\([^)]+\)/g, '')
    // Remove blockquotes
    .replace(/^\s*>\s+/gm, '')
    // Remove list markers
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove horizontal rules
    .replace(/^---+$/gm, '')
    // Remove strikethrough
    .replace(/~~([^~]+)~~/g, '$1')
    // Clean up extra whitespace
    .replace(/\n\s*\n/g, '\n')
    .trim();
};
