# AI Frontend Generation Prompts - Phase 1 Student Experience

*Created: August 30, 2025*  
*Purpose: AI-optimized prompts for rapid prototyping of Phase 1 components*

---

## 🎯 **Prompt 1: Student Dashboard Component**

### Copy-Paste Ready Prompt for v0/Lovable:

```
Create a comprehensive Student Dashboard component for a CNN-powered Learning Management System for ICT/Tech education.

**PROJECT CONTEXT:**
- Tech Stack: React 19 + TypeScript + Vite + Tailwind CSS + Radix UI components
- Purpose: LMS with CNN-powered content analysis for technical education
- User: ICT/Tech students who value clear progress tracking and AI insights
- Design System: Modern, clean interface with progress-focused UX

**HIGH-LEVEL GOAL:**
Create a responsive student dashboard that serves as the central hub for student activity, showcasing course progress, assignment status, and CNN analysis results with clear visual hierarchy and intuitive navigation.

**DETAILED STEP-BY-STEP INSTRUCTIONS:**

1. Create a main dashboard container with proper responsive grid layout (CSS Grid)
2. Build a welcome header section with:
   - Student name and avatar (placeholder)
   - Quick stats overview (courses enrolled, assignments pending, overall progress percentage)
   - Current date and motivational message

3. Create a "Progress Overview" section with:
   - 3-4 course progress cards in a responsive grid
   - Each card shows: course name, completion percentage with animated circular progress, module count, next deadline
   - Cards should be clickable with hover effects
   - Use color coding: green (>80%), yellow (40-80%), red (<40%)

4. Build an "Active Assignments" section with:
   - Priority-sorted assignment cards (due date proximity)
   - Each card displays: assignment title, course name, due date, progress indicator, quick action button
   - Color-coded urgency: red (due today/overdue), orange (due this week), blue (future)
   - "Continue" or "Submit" buttons based on status

5. Add a "Recent CNN Analysis" feed section with:
   - Timeline-style layout of recent upload analysis results
   - Each item shows: thumbnail, confidence score badge, key insights preview, timestamp
   - Limit to 5 most recent items with "View All" link

6. Include a "Quick Actions" panel with:
   - Large, prominent buttons for: "Upload New Content", "Join Discussion", "View All Courses"
   - Use appropriate Lucide React icons
   - Ensure buttons are touch-friendly (44px minimum)

**CODE EXAMPLES & CONSTRAINTS:**

Tech Stack Requirements:
- Use TypeScript for all components with proper interfaces
- Leverage existing Radix UI components: Card, Button, Progress, Badge, Avatar
- Use Tailwind CSS classes exclusively for styling
- Import icons from 'lucide-react'
- Use Framer Motion for progress animations (import { motion } from 'framer-motion')

Sample data structure to work with:
```typescript
interface CourseProgress {
  id: string;
  name: string;
  completion: number; // 0-1
  modulesCompleted: number;
  totalModules: number;
  nextDeadline?: string;
}

interface Assignment {
  id: string;
  title: string;
  courseName: string;
  dueDate: string;
  status: 'not_started' | 'in_progress' | 'ready_to_submit' | 'submitted';
  progress: number; // 0-1
}

interface CNNAnalysisResult {
  id: string;
  fileName: string;
  confidence: number;
  insights: string[];
  timestamp: string;
  thumbnail?: string;
}
```

Color Palette:
- Primary: slate-900, slate-800
- Secondary: blue-600, blue-500
- Success: green-600, green-500
- Warning: yellow-500, amber-500
- Danger: red-600, red-500
- Background: gray-50, white

**STRICT SCOPE:**
- Create ONLY the StudentDashboard component file
- Use mock/placeholder data for all content
- Do NOT modify navigation or other existing components
- Focus on responsive design (mobile-first, then tablet/desktop)
- Ensure component is self-contained with proper TypeScript exports
- Include proper accessibility attributes (ARIA labels, semantic HTML)

**VISUAL REQUIREMENTS:**
- Mobile-first responsive design
- Clean, modern aesthetic with plenty of white space
- Subtle shadows and rounded corners for cards
- Smooth hover transitions and micro-interactions
- Progress indicators should be prominent and easy to read
- Typography hierarchy: large headings, readable body text, small meta information
```

---

## 🎯 **Prompt 2: Course Module View Component**

### Copy-Paste Ready Prompt for v0/Lovable:

```
Create a Course Module View component inspired by Skool.com's step-by-step learning progression for a CNN-powered LMS system.

**PROJECT CONTEXT:**
- Tech Stack: React 19 + TypeScript + Vite + Tailwind CSS + Radix UI
- Purpose: Structured learning progression with clear completion tracking for ICT/Tech courses
- User: Students need clear navigation through course content with progress validation
- Design Pattern: Left sidebar navigation + main content area (desktop), collapsible for mobile

**HIGH-LEVEL GOAL:**
Build a comprehensive course module interface with left sidebar navigation, step-by-step content progression, completion tracking, and CNN analysis integration points.

**DETAILED STEP-BY-STEP INSTRUCTIONS:**

1. Create a two-column layout component:
   - Left sidebar (300px on desktop, full-width overlay on mobile)
   - Main content area (flexible width)
   - Responsive breakpoint handling with mobile hamburger menu

2. Build the sidebar navigation with:
   - Course header: title, overall progress ring, completion badge
   - Expandable module list with:
     - Module titles with completion indicators (checkmarks/progress)
     - Step/lesson list under each module (numbered)
     - Current position highlighting with distinct visual treatment
     - Progress indicators for each step (completed, current, upcoming)

3. Create the main content area with:
   - Step header: step number, title, estimated time, completion status
   - Step progress indicator showing position in current module
   - Content area placeholder for various content types (text, video, upload, quiz)
   - CNN analysis integration section (when applicable)
   - Navigation controls: Previous/Next buttons with step previews

4. Add completion tracking features:
   - Animated checkmark completion for finished steps
   - Module completion celebration (badge animation)
   - Progress persistence visual feedback
   - "Mark as Complete" button for manual completion

5. Include mobile-responsive features:
   - Collapsible sidebar with hamburger menu
   - Touch-friendly navigation controls
   - Swipe gestures for step navigation (basic implementation)
   - Optimized content layout for small screens

6. Add interactive elements:
   - Smooth animations for state changes
   - Loading states for content transitions
   - Hover effects for navigation items
   - Keyboard navigation support

**CODE EXAMPLES & CONSTRAINTS:**

Required interfaces:
```typescript
interface CourseModule {
  id: string;
  title: string;
  steps: CourseStep[];
  completion: number; // 0-1
  isCompleted: boolean;
}

interface CourseStep {
  id: string;
  title: string;
  type: 'content' | 'video' | 'upload' | 'quiz' | 'assignment';
  estimatedTime: number; // minutes
  isCompleted: boolean;
  isCurrent: boolean;
  content?: string;
  cnnAnalysisEnabled?: boolean;
}

interface CourseData {
  id: string;
  title: string;
  description: string;
  modules: CourseModule[];
  overallProgress: number;
}
```

Component Architecture:
- Main CourseModuleView component
- Sidebar component with ModuleNavigation
- ContentArea component with StepContent
- ProgressIndicator components
- CompletionButton component

Required Radix UI components:
- Collapsible (for expandable modules)
- Progress (for completion indicators)
- Button, Badge, Card
- Separator for visual breaks

Mobile-first responsive breakpoints:
- Mobile: < 768px (full-width content, overlay sidebar)
- Tablet: 768px - 1024px (reduced sidebar, responsive content)
- Desktop: > 1024px (full sidebar, spacious layout)

**STRICT SCOPE:**
- Create the CourseModuleView component and necessary sub-components
- Use mock course data with 3 modules, 4-6 steps each
- Do NOT integrate with routing yet (that comes next)
- Focus on the learning progression UX and visual hierarchy
- Ensure smooth animations and responsive behavior
- Include proper TypeScript typing and accessibility features

**VISUAL REQUIREMENTS:**
- Sidebar: Clean navigation with clear visual hierarchy
- Current step highlighting with accent color and icon
- Completion checkmarks with satisfying animation
- Progress rings and bars with smooth transitions
- Mobile: Seamless sidebar collapse/expand animation
- Typography: Clear heading hierarchy, readable content text
- Color coding: completed (green), current (blue), upcoming (gray)
```

---

## 🎯 **Prompt 3: Enhanced Assignment Submission Flow**

### Copy-Paste Ready Prompt for v0/Lovable:

```
Enhance the existing ContentUploadInterface component to create a comprehensive Assignment Submission Flow for a CNN-powered LMS.

**PROJECT CONTEXT:**
- Existing: ContentUploadInterface component with CNN analysis capabilities
- Tech Stack: React 19 + TypeScript + Tailwind CSS + Radix UI + Framer Motion
- Enhancement Goal: Add assignment context, submission management, and enhanced feedback
- User: Students submitting assignments with AI-powered analysis and feedback

**HIGH-LEVEL GOAL:**
Create an enhanced assignment submission interface that builds on the existing upload component while adding assignment context, submission history, requirement matching, and comprehensive feedback flows.

**DETAILED STEP-BY-STEP INSTRUCTIONS:**

1. Create an AssignmentSubmissionFlow wrapper component that includes:
   - Assignment header with title, due date, requirements, and point value
   - Progress stepper showing: Requirements → Upload → Analysis → Review → Submit
   - Integration with existing ContentUploadInterface
   - Submission history sidebar (collapsible)

2. Build the assignment context header:
   - Assignment title and course name
   - Due date with urgency indicator (time remaining)
   - Points possible and grading rubric preview
   - Expandable requirements section with checklist format
   - Submission attempt counter (e.g., "Attempt 2 of 3")

3. Enhance the upload analysis section:
   - Assignment-specific analysis feedback
   - Requirement matching indicators (green check, yellow warning, red missing)
   - CNN confidence scores with assignment context
   - Improvement suggestions based on assignment criteria
   - File version management (multiple uploads comparison)

4. Add submission management features:
   - Draft auto-save functionality with timestamp
   - Version history with ability to revert to previous uploads
   - Submission confirmation flow with final review
   - Post-submission success state with next steps
   - Re-submission capability if allowed

5. Include submission history panel:
   - Previous submission attempts with grades/feedback
   - File version timeline
   - Professor comments and feedback history
   - Grade progression if multiple attempts allowed

6. Add validation and feedback systems:
   - Real-time requirement checking
   - File format validation for assignment type
   - Upload progress with detailed status
   - Error handling with clear recovery instructions
   - Success animations and confirmation messages

**CODE EXAMPLES & CONSTRAINTS:**

Enhanced interfaces:
```typescript
interface Assignment {
  id: string;
  title: string;
  courseName: string;
  description: string;
  requirements: AssignmentRequirement[];
  dueDate: string;
  pointsWorth: number;
  allowedAttempts: number;
  acceptedFileTypes: string[];
  rubric?: RubricCriteria[];
}

interface AssignmentRequirement {
  id: string;
  description: string;
  required: boolean;
  met?: boolean;
  feedback?: string;
}

interface SubmissionHistory {
  id: string;
  attemptNumber: number;
  submittedAt: string;
  files: SubmissionFile[];
  grade?: number;
  feedback?: string;
  status: 'draft' | 'submitted' | 'graded' | 'returned';
}

interface SubmissionFile {
  id: string;
  fileName: string;
  uploadedAt: string;
  cnnAnalysis?: CNNAnalysisResult;
  version: number;
}
```

Enhanced component structure:
- AssignmentSubmissionFlow (main wrapper)
- AssignmentHeader (context and requirements)
- EnhancedUploadInterface (extends existing)
- RequirementChecker (validation component)
- SubmissionHistory (side panel)
- ConfirmationFlow (final submission)

Integration with existing ContentUploadInterface:
- Wrap existing component, don't replace
- Add assignment context props
- Enhance analysis display with assignment-specific feedback
- Add submission state management around existing upload logic

**STRICT SCOPE:**
- Enhance ONLY the upload/submission flow
- Build on existing ContentUploadInterface without breaking it
- Add assignment context and submission management
- Do NOT modify core CNN analysis logic
- Focus on the assignment submission user experience
- Ensure backward compatibility with existing upload component

**VISUAL REQUIREMENTS:**
- Multi-step progress indicator at top
- Assignment context header with clear hierarchy
- Enhanced upload area with assignment-specific guidance
- Requirement checklist with clear pass/fail indicators
- Professional submission confirmation flow
- Responsive design maintaining upload component's mobile experience
- Success states with celebration micro-interactions
```

---

## 🔄 **Usage Instructions**

### Step 1: Use these prompts with AI tools
1. **Copy each prompt** to v0.dev, Lovable.ai, or similar AI frontend tools
2. **Generate the components** one at a time
3. **Iterate and refine** based on initial results

### Step 2: Integration approach
1. **Review generated code** for quality and consistency
2. **Adapt to your existing codebase** structure and conventions  
3. **Integrate with your current** TypeScript interfaces and hooks
4. **Test responsive behavior** across device sizes

### Step 3: Next steps after generation
1. **Add real data integration** with your backend APIs
2. **Implement routing** between components using react-router-dom
3. **Add state management** for cross-component data sharing
4. **Enhance accessibility** and performance optimization

---

## ⚠️ **Important Reminders**

- **All AI-generated code requires careful human review, testing, and refinement**
- **Mock data will need to be replaced** with real API integrations
- **Responsive behavior should be tested** on actual devices
- **Accessibility features may need enhancement** beyond AI generation
- **Component integration will require** manual adjustment to your codebase

**Ready to generate these components?** Start with the Student Dashboard prompt, then move to Course Module View, and finally the Assignment Submission enhancement!
