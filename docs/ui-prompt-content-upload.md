# AI UI Generation Prompt: Content Upload Interface with CNN Analysis

## High-Level Goal
Create a responsive content upload interface for an AI-powered Learning Management System that combines traditional file upload functionality with real-time CNN analysis results display. This interface should seamlessly integrate drag-and-drop upload capabilities with immediate visual feedback showing AI-powered content analysis, Wikipedia integration, and intelligent categorization results.

## Detailed, Step-by-Step Instructions

### 1. Project Context Setup
- Create a React component called `ContentUploadInterface` using TypeScript
- Use modern React hooks (useState, useEffect, useCallback) for state management
- Implement responsive design using TailwindCSS with mobile-first approach
- Integrate Shadcn/ui components for consistent design system adherence
- Support OKLCH color theming system for institutional branding flexibility

### 2. Core Upload Interface Structure
1. Create a main container with proper spacing and responsive breakpoints
2. Implement a prominent drag-and-drop upload zone with visual feedback states:
   - Default state: Dashed border with upload icon and instructions
   - Drag hover state: Highlighted border and background color change
   - Uploading state: Progress animation and percentage indicator
   - Success state: Green checkmark with file preview
   - Error state: Red border with error message display
3. Add a traditional file selection button as alternative to drag-and-drop
4. Display file validation requirements (accepted formats, size limits)
5. Show upload progress with a modern progress bar component

### 3. Real-Time CNN Analysis Results Display
1. Create an expandable analysis results panel that appears after file upload
2. Implement a loading state with animated spinner during 10-second CNN processing
3. Display analysis results in organized sections:
   - **Object Detection Results**: Show detected objects with confidence percentages
   - **Content Categorization**: Display automatically assigned categories with tags
   - **Hardware Identification**: List identified ICT/Tech components with specifications
   - **Wikipedia Integration**: Show relevant article excerpts with expand/collapse functionality
4. Use progressive disclosure - show summary first, allow expansion for detailed results
5. Include visual indicators for analysis confidence levels (high/medium/low confidence badges)

### 4. Interactive Features & User Experience
1. Implement real-time file preview for images with thumbnail generation
2. Add copy-to-clipboard functionality for analysis results
3. Create a "Related Content" section showing similar uploads from course
4. Include social features: allow students to comment on analysis results
5. Implement keyboard navigation for accessibility compliance
6. Add tooltips explaining CNN analysis terms for educational context

### 5. Mobile Optimization & Responsive Design
1. **Mobile (320px-768px)**:
   - Stack upload zone and results vertically
   - Use full-width layout with appropriate padding
   - Implement swipe gestures for result panel navigation
   - Optimize touch targets for mobile interaction
2. **Tablet (768px-1024px)**:
   - Show upload zone and results side-by-side
   - Use 60/40 split layout
   - Maintain touch-friendly interface elements
3. **Desktop (1024px+)**:
   - Full side-by-side layout with detailed analysis panels
   - Support for multiple file uploads with queue management
   - Enhanced hover states and interactions

## Code Examples, Data Structures & Constraints

### API Integration Structure
```typescript
// Expected API response structure for CNN analysis
interface CNNAnalysisResult {
  uploadId: string;
  status: 'processing' | 'completed' | 'error';
  analysis: {
    objectDetection: Array<{
      label: string;
      confidence: number;
      boundingBox: { x: number; y: number; width: number; height: number };
    }>;
    categorization: Array<{
      category: string;
      confidence: number;
      subcategories: string[];
    }>;
    hardwareIdentification: Array<{
      component: string;
      specifications: Record<string, any>;
      compatibility: string[];
    }>;
    wikipediaData: {
      articles: Array<{
        title: string;
        excerpt: string;
        url: string;
        relevanceScore: number;
      }>;
    };
  };
  processingTime: number;
  timestamp: string;
}
```

### Required Technology Stack
- **Frontend**: React 18+ with TypeScript, Vite build system
- **Styling**: TailwindCSS with OKLCH color functions, Shadcn/ui components
- **File Handling**: React Dropzone for drag-and-drop functionality
- **Icons**: Lucide React for consistent iconography
- **Animation**: Framer Motion for smooth transitions and loading states
- **State Management**: Zustand for complex state (if needed beyond React hooks)

### Design Constraints
- **Colors**: Use OKLCH color space for accessibility and theming
- **Typography**: Inter font family for modern, readable interface
- **Spacing**: Follow 8px grid system for consistent layout
- **Accessibility**: WCAG 2.1 AA compliance required
- **Performance**: Optimize for 10-second CNN analysis response time
- **File Limits**: Support up to 50MB files, common image/document formats

### DO NOT Include
- Authentication logic (handled by parent components)
- Course management functionality (separate component responsibility)
- Direct database operations (use provided API endpoints only)
- Custom file processing beyond basic validation

## Define Strict Scope

### Files to Create/Modify
- Create `components/ContentUploadInterface.tsx` - Main upload component
- Create `components/CNNAnalysisResults.tsx` - Results display component  
- Create `hooks/useFileUpload.ts` - Custom hook for upload logic
- Create `hooks/useCNNAnalysis.ts` - Custom hook for analysis API calls
- Create `types/upload.ts` - TypeScript interfaces for upload functionality
- Update `components/index.ts` - Export new components

### Files to Leave Untouched
- Navigation components (`Navbar.tsx`, `Sidebar.tsx`)
- Authentication components (`Login.tsx`, `Register.tsx`)
- Course management components (`CourseList.tsx`, `CourseDetails.tsx`)
- Global layout components (`Layout.tsx`, `Header.tsx`)
- Existing API utility functions
- Database schema or backend code

### Component Integration Points
- Component should accept props: `courseId: string`, `assignmentId?: string`, `onUploadComplete: (result: CNNAnalysisResult) => void`
- Must emit events for parent components to handle navigation and state updates
- Should integrate with existing notification system for error handling
- Must respect existing permission system for file access controls

## Visual Design Specifications

### Color Palette (OKLCH Values)
- **Primary**: oklch(0.7 0.15 250) - Educational blue
- **Secondary**: oklch(0.8 0.12 120) - Success green  
- **Accent**: oklch(0.75 0.20 30) - Attention orange
- **Neutral**: oklch(0.6 0.05 250) - Text gray
- **Background**: oklch(0.98 0.02 250) - Light background
- **Error**: oklch(0.65 0.20 15) - Error red

### Typography Hierarchy
- **Headings**: Inter font, semibold weight, appropriate size scale
- **Body Text**: Inter font, regular weight, 16px base size
- **Captions**: Inter font, medium weight, 14px size
- **Code/Technical**: JetBrains Mono for technical specifications

### Animation Guidelines
- **Upload Progress**: Smooth linear progression with easing
- **Result Reveal**: Fade-in with slight slide-up motion
- **Loading States**: Subtle pulse animation for processing indicators
- **Hover Effects**: 150ms ease-out transitions
- **Error States**: Gentle shake animation for validation feedback

## Usage Instructions for AI Tool

1. **Copy this entire prompt** into your AI frontend generation tool (v0, Lovable, etc.)
2. **Start with the main component** - request `ContentUploadInterface.tsx` first
3. **Iterate incrementally** - build one feature at a time, test, then add the next
4. **Test responsiveness** - verify mobile, tablet, and desktop layouts work correctly
5. **Validate accessibility** - ensure keyboard navigation and screen reader support
6. **Review generated code** carefully before implementation - all AI code requires human validation

## Expected Deliverables

- Fully functional React component with TypeScript
- Responsive design that works across all device sizes
- Integration with file upload APIs and CNN analysis endpoints
- Accessible interface meeting WCAG AA standards
- Smooth animations and loading states for 10-second analysis time
- Clean, maintainable code following React best practices

---

**Important Note**: All AI-generated code will require careful human review, testing, and refinement to be considered production-ready. This prompt provides the foundation, but human expertise is essential for security, performance optimization, and edge case handling.
