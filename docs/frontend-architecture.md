# LMS CNN Integration Frontend Architecture Document

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-31 | 1.0 | Initial frontend architecture document | Winston (Architect) |

## Template and Framework Selection

Based on the existing codebase analysis, the project uses a modern React stack with shadcn/ui:

- **Framework:** React 19.1.1 with TypeScript
- **Build Tool:** Vite 
- **UI System:** shadcn/ui (built on Radix UI primitives)
- **Styling:** Tailwind CSS v4
- **Router:** React Router DOM v7
- **Animation:** Framer Motion
- **Icons:** Lucide React

**Analysis:** This setup represents the current gold standard for React applications in 2025. shadcn/ui provides the perfect balance between developer productivity (copy-paste components) and customization (you own the code). The combination with Radix UI ensures accessibility compliance while Tailwind CSS provides consistent styling.

## Frontend Tech Stack

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Framework | React | 19.1.1 | UI library with modern features | Latest React with Concurrent Features, Server Components support |
| Build Tool | Vite | Latest | Fast development and optimized builds | Superior DX over Webpack, fast HMR, optimized production builds |
| UI Library | shadcn/ui | Latest | Copy-paste accessible components | Best balance of customization and productivity |
| Primitives | Radix UI | Various | Unstyled accessible components | Industry standard for accessible component primitives |
| State Management | Zustand | 4.x | Lightweight state management | Simple API, excellent TypeScript support, minimal boilerplate |
| Routing | React Router DOM | 7.8.2 | Client-side routing | Most mature React routing solution |
| Styling | Tailwind CSS | 4.1.12 | Utility-first CSS framework | Excellent DX, consistent design system, small bundle size |
| Testing | Vitest + Testing Library | Latest | Unit and integration testing | Fast test runner, excellent React testing utilities |
| Component Library | Custom + shadcn/ui | N/A | Project-specific components | Tailored for LMS and CNN analysis workflows |
| Form Handling | React Hook Form | 7.x | Performant form management | Minimal re-renders, excellent validation support |
| Animation | Framer Motion | 12.23.12 | Smooth animations and transitions | Best-in-class React animation library |
| Dev Tools | TypeScript + ESLint | Latest | Type safety and code quality | Essential for large React applications |

## Project Structure

**Optimized Project Directory Structure (Based on Developer Preferences):**

```
frontend/
├── public/
│   └── vite.svg
├── src/
│   ├── components/           # shadcn/ui and custom components
│   │   ├── ui/              # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── auth/            # Authentication components
│   │   │   ├── AuthPage.tsx
│   │   │   ├── AuthPage.test.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── LoginForm.test.tsx
│   │   │   └── index.ts
│   │   ├── courses/         # Course-related components (lazy loaded)
│   │   │   ├── CourseModuleView.tsx
│   │   │   ├── CourseModuleView.test.tsx
│   │   │   └── index.ts
│   │   ├── assignments/     # Assignment components
│   │   │   ├── AssignmentSubmission.tsx
│   │   │   ├── AssignmentSubmission.test.tsx
│   │   │   └── index.ts
│   │   ├── cnn-analysis/    # CNN analysis visualization components
│   │   │   ├── AnalysisResults.tsx
│   │   │   ├── AnalysisVisualization.tsx
│   │   │   ├── ContentUploadInterface.tsx
│   │   │   ├── AnalysisResults.test.tsx
│   │   │   └── index.ts
│   │   ├── dashboard/       # Dashboard components
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── StudentDashboard.test.tsx
│   │   │   └── index.ts
│   │   └── navigation/      # Navigation components
│   │       ├── MainNavigation.tsx
│   │       ├── MainNavigation.test.tsx
│   │       └── index.ts
│   ├── contexts/            # React contexts (simple UI state)
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── AuthContextDefinition.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCNNAnalysis.ts
│   │   ├── useFileUpload.ts
│   │   └── use-mobile.tsx
│   ├── services/            # API service functions
│   │   ├── authAPI.ts
│   │   ├── coursesAPI.ts
│   │   └── cnnAnalysisAPI.ts
│   ├── store/               # Zustand stores (complex state)
│   │   ├── authStore.ts
│   │   ├── coursesStore.ts
│   │   ├── cnnAnalysisStore.ts
│   │   └── index.ts
│   ├── types/               # TypeScript type definitions
│   │   ├── auth.ts
│   │   ├── dashboard.ts
│   │   ├── upload.ts
│   │   └── api.ts
│   ├── lib/                 # Utility functions
│   │   ├── utils.ts
│   │   └── constants.ts
│   ├── data/                # Mock data and constants
│   │   └── mockData.ts
│   ├── assets/              # Static assets
│   │   └── react.svg
│   ├── App.tsx              # Root component
│   ├── DashboardApp.tsx     # Dashboard app wrapper
│   └── main.tsx             # Application entry point
├── components.json          # shadcn/ui configuration
├── package.json
├── tsconfig.json           # Updated with path mapping
├── vite.config.ts          # Updated with absolute imports
└── tailwind.config.js
```

**Key Improvements Based on Stakeholder Feedback:**

1. **Absolute Imports**: Configure `@/components`, `@/hooks`, `@/services` path mapping
2. **Co-located Tests**: Test files next to their components for better maintainability
3. **CNN Analysis Domain**: Separate feature domain for all CNN-related visualization components
4. **State Management Clarity**: Clear separation between Zustand (complex state) and Context (simple UI state)
5. **Lazy Loading Ready**: Course components structured for code splitting
6. **Consistent Naming**: PascalCase for components, camelCase for utilities and hooks

**Configuration Updates Required:**

**tsconfig.json additions:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/services/*": ["./src/services/*"],
      "@/store/*": ["./src/store/*"],
      "@/types/*": ["./src/types/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  }
}
```

## Component Standards

### Component Template

```typescript
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { forwardRef } from 'react'
import type { ComponentProps } from 'react'

// Define component-specific types
interface ExampleComponentProps extends ComponentProps<'div'> {
  title: string
  description?: string
  variant?: 'default' | 'secondary' | 'destructive'
  onAction?: () => void
  isLoading?: boolean
}

// Use forwardRef for components that need ref forwarding
const ExampleComponent = forwardRef<HTMLDivElement, ExampleComponentProps>(
  ({ title, description, variant = 'default', onAction, isLoading = false, className, ...props }, ref) => {
    return (
      <Card 
        ref={ref}
        className={cn(
          'w-full transition-all duration-200',
          {
            'opacity-50 pointer-events-none': isLoading,
          },
          className
        )}
        {...props}
      >
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <Button 
            variant={variant} 
            onClick={onAction}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Action'}
          </Button>
        </CardContent>
      </Card>
    )
  }
)

ExampleComponent.displayName = 'ExampleComponent'

export { ExampleComponent }
export type { ExampleComponentProps }
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`, `CNNAnalysisResults.tsx`)
- **Files**: PascalCase for components, camelCase for utilities (`utils.ts`, `apiClient.ts`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`, `useCNNAnalysis.ts`)
- **Types**: PascalCase with descriptive suffixes (`UserData`, `CNNAnalysisResult`, `ApiResponse`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_ENDPOINTS`, `DEFAULT_TIMEOUT`)
- **Stores**: camelCase with `Store` suffix (`authStore.ts`, `coursesStore.ts`)

## State Management

**Enhanced State Management Architecture with Comprehensive User Profile Management:**

### Complete User Profile Integration

```typescript
// Enhanced AuthStore with comprehensive user data management
interface ExtendedUserProfile {
  // Core authentication data
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  avatar?: string
  role: UserRole
  isEmailVerified: boolean
  isActive: boolean
  
  // Enhanced avatar/profile picture system
  profilePicture: {
    url?: string
    uploadedAt?: string
    isDefault: boolean
    generatedAvatar?: string  // AI-generated or initial-based avatar
    source: 'upload' | 'generated' | 'gravatar' | 'oauth'
    thumbnailUrl?: string     // Optimized smaller version
    originalUrl?: string      // Full resolution version
  }
  
  // Academic profile information
  academicInfo: {
    studentId?: string
    employeeId?: string
    department?: string
    major?: string
    year?: number
    gpa?: number
    enrollmentDate: string
    graduationDate?: string
  }
  
  // Learning preferences and progress
  learningProfile: {
    preferredLanguage: string
    timezone: string
    studyStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed'
    difficultyPreference: 'beginner' | 'intermediate' | 'advanced'
    notificationPreferences: {
      email: boolean
      push: boolean
      sms: boolean
      assignments: boolean
      discussions: boolean
      grades: boolean
      announcements: boolean
    }
  }
  
  // Course enrollment and progress
  courseData: {
    enrolledCourses: EnrolledCourse[]
    completedCourses: CompletedCourse[]
    totalCredits: number
    currentSemesterCredits: number
    overallProgress: number
    currentGPA: number
  }
  
  // CNN Analysis history and preferences
  cnnAnalysisProfile: {
    totalAnalyses: number
    successfulAnalyses: number
    averageConfidence: number
    preferredModels: string[]
    recentAnalyses: CNNAnalysisResult[]
    savedTemplates: AnalysisTemplate[]
  }
  
  // Enhanced course and content creation data (for professors)
  contentCreationProfile?: {
    coursesCreated: number
    modulesCreated: number
    totalStudentsReached: number
    averageRating: number
    contentCategories: string[]
    preferredContentTypes: ('video' | 'document' | 'interactive' | 'quiz')[]
    uploadQuota: {
      used: number
      total: number
      resetDate: string
    }
  }
  
  // Discussion and communication
  communicationProfile: {
    discussionPosts: number
    helpfulVotes: number
    reputation: number
    preferredCommunicationStyle: 'formal' | 'casual' | 'technical'
    mentorshipStatus: 'seeking' | 'offering' | 'none'
  }
  
  // System preferences
  systemPreferences: {
    theme: 'light' | 'dark' | 'system'
    colorScheme: 'blue' | 'green' | 'purple' | 'orange' | 'teal'
    compactMode: boolean
    animationsEnabled: boolean
    autoSave: boolean
    sessionTimeout: number
  }
  
  // Accessibility settings
  accessibilitySettings: {
    highContrast: boolean
    largeText: boolean
    reducedMotion: boolean
    screenReaderOptimized: boolean
    keyboardNavigation: boolean
    colorBlindnessType?: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
  }
  
  // Metadata
  metadata: {
    lastLogin: string
    loginCount: number
    profileCompleteness: number
    accountCreated: string
    lastUpdated: string
    ipAddress?: string
    userAgent?: string
  }
}

// Enhanced auth store with comprehensive profile management
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        profileLoading: false,
        lastSyncTime: null,
        
        // Initialize user session with complete profile fetch
        initializeSession: async () => {
          set({ isLoading: true })
          try {
            const token = authStorage.getToken()
            if (!token) {
              set({ isLoading: false })
              return
            }
            
            // Fetch complete user profile from multiple endpoints
            const [userProfile, courseData, cnnProfile, communicationProfile] = await Promise.all([
              authAPI.getCurrentUser(),
              coursesAPI.getUserCourseData(),
              cnnAnalysisAPI.getUserAnalysisProfile(),
              discussionsAPI.getUserCommunicationProfile()
            ])
            
            // Merge all profile data
            const completeProfile: ExtendedUserProfile = {
              ...userProfile,
              courseData,
              cnnAnalysisProfile: cnnProfile,
              communicationProfile,
              metadata: {
                ...userProfile.metadata,
                lastLogin: new Date().toISOString(),
                profileCompleteness: calculateProfileCompleteness(userProfile)
              }
            }
            
            set({ 
              user: completeProfile, 
              isAuthenticated: true, 
              isLoading: false,
              lastSyncTime: Date.now()
            })
            
            // Initialize real-time profile updates
            get().subscribeToProfileUpdates()
            
          } catch (error) {
            console.error('Session initialization failed:', error)
            authStorage.clearAll()
            set({ user: null, isAuthenticated: false, isLoading: false })
          }
        },
        
        // Enhanced login with complete profile fetch
        login: async (credentials: LoginCredentials) => {
          set({ isLoading: true, error: null })
          try {
            const response = await authAPI.login(credentials)
            
            if (response.success && response.data) {
              const { user: basicUser, tokens } = response.data
              
              // Store tokens
              authStorage.setToken(tokens.accessToken, credentials.rememberMe || false)
              authStorage.setRefreshToken(tokens.refreshToken)
              
              // Fetch complete profile data immediately after login
              await get().initializeSession()
              
              // Navigate to appropriate dashboard based on role and completion
              const user = get().user
              if (user) {
                if (user.metadata.profileCompleteness < 80) {
                  // Redirect to profile completion
                  navigateToProfileCompletion()
                } else {
                  navigateToDashboard(user.role)
                }
              }
              
            } else {
              throw new Error(response.message || 'Login failed')
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed'
            set({ error: errorMessage, isLoading: false })
            throw error
          }
        },
        
        // Real-time profile updates via WebSocket
        subscribeToProfileUpdates: () => {
          const ws = useRealtimeStore.getState().socket
          const userId = get().user?.id
          
          if (ws && userId) {
            ws.on(`user_profile_update_${userId}`, (updateData: Partial<ExtendedUserProfile>) => {
              const currentUser = get().user
              if (currentUser) {
                const updatedUser = { ...currentUser, ...updateData }
                set({ user: updatedUser, lastSyncTime: Date.now() })
              }
            })
            
            ws.on(`course_progress_update_${userId}`, (courseProgress: any) => {
              const currentUser = get().user
              if (currentUser) {
                const updatedUser = {
                  ...currentUser,
                  courseData: {
                    ...currentUser.courseData,
                    ...courseProgress
                  }
                }
                set({ user: updatedUser })
              }
            })
            
            ws.on(`cnn_analysis_complete_${userId}`, (analysisResult: CNNAnalysisResult) => {
              const currentUser = get().user
              if (currentUser) {
                const updatedProfile = {
                  ...currentUser.cnnAnalysisProfile,
                  totalAnalyses: currentUser.cnnAnalysisProfile.totalAnalyses + 1,
                  recentAnalyses: [analysisResult, ...currentUser.cnnAnalysisProfile.recentAnalyses.slice(0, 9)]
                }
                set({
                  user: {
                    ...currentUser,
                    cnnAnalysisProfile: updatedProfile
                  }
                })
              }
            })
          }
        },
        
        // Update profile completeness
        updateUserProfile: async (updates: Partial<ExtendedUserProfile>) => {
          const currentUser = get().user
          if (!currentUser) return
          
          set({ profileLoading: true })
          
          try {
            // Optimistic update
            const optimisticUser = { ...currentUser, ...updates }
            set({ user: optimisticUser })
            
            // Send updates to server
            const updatedUser = await authAPI.updateUserProfile(updates)
            
            // Update profile completeness
            const completeness = calculateProfileCompleteness(updatedUser)
            updatedUser.metadata.profileCompleteness = completeness
            
            set({ 
              user: updatedUser, 
              profileLoading: false,
              lastSyncTime: Date.now()
            })
            
            // Trigger profile update event for other components
            window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedUser }))
            
          } catch (error) {
            // Revert optimistic update on failure
            set({ user: currentUser, profileLoading: false })
            throw error
          }
        },
        
        // Enhanced avatar/profile picture management
        updateProfilePicture: async (file: File | null, source: 'upload' | 'generated' = 'upload') => {
          const currentUser = get().user
          if (!currentUser) return
          
          set({ profileLoading: true })
          
          try {
            let profilePictureData: any
            
            if (file) {
              // Upload new profile picture
              const uploadResponse = await authAPI.uploadProfilePicture(file)
              profilePictureData = {
                url: uploadResponse.url,
                thumbnailUrl: uploadResponse.thumbnailUrl,
                originalUrl: uploadResponse.originalUrl,
                uploadedAt: new Date().toISOString(),
                isDefault: false,
                source: 'upload'
              }
            } else {
              // Generate AI avatar based on name
              const generatedResponse = await authAPI.generateAvatar({
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
                style: 'academic' // professional style for educational platform
              })
              profilePictureData = {
                generatedAvatar: generatedResponse.avatarUrl,
                uploadedAt: new Date().toISOString(),
                isDefault: false,
                source: 'generated'
              }
            }
            
            // Update user profile with new picture data
            const updatedUser = {
              ...currentUser,
              profilePicture: profilePictureData,
              metadata: {
                ...currentUser.metadata,
                lastUpdated: new Date().toISOString(),
                profileCompleteness: calculateProfileCompleteness({
                  ...currentUser,
                  profilePicture: profilePictureData
                })
              }
            }
            
            // Send to server
            await authAPI.updateUserProfile({ profilePicture: profilePictureData })
            
            set({ 
              user: updatedUser, 
              profileLoading: false,
              lastSyncTime: Date.now()
            })
            
            // Trigger profile update event
            window.dispatchEvent(new CustomEvent('profilePictureUpdated', { detail: updatedUser }))
            
            return profilePictureData
            
          } catch (error) {
            set({ profileLoading: false })
            throw error
          }
        },
        
        // Remove profile picture (revert to default/generated)
        removeProfilePicture: async () => {
          const currentUser = get().user
          if (!currentUser) return
          
          set({ profileLoading: true })
          
          try {
            // Generate default avatar as fallback
            const defaultAvatar = await authAPI.generateAvatar({
              firstName: currentUser.firstName,
              lastName: currentUser.lastName,
              style: 'initials' // Simple initials-based avatar
            })
            
            const defaultPictureData = {
              generatedAvatar: defaultAvatar.avatarUrl,
              isDefault: true,
              source: 'generated' as const,
              uploadedAt: new Date().toISOString()
            }
            
            const updatedUser = {
              ...currentUser,
              profilePicture: defaultPictureData,
              metadata: {
                ...currentUser.metadata,
                lastUpdated: new Date().toISOString(),
                profileCompleteness: calculateProfileCompleteness({
                  ...currentUser,
                  profilePicture: defaultPictureData
                })
              }
            }
            
            await authAPI.updateUserProfile({ profilePicture: defaultPictureData })
            
            set({ 
              user: updatedUser, 
              profileLoading: false,
              lastSyncTime: Date.now()
            })
            
            return defaultPictureData
            
          } catch (error) {
            set({ profileLoading: false })
            throw error
          }
        },
        
        // Update learning preferences
        updateLearningPreferences: async (preferences: Partial<LearningProfile>) => {
          const currentUser = get().user
          if (!currentUser) return
          
          const updatedUser = {
            ...currentUser,
            learningProfile: {
              ...currentUser.learningProfile,
              ...preferences
            }
          }
          
          await get().updateUserProfile({ learningProfile: updatedUser.learningProfile })
        },
        
        // Update system preferences
        updateSystemPreferences: async (preferences: Partial<SystemPreferences>) => {
          const currentUser = get().user
          if (!currentUser) return
          
          const updatedUser = {
            ...currentUser,
            systemPreferences: {
              ...currentUser.systemPreferences,
              ...preferences
            }
          }
          
          // Apply theme changes immediately
          if (preferences.theme) {
            applyTheme(preferences.theme)
          }
          
          if (preferences.colorScheme) {
            applyColorScheme(preferences.colorScheme)
          }
          
          if (preferences.animationsEnabled !== undefined) {
            toggleAnimations(preferences.animationsEnabled)
          }
          
          await get().updateUserProfile({ systemPreferences: updatedUser.systemPreferences })
        },
        
        // Sync profile data from server (force refresh)
        syncProfile: async () => {
          const currentUser = get().user
          if (!currentUser) return
          
          set({ profileLoading: true })
          
          try {
            await get().initializeSession()
          } finally {
            set({ profileLoading: false })
          }
        },
        
        // Get profile completeness percentage
        getProfileCompleteness: () => {
          const user = get().user
          return user ? user.metadata.profileCompleteness : 0
        },
        
        // Check if profile needs attention
        needsProfileUpdate: () => {
          const user = get().user
          if (!user) return false
          
          const daysSinceUpdate = (Date.now() - new Date(user.metadata.lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
          const completeness = user.metadata.profileCompleteness
          
          return completeness < 80 || daysSinceUpdate > 30
        },
        
        // Logout with complete cleanup
        logout: async () => {
          const ws = useRealtimeStore.getState().socket
          const userId = get().user?.id
          
          // Unsubscribe from real-time updates
          if (ws && userId) {
            ws.off(`user_profile_update_${userId}`)
            ws.off(`course_progress_update_${userId}`)
            ws.off(`cnn_analysis_complete_${userId}`)
          }
          
          try {
            await authAPI.logout()
          } catch (error) {
            console.error('Logout API error:', error)
          } finally {
            authStorage.clearAll()
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false,
              profileLoading: false,
              lastSyncTime: null,
              error: null
            })
          }
        }
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ 
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          lastSyncTime: state.lastSyncTime
        })
      }
    ),
    { name: 'auth-store' }
  )
)

// Helper functions
function calculateProfileCompleteness(user: Partial<ExtendedUserProfile>): number {
  const sections = [
    { weight: 20, completed: !!(user.firstName && user.lastName && user.email) },
    { weight: 15, completed: !!user.academicInfo?.department },
    { weight: 15, completed: !!user.learningProfile?.preferredLanguage },
    { weight: 12, completed: !!(user.profilePicture?.url || user.profilePicture?.generatedAvatar) }, // Profile picture is important!
    { weight: 10, completed: !!user.academicInfo?.major },
    { weight: 8, completed: !!user.systemPreferences?.theme },
    { weight: 8, completed: user.isEmailVerified },
    { weight: 7, completed: !!user.learningProfile?.timezone },
    { weight: 5, completed: !!user.communicationProfile?.preferredCommunicationStyle }
  ]
  
  return sections.reduce((total, section) => 
    total + (section.completed ? section.weight : 0), 0
  )
}

function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement
  
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

function applyColorScheme(colorScheme: string) {
  document.documentElement.setAttribute('data-user-color', colorScheme)
}

function toggleAnimations(enabled: boolean) {
  document.documentElement.setAttribute('data-animations', enabled ? 'enabled' : 'disabled')
}

// Profile completion wizard store
interface ProfileWizardState {
  currentStep: number
  totalSteps: number
  completedSteps: Set<number>
  isCompleting: boolean
  
  nextStep: () => void
  previousStep: () => void
  completeStep: (step: number) => void
  resetWizard: () => void
}

export const useProfileWizardStore = create<ProfileWizardState>((set, get) => ({
  currentStep: 1,
  totalSteps: 6,
  completedSteps: new Set(),
  isCompleting: false,
  
  nextStep: () => {
    const current = get().currentStep
    const total = get().totalSteps
    if (current < total) {
      set({ currentStep: current + 1 })
    }
  },
  
  previousStep: () => {
    const current = get().currentStep
    if (current > 1) {
      set({ currentStep: current - 1 })
    }
  },
  
  completeStep: (step: number) => {
    const completed = new Set(get().completedSteps)
    completed.add(step)
    set({ completedSteps: completed })
  },
  
  resetWizard: () => {
    set({ 
      currentStep: 1, 
      completedSteps: new Set(),
      isCompleting: false 
    })
  }
}))
```

### User Data Synchronization Service

```typescript
// Comprehensive user data sync service
export class UserDataSyncService {
  private syncInterval: NodeJS.Timeout | null = null
  private lastSyncTime: number = 0
  private syncInProgress: boolean = false
  
  constructor() {
    this.initializeSync()
  }
  
  async initializeSync() {
    // Set up periodic sync every 5 minutes
    this.syncInterval = setInterval(() => {
      this.performBackgroundSync()
    }, 5 * 60 * 1000)
    
    // Sync on visibility change (when user returns to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && Date.now() - this.lastSyncTime > 2 * 60 * 1000) {
        this.performBackgroundSync()
      }
    })
    
    // Sync on network reconnection
    window.addEventListener('online', () => {
      this.performBackgroundSync()
    })
  }
  
  async performBackgroundSync() {
    if (this.syncInProgress) return
    
    const authStore = useAuthStore.getState()
    if (!authStore.isAuthenticated || !authStore.user) return
    
    this.syncInProgress = true
    
    try {
      // Fetch latest user data
      const [
        userProfile,
        courseProgress,
        cnnAnalysisData,
        communicationStats
      ] = await Promise.all([
        authAPI.getCurrentUser().catch(e => null),
        coursesAPI.getUserCourseData().catch(e => null),
        cnnAnalysisAPI.getUserAnalysisProfile().catch(e => null),
        discussionsAPI.getUserCommunicationProfile().catch(e => null)
      ])
      
      // Update store with fresh data
      if (userProfile) {
        const mergedProfile = {
          ...authStore.user,
          ...userProfile,
          courseData: courseProgress || authStore.user.courseData,
          cnnAnalysisProfile: cnnAnalysisData || authStore.user.cnnAnalysisProfile,
          communicationProfile: communicationStats || authStore.user.communicationProfile,
          metadata: {
            ...authStore.user.metadata,
            lastUpdated: new Date().toISOString()
          }
        }
        
        authStore.updateUserProfile(mergedProfile)
      }
      
      this.lastSyncTime = Date.now()
      
    } catch (error) {
      console.error('Background sync failed:', error)
    } finally {
      this.syncInProgress = false
    }
  }
  
  cleanup() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }
}

// Initialize the sync service
export const userDataSyncService = new UserDataSyncService()

// Enhanced Profile Picture Management API
export const profilePictureAPI = {
  // Upload profile picture with multiple size generation
  async uploadProfilePicture(file: File, onProgress?: (progress: number) => void): Promise<{
    url: string;
    thumbnailUrl: string;
    originalUrl: string;
    metadata: {
      size: number;
      dimensions: { width: number; height: number };
      format: string;
    };
  }> {
    // Client-side validation
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image (JPG, PNG, GIF, WebP)');
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('Image file size must be under 5MB');
    }
    
    // Check image dimensions (optional constraint)
    const dimensions = await getImageDimensions(file);
    if (dimensions.width < 100 || dimensions.height < 100) {
      throw new Error('Image must be at least 100x100 pixels');
    }
    
    return apiClient.uploadFile('/auth/profile-picture', file, onProgress);
  },
  
  // Generate AI/algorithmic avatar
  async generateAvatar(options: {
    firstName: string;
    lastName: string;
    style: 'academic' | 'initials' | 'geometric' | 'illustrated' | 'pixel-art';
    backgroundColor?: string;
    textColor?: string;
    seed?: string; // For consistent generation
  }): Promise<{ 
    avatarUrl: string; 
    style: string;
    seed: string; // Return seed for regeneration
  }> {
    return apiClient.post('/auth/generate-avatar', options);
  },
  
  // Get avatar from external services
  async getExternalAvatar(email: string, service: 'gravatar' | 'github' | 'google'): Promise<{ 
    avatarUrl: string | null;
    isAvailable: boolean;
  }> {
    return apiClient.get(`/auth/external-avatar?email=${encodeURIComponent(email)}&service=${service}`);
  },
  
  // Crop/resize existing image
  async cropProfilePicture(imageId: string, cropData: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
  }): Promise<{
    url: string;
    thumbnailUrl: string;
  }> {
    return apiClient.post(`/auth/profile-picture/${imageId}/crop`, cropData);
  },
  
  // Delete current profile picture
  async deleteProfilePicture(): Promise<void> {
    return apiClient.delete('/auth/profile-picture');
  },
  
  // Get profile picture upload history
  async getUploadHistory(): Promise<Array<{
    id: string;
    url: string;
    uploadedAt: string;
    isActive: boolean;
    source: string;
  }>> {
    return apiClient.get('/auth/profile-picture/history');
  }
};

// Helper function to get image dimensions
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

// Profile Picture Component System
export const ProfilePictureComponents = {
  // Avatar display component with fallbacks
  Avatar: ({ user, size = 'md', className = '', fallback = 'initials' }: {
    user: ExtendedUserProfile;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    className?: string;
    fallback?: 'initials' | 'generated' | 'icon';
  }) => {
    const sizeClasses = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-12 h-12 text-base',
      lg: 'w-16 h-16 text-lg',
      xl: 'w-24 h-24 text-xl',
      '2xl': 'w-32 h-32 text-2xl'
    };
    
    const getAvatarUrl = () => {
      if (user.profilePicture?.url) return user.profilePicture.url;
      if (user.profilePicture?.generatedAvatar) return user.profilePicture.generatedAvatar;
      return null;
    };
    
    const getInitials = () => {
      return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
    };
    
    const avatarUrl = getAvatarUrl();
    
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-primary/10 flex items-center justify-center ${className}`}>
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={`${user.firstName} ${user.lastName}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              (e.target as HTMLImageElement).style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = `<span class="font-medium text-primary">${getInitials()}</span>`;
            }}
          />
        ) : (
          <span className="font-medium text-primary">
            {fallback === 'initials' ? getInitials() : '?'}
          </span>
        )}
      </div>
    );
  },
  
  // Profile picture upload component
  ProfilePictureUpload: ({ user, onUpdate }: {
    user: ExtendedUserProfile;
    onUpdate: (newPictureData: any) => void;
  }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleFileUpload = async (file: File) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      try {
        const result = await profilePictureAPI.uploadProfilePicture(
          file,
          (progress) => setUploadProgress(progress)
        );
        
        onUpdate(result);
        toast('Profile picture updated successfully!', { type: 'success' });
        
      } catch (error) {
        console.error('Upload failed:', error);
        toast(error.message || 'Failed to upload profile picture', { type: 'error' });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    };
    
    const handleGenerateAvatar = async () => {
      setIsUploading(true);
      
      try {
        const result = await profilePictureAPI.generateAvatar({
          firstName: user.firstName,
          lastName: user.lastName,
          style: 'academic'
        });
        
        onUpdate({ generatedAvatar: result.avatarUrl, source: 'generated' });
        toast('Avatar generated successfully!', { type: 'success' });
        
      } catch (error) {
        console.error('Generation failed:', error);
        toast('Failed to generate avatar', { type: 'error' });
      } finally {
        setIsUploading(false);
      }
    };
    
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <ProfilePictureComponents.Avatar user={user} size="xl" />
          <div className="space-y-2">
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="outline"
            >
              {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload Photo'}
            </Button>
            <Button 
              onClick={handleGenerateAvatar}
              disabled={isUploading}
              variant="secondary"
            >
              Generate Avatar
            </Button>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />
        
        {isUploading && (
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>
    );
  }
};

// Enhanced Thumbnail and Preview Management System
export const thumbnailAPI = {
  // Course thumbnail management
  async uploadCourseThumbnail(courseId: string, file: File, onProgress?: (progress: number) => void): Promise<{
    thumbnailUrl: string;
    originalUrl: string;
    bannerUrl: string; // Wide banner format for course headers
    metadata: {
      size: number;
      dimensions: { width: number; height: number };
      format: string;
      dominantColors: string[];
    };
  }> {
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image (JPG, PNG, WebP)');
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit for course thumbnails
      throw new Error('Course thumbnail must be under 10MB');
    }
    
    return apiClient.uploadFile(`/courses/${courseId}/thumbnail`, file, onProgress);
  },
  
  // Generate course thumbnail from content
  async generateCourseThumbnail(courseId: string, options: {
    style: 'academic' | 'modern' | 'minimal' | 'colorful';
    primaryColor?: string;
    includeText?: boolean;
    template?: 'science' | 'engineering' | 'arts' | 'business' | 'general';
  }): Promise<{
    thumbnailUrl: string;
    bannerUrl: string;
    style: string;
  }> {
    return apiClient.post(`/courses/${courseId}/generate-thumbnail`, options);
  },
  
  // Module preview management
  async uploadModulePreview(moduleId: string, file: File): Promise<{
    previewUrl: string;
    thumbnailUrl: string;
    type: 'image' | 'video' | 'document';
  }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient.post(`/modules/${moduleId}/preview`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Generate module preview from content
  async generateModulePreview(moduleId: string, contentType: string): Promise<{
    previewUrl: string;
    thumbnailUrl: string;
    type: 'generated';
    icon: string;
  }> {
    return apiClient.post(`/modules/${moduleId}/generate-preview`, { contentType });
  },
  
  // Discussion image/media management
  async uploadDiscussionMedia(threadId: string, files: File[]): Promise<Array<{
    url: string;
    thumbnailUrl: string;
    type: 'image' | 'video' | 'document';
    filename: string;
    size: number;
  }>> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });
    
    return apiClient.post(`/discussions/${threadId}/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Get content thumbnails
  async getContentThumbnails(contentIds: string[]): Promise<Record<string, {
    thumbnailUrl: string;
    type: string;
    isGenerated: boolean;
  }>> {
    return apiClient.post('/content/thumbnails', { contentIds });
  }
};

// Content Preview Components System
export const ContentPreviewComponents = {
  // Course thumbnail with fallback
  CourseThumbnail: ({ course, size = 'md', className = '', showOverlay = true }: {
    course: {
      id: string;
      title: string;
      thumbnail?: {
        url?: string;
        dominantColors?: string[];
        isGenerated?: boolean;
      };
      category?: string;
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
    };
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    showOverlay?: boolean;
  }) => {
    const sizeClasses = {
      sm: 'w-32 h-20',
      md: 'w-48 h-32',
      lg: 'w-64 h-40',
      xl: 'w-80 h-48'
    };
    
    const getDifficultyColor = (difficulty?: string) => {
      switch (difficulty) {
        case 'beginner': return 'bg-green-500';
        case 'intermediate': return 'bg-yellow-500';
        case 'advanced': return 'bg-red-500';
        default: return 'bg-blue-500';
      }
    };
    
    const getDefaultGradient = () => {
      const colors = course.thumbnail?.dominantColors || ['#3B82F6', '#1E40AF'];
      return `linear-gradient(135deg, ${colors[0]}, ${colors[1] || colors[0]})`;
    };
    
    return (
      <div className={`${sizeClasses[size]} rounded-lg overflow-hidden relative group ${className}`}>
        {course.thumbnail?.url ? (
          <img 
            src={course.thumbnail.url}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              // Fallback to generated thumbnail
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = e.currentTarget.parentElement!;
              parent.style.background = getDefaultGradient();
              parent.innerHTML += `
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-white font-semibold text-center p-2 text-sm">
                    ${course.title}
                  </span>
                </div>
              `;
            }}
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center text-white font-semibold text-center p-2"
            style={{ background: getDefaultGradient() }}
          >
            <span className="text-sm leading-tight">{course.title}</span>
          </div>
        )}
        
        {showOverlay && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-2 left-2 right-2">
              {course.difficulty && (
                <span className={`inline-block px-2 py-1 rounded text-xs text-white ${getDifficultyColor(course.difficulty)}`}>
                  {course.difficulty}
                </span>
              )}
              {course.category && (
                <span className="inline-block px-2 py-1 rounded text-xs bg-white/20 text-white ml-1">
                  {course.category}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  },
  
  // Module preview with content type indicators
  ModulePreview: ({ module, size = 'sm', className = '' }: {
    module: {
      id: string;
      title: string;
      contentType: 'video' | 'document' | 'interactive' | 'quiz' | 'assignment';
      preview?: {
        url?: string;
        thumbnailUrl?: string;
        icon?: string;
      };
      duration?: string;
      fileCount?: number;
    };
    size?: 'xs' | 'sm' | 'md';
    className?: string;
  }) => {
    const sizeClasses = {
      xs: 'w-16 h-12',
      sm: 'w-20 h-16',
      md: 'w-24 h-20'
    };
    
    const getContentIcon = (type: string) => {
      const icons = {
        video: '🎥',
        document: '📄',
        interactive: '🎯',
        quiz: '❓',
        assignment: '📝'
      };
      return icons[type] || '📄';
    };
    
    const getContentColor = (type: string) => {
      const colors = {
        video: 'bg-red-100 text-red-600',
        document: 'bg-blue-100 text-blue-600',
        interactive: 'bg-purple-100 text-purple-600',
        quiz: 'bg-yellow-100 text-yellow-600',
        assignment: 'bg-green-100 text-green-600'
      };
      return colors[type] || 'bg-gray-100 text-gray-600';
    };
    
    return (
      <div className={`${sizeClasses[size]} rounded-md overflow-hidden relative group ${className}`}>
        {module.preview?.thumbnailUrl ? (
          <img 
            src={module.preview.thumbnailUrl}
            alt={module.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${getContentColor(module.contentType)}`}>
            <span className="text-lg">{getContentIcon(module.contentType)}</span>
          </div>
        )}
        
        {/* Content type indicator */}
        <div className="absolute top-1 right-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${getContentColor(module.contentType)}`}>
            {getContentIcon(module.contentType)}
          </div>
        </div>
        
        {/* Duration or file count overlay */}
        {(module.duration || module.fileCount) && (
          <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
            {module.duration || `${module.fileCount} files`}
          </div>
        )}
      </div>
    );
  },
  
  // Discussion media preview
  DiscussionMediaPreview: ({ media, onRemove }: {
    media: Array<{
      id?: string;
      url: string;
      thumbnailUrl?: string;
      type: 'image' | 'video' | 'document';
      filename: string;
      size?: number;
    }>;
    onRemove?: (index: number) => void;
  }) => {
    const formatFileSize = (bytes?: number) => {
      if (!bytes) return '';
      const mb = bytes / (1024 * 1024);
      return mb > 1 ? `${mb.toFixed(1)}MB` : `${(bytes / 1024).toFixed(0)}KB`;
    };
    
    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'image': return '🖼️';
        case 'video': return '🎥';
        case 'document': return '📄';
        default: return '📎';
      }
    };
    
    return (
      <div className="flex flex-wrap gap-2">
        {media.map((item, index) => (
          <div key={index} className="relative group">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted border border-border">
              {item.type === 'image' ? (
                <img 
                  src={item.thumbnailUrl || item.url}
                  alt={item.filename}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-xs">
                  <span className="text-lg mb-1">{getTypeIcon(item.type)}</span>
                  <span className="text-center text-muted-foreground truncate w-full px-1">
                    {item.filename}
                  </span>
                  {item.size && (
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(item.size)}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {onRemove && (
              <button
                onClick={() => onRemove(index)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    );
  },
  
  // Generic content thumbnail with smart fallbacks
  ContentThumbnail: ({ content, size = 'md', className = '' }: {
    content: {
      id: string;
      title: string;
      type: string;
      thumbnailUrl?: string;
      metadata?: any;
    };
    size?: 'sm' | 'md' | 'lg';
    className?: string;
  }) => {
    const sizeClasses = {
      sm: 'w-16 h-16',
      md: 'w-24 h-24',
      lg: 'w-32 h-32'
    };
    
    const getFileExtensionIcon = (type: string) => {
      const iconMap = {
        'pdf': '📄',
        'doc': '📝',
        'docx': '📝',
        'ppt': '📊',
        'pptx': '📊',
        'xls': '📈',
        'xlsx': '📈',
        'mp4': '🎥',
        'mp3': '🎵',
        'zip': '📦',
        'html': '🌐',
        'txt': '📃'
      };
      
      const extension = type.toLowerCase();
      return iconMap[extension] || '📄';
    };
    
    return (
      <div className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-muted border border-border flex items-center justify-center ${className}`}>
        {content.thumbnailUrl ? (
          <img 
            src={content.thumbnailUrl}
            alt={content.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to icon
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement!;
              parent.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full">
                  <span class="text-2xl mb-1">${getFileExtensionIcon(content.type)}</span>
                  <span class="text-xs text-muted-foreground text-center px-1">${content.type.toUpperCase()}</span>
                </div>
              `;
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <span className="text-2xl mb-1">{getFileExtensionIcon(content.type)}</span>
            <span className="text-xs text-muted-foreground text-center px-1">
              {content.type.toUpperCase()}
            </span>
          </div>
        )}
      </div>
    );
  }
};

// Enhanced Content Management Hooks
export const useContentThumbnails = () => {
  const [thumbnails, setThumbnails] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  
  const uploadCourseThumbnail = useCallback(async (courseId: string, file: File) => {
    setLoading(true);
    try {
      const result = await thumbnailAPI.uploadCourseThumbnail(courseId, file);
      setThumbnails(prev => ({ ...prev, [courseId]: result }));
      return result;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const generateCourseThumbnail = useCallback(async (courseId: string, options: any) => {
    setLoading(true);
    try {
      const result = await thumbnailAPI.generateCourseThumbnail(courseId, options);
      setThumbnails(prev => ({ ...prev, [courseId]: result }));
      return result;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const uploadModulePreview = useCallback(async (moduleId: string, file: File) => {
    setLoading(true);
    try {
      const result = await thumbnailAPI.uploadModulePreview(moduleId, file);
      setThumbnails(prev => ({ ...prev, [`module_${moduleId}`]: result }));
      return result;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const uploadDiscussionMedia = useCallback(async (threadId: string, files: File[]) => {
    setLoading(true);
    try {
      const results = await thumbnailAPI.uploadDiscussionMedia(threadId, files);
      setThumbnails(prev => ({ ...prev, [`discussion_${threadId}`]: results }));
      return results;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    thumbnails,
    loading,
    uploadCourseThumbnail,
    generateCourseThumbnail,
    uploadModulePreview,
    uploadDiscussionMedia
  };
};

export const useCourseContent = (courseId?: string) => {
  const [courseData, setCourseData] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { uploadCourseThumbnail, generateCourseThumbnail } = useContentThumbnails();
  
  const updateCourseThumbnail = useCallback(async (file: File) => {
    if (!courseId) throw new Error('No course ID provided');
    const result = await uploadCourseThumbnail(courseId, file);
    setCourseData(prev => ({ ...prev, thumbnail: result }));
    return result;
  }, [courseId, uploadCourseThumbnail]);
  
  return {
    courseData,
    modules,
    loading,
    error,
    updateCourseThumbnail,
    generateThumbnail: (options: any) => generateCourseThumbnail(courseId!, options)
  };
};
```

**Enhanced State Management Architecture (Based on Stakeholder Requirements):**

### Store Structure

```
src/store/
├── index.ts              # Export all stores and middleware
├── authStore.ts         # Authentication state with persistence
├── coursesStore.ts      # Course catalog with pagination and caching
├── cnnAnalysisStore.ts  # CNN analysis with real-time progress
├── assignmentsStore.ts  # Assignment submissions with real-time updates
├── discussionsStore.ts  # Discussion forum with real-time messaging
├── uiStore.ts          # Global UI state and user preferences
├── realtimeStore.ts    # WebSocket connection management
└── middleware/
    ├── conflictResolution.ts  # Optimistic update conflict handling
    ├── persistence.ts         # Form and preference persistence
    └── realtime.ts           # WebSocket middleware
```

### Enhanced State Management Template

```typescript
// Enhanced authStore.ts with conflict resolution
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { User, LoginCredentials } from '@/types/auth'
import { authAPI } from '@/services/authAPI'
import { conflictResolver } from './middleware/conflictResolution'

interface AuthState {
  // State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  lastModified: number
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      conflictResolver(
        (set, get) => ({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          lastModified: 0,
          
          login: async (credentials) => {
            set({ isLoading: true, error: null })
            try {
              const { user, token } = await authAPI.login(credentials)
              localStorage.setItem('token', token)
              set({ 
                user, 
                isAuthenticated: true, 
                isLoading: false,
                lastModified: Date.now()
              })
            } catch (error) {
              set({ 
                error: error instanceof Error ? error.message : 'Login failed',
                isLoading: false 
              })
            }
          },
          
          updateProfile: async (data) => {
            const currentUser = get().user
            if (!currentUser) return
            
            // Optimistic update
            const optimisticUser = { ...currentUser, ...data }
            set({ user: optimisticUser, lastModified: Date.now() })
            
            try {
              const updatedUser = await authAPI.updateProfile(data, get().lastModified)
              set({ user: updatedUser, lastModified: Date.now() })
            } catch (error) {
              // Conflict detected - refresh from server
              if (error.status === 409) {
                const freshUser = await authAPI.getCurrentUser()
                set({ 
                  user: freshUser,
                  error: 'Profile was updated by another session. Please try again.',
                  lastModified: Date.now()
                })
              } else {
                // Revert optimistic update
                set({ user: currentUser, error: error.message })
              }
            }
          },
          
          logout: () => {
            localStorage.removeItem('token')
            set({ user: null, isAuthenticated: false, error: null })
          },
          
          clearError: () => set({ error: null })
        })
      ),
      {
        name: 'auth-storage',
        partialize: (state) => ({ 
          user: state.user,
          isAuthenticated: state.isAuthenticated 
        })
      }
    ),
    { name: 'auth-store' }
  )
)

// Real-time CNN Analysis Store
interface CNNAnalysisState {
  analyses: CNNAnalysis[]
  currentAnalysis: CNNAnalysis | null
  progress: number
  isProcessing: boolean
  error: string | null
  
  startAnalysis: (file: File) => Promise<void>
  subscribeToProgress: (analysisId: string) => void
  unsubscribeFromProgress: () => void
}

export const useCNNAnalysisStore = create<CNNAnalysisState>()(
  devtools((set, get) => ({
    analyses: [],
    currentAnalysis: null,
    progress: 0,
    isProcessing: false,
    error: null,
    
    startAnalysis: async (file) => {
      set({ isProcessing: true, progress: 0, error: null })
      try {
        const analysis = await cnnAPI.startAnalysis(file)
        set({ currentAnalysis: analysis })
        get().subscribeToProgress(analysis.id)
      } catch (error) {
        set({ error: error.message, isProcessing: false })
      }
    },
    
    subscribeToProgress: (analysisId) => {
      const ws = useRealtimeStore.getState().socket
      if (ws) {
        ws.on(`analysis_progress_${analysisId}`, (data) => {
          set({ progress: data.progress })
          if (data.progress >= 100) {
            set({ 
              isProcessing: false,
              currentAnalysis: data.analysis,
              analyses: [...get().analyses, data.analysis]
            })
          }
        })
      }
    },
    
    unsubscribeFromProgress: () => {
      const ws = useRealtimeStore.getState().socket
      if (ws && get().currentAnalysis) {
        ws.off(`analysis_progress_${get().currentAnalysis.id}`)
      }
    }
  }))
)

// Real-time Store for WebSocket management
interface RealtimeState {
  socket: any | null
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'maintenance'
  
  connect: () => void
  disconnect: () => void
  subscribe: (channel: string, callback: Function) => void
  unsubscribe: (channel: string) => void
}

export const useRealtimeStore = create<RealtimeState>()(
  devtools((set, get) => ({
    socket: null,
    isConnected: false,
    connectionStatus: 'disconnected',
    
    connect: () => {
      if (get().socket) return
      
      set({ connectionStatus: 'connecting' })
      const socket = io(import.meta.env.VITE_WS_URL)
      
      socket.on('connect', () => {
        set({ isConnected: true, connectionStatus: 'connected' })
      })
      
      socket.on('disconnect', () => {
        set({ isConnected: false, connectionStatus: 'disconnected' })
      })
      
      socket.on('maintenance_mode', () => {
        set({ connectionStatus: 'maintenance' })
        // Show maintenance page component
      })
      
      set({ socket })
    },
    
    disconnect: () => {
      const socket = get().socket
      if (socket) {
        socket.disconnect()
        set({ socket: null, isConnected: false, connectionStatus: 'disconnected' })
      }
    },
    
    subscribe: (channel, callback) => {
      const socket = get().socket
      if (socket) {
        socket.on(channel, callback)
      }
    },
    
    unsubscribe: (channel) => {
      const socket = get().socket
      if (socket) {
        socket.off(channel)
      }
    }
  }))
)
```

### Updated Tech Stack Additions

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Real-time | Socket.io Client | Latest | WebSocket communication | Best WebSocket library with fallbacks |
| Persistence | Zustand Persist | Latest | State persistence | Built-in Zustand middleware |
| Conflict Resolution | Custom Middleware | N/A | Optimistic update handling | Custom solution for edit conflicts |

**Key Architecture Decisions Based on Requirements:**

1. **Conflict Resolution Strategy**: Optimistic updates with server timestamp validation. When conflicts occur, show error and refresh data from server.

2. **Real-time Updates**: WebSocket connections for discussions, assignments, and CNN progress with automatic reconnection.

3. **Form Persistence**: React Hook Form with localStorage for draft persistence across page refreshes.

4. **Pagination Strategy**: Server-side pagination for course catalogs with client-side caching of viewed pages.

5. **Maintenance Mode**: WebSocket event-driven maintenance page display when backend is down.

6. **Confirmed Server Responses**: All state updates wait for server confirmation before updating UI state.

**Performance Optimizations:**
- Batch real-time updates every 100ms to prevent UI thrashing
- Lazy load course content with code splitting
- Cache API responses with TTL for non-critical data
- Paginated course catalogs (20 items per page recommended for 500+ courses)

## API Integration

**API Service Architecture for LMS CNN Integration:**

### Service Template

```typescript
// Enhanced API service with error handling and authentication
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { useAuthStore } from '@/store/authStore'
import { useRealtimeStore } from '@/store/realtimeStore'

// Base API client configuration
class APIClient {
  private client: AxiosInstance
  private baseURL: string

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds for CNN analysis uploads
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config

        // Handle maintenance mode
        if (error.response?.status === 503) {
          useRealtimeStore.getState().socket?.emit('maintenance_mode')
          return Promise.reject(new Error('System is under maintenance'))
        }

        // Handle unauthorized (401) - token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true
          useAuthStore.getState().logout()
          window.location.href = '/auth/login'
          return Promise.reject(error)
        }

        // Handle conflicts (409)
        if (error.response?.status === 409) {
          return Promise.reject({
            ...error,
            isConflict: true,
            message: 'Data was modified by another user. Please refresh and try again.',
          })
        }

        // Handle validation errors (422)
        if (error.response?.status === 422) {
          return Promise.reject({
            ...error,
            validationErrors: error.response.data.errors,
            message: 'Validation failed',
          })
        }

        return Promise.reject(error)
      }
    )
  }

  // Generic HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }

  // File upload with progress
  async uploadFile<T>(
    url: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
    return response.data
  }
}

export const apiClient = new APIClient()

// CNN Analysis API Service
export const cnnAnalysisAPI = {
  async startAnalysis(file: File, onProgress?: (progress: number) => void) {
    return apiClient.uploadFile<CNNAnalysisResponse>(
      '/cnn/analyze',
      file,
      onProgress
    )
  },

  async getAnalysisHistory(page = 1, limit = 20) {
    return apiClient.get<PaginatedResponse<CNNAnalysis>>(
      `/cnn/history?page=${page}&limit=${limit}`
    )
  },

  async getAnalysisById(id: string) {
    return apiClient.get<CNNAnalysis>(`/cnn/analysis/${id}`)
  },

  async deleteAnalysis(id: string) {
    return apiClient.delete(`/cnn/analysis/${id}`)
  },
}

// Courses API Service
export const coursesAPI = {
  async getCourses(page = 1, limit = 20, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    })
    return apiClient.get<PaginatedResponse<Course>>(`/courses?${params}`)
  },

  async getCourseById(id: string) {
    return apiClient.get<CourseWithModules>(`/courses/${id}`)
  },

  async enrollInCourse(courseId: string) {
    return apiClient.post<EnrollmentResponse>(`/courses/${courseId}/enroll`)
  },

  async updateProgress(courseId: string, moduleId: string, progress: number) {
    return apiClient.patch(`/courses/${courseId}/modules/${moduleId}/progress`, {
      progress,
      timestamp: Date.now(),
    })
  },
}

// Assignments API Service
export const assignmentsAPI = {
  async getAssignments(courseId?: string, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(courseId && { courseId }),
    })
    return apiClient.get<PaginatedResponse<Assignment>>(`/assignments?${params}`)
  },

  async submitAssignment(
    assignmentId: string, 
    files: File[], 
    onProgress?: (progress: number) => void
  ) {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file)
    })
    formData.append('submittedAt', new Date().toISOString())

    return apiClient.client.post<SubmissionResponse>(
      `/assignments/${assignmentId}/submit`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(progress)
          }
        },
      }
    ).then(response => response.data)
  },

  async getSubmissionHistory(assignmentId: string) {
    return apiClient.get<Submission[]>(`/assignments/${assignmentId}/submissions`)
  },
}
```

### API Client Configuration

```typescript
// Environment-based API configuration
export const apiConfig = {
  development: {
    baseURL: 'http://localhost:3001/api',
    wsURL: 'ws://localhost:3001',
    timeout: 30000,
  },
  production: {
    baseURL: import.meta.env.VITE_API_URL,
    wsURL: import.meta.env.VITE_WS_URL,
    timeout: 30000,
  },
  staging: {
    baseURL: import.meta.env.VITE_API_URL,
    wsURL: import.meta.env.VITE_WS_URL,
    timeout: 30000,
  },
}

// Error handling types
export interface APIError {
  message: string
  status: number
  isConflict?: boolean
  validationErrors?: Record<string, string[]>
}

// Response types
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface CNNAnalysisResponse {
  id: string
  status: 'processing' | 'completed' | 'failed'
  confidence?: number
  results?: any
  processingTime?: number
}
```

**Rationale:** This API integration architecture provides robust error handling, automatic authentication token management, conflict resolution support, and optimized file uploads for CNN analysis. The service layer abstracts API complexity from components while providing type safety and consistent error handling.

**Key Decisions:**
- Axios for HTTP client with comprehensive interceptor setup
- Automatic token refresh and logout on 401 errors
- Special handling for file uploads with progress tracking
- Conflict detection (409) for optimistic update resolution
- Maintenance mode detection (503) for graceful degradation

**Trade-offs:**
- More complex setup vs. better error handling and maintainability
- Larger bundle size vs. comprehensive HTTP client features
- Centralized error handling vs. component-level error management

**Areas Needing Attention:**
- API rate limiting for CNN analysis endpoints
- Retry logic for failed requests
- Response caching strategies for course catalog data

## Routing

**Routing Configuration for LMS CNN Integration:**

### Route Configuration

```typescript
// Router configuration with authentication guards and lazy loading
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AuthPage } from '@/components/auth/AuthPage'
import { MainLayout } from '@/components/layouts/MainLayout'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorBoundary } from '@/components/ui/error-boundary'

// Lazy load components for code splitting
const StudentDashboard = lazy(() => import('@/components/dashboard/StudentDashboard'))
const ProfessorDashboard = lazy(() => import('@/components/dashboard/ProfessorDashboard'))
const CourseList = lazy(() => import('@/components/courses/CourseList'))
const CourseDetail = lazy(() => import('@/components/courses/CourseDetail'))
const CourseModuleView = lazy(() => import('@/components/courses/CourseModuleView'))
const AssignmentList = lazy(() => import('@/components/assignments/AssignmentList'))
const AssignmentDetail = lazy(() => import('@/components/assignments/AssignmentDetail'))
const AssignmentSubmission = lazy(() => import('@/components/assignments/AssignmentSubmission'))
const CNNAnalysis = lazy(() => import('@/components/cnn-analysis/CNNAnalysis'))
const AnalysisResults = lazy(() => import('@/components/cnn-analysis/AnalysisResults'))
const AnalysisHistory = lazy(() => import('@/components/cnn-analysis/AnalysisHistory'))
const DiscussionForum = lazy(() => import('@/components/discussions/DiscussionForum'))
const DiscussionThread = lazy(() => import('@/components/discussions/DiscussionThread'))
const UserProfile = lazy(() => import('@/components/profile/UserProfile'))
const MaintenancePage = lazy(() => import('@/components/maintenance/MaintenancePage'))

// Lazy loading wrapper with error boundary
const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  </ErrorBoundary>
)

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/auth/*',
    element: <AuthPage />,
    children: [
      { path: 'login', element: <LoginForm /> },
      { path: 'register', element: <RegisterForm /> },
      { path: 'forgot-password', element: <ForgotPasswordForm /> },
      { path: 'reset-password', element: <ResetPasswordForm /> },
    ],
  },
  
  // Maintenance mode route
  {
    path: '/maintenance',
    element: <LazyWrapper><MaintenancePage /></LazyWrapper>,
  },

  // Protected routes with main layout
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      // Root redirect to dashboard
      { 
        index: true, 
        element: <Navigate to="/dashboard" replace /> 
      },
      
      // Dashboard routes with role-based rendering
      {
        path: 'dashboard',
        element: (
          <LazyWrapper>
            <RoleDashboard />
          </LazyWrapper>
        ),
      },
      
      // Course routes
      {
        path: 'courses',
        children: [
          {
            index: true,
            element: <LazyWrapper><CourseList /></LazyWrapper>,
          },
          {
            path: ':courseId',
            element: <LazyWrapper><CourseDetail /></LazyWrapper>,
          },
          {
            path: ':courseId/modules/:moduleId',
            element: <LazyWrapper><CourseModuleView /></LazyWrapper>,
          },
        ],
      },
      
      // Assignment routes
      {
        path: 'assignments',
        children: [
          {
            index: true,
            element: <LazyWrapper><AssignmentList /></LazyWrapper>,
          },
          {
            path: ':assignmentId',
            element: <LazyWrapper><AssignmentDetail /></LazyWrapper>,
          },
          {
            path: ':assignmentId/submit',
            element: <LazyWrapper><AssignmentSubmission /></LazyWrapper>,
          },
        ],
      },
      
      // CNN Analysis routes
      {
        path: 'analysis',
        children: [
          {
            index: true,
            element: <LazyWrapper><CNNAnalysis /></LazyWrapper>,
          },
          {
            path: 'history',
            element: <LazyWrapper><AnalysisHistory /></LazyWrapper>,
          },
          {
            path: 'results/:analysisId',
            element: <LazyWrapper><AnalysisResults /></LazyWrapper>,
          },
        ],
      },
      
      // Discussion routes
      {
        path: 'discussions',
        children: [
          {
            index: true,
            element: <LazyWrapper><DiscussionForum /></LazyWrapper>,
          },
          {
            path: ':threadId',
            element: <LazyWrapper><DiscussionThread /></LazyWrapper>,
          },
        ],
      },
      
      // Course-specific discussions
      {
        path: 'courses/:courseId/discussions',
        children: [
          {
            index: true,
            element: <LazyWrapper><DiscussionForum courseId={true} /></LazyWrapper>,
          },
          {
            path: ':threadId',
            element: <LazyWrapper><DiscussionThread /></LazyWrapper>,
          },
        ],
      },
      
      // Profile route
      {
        path: 'profile',
        element: <LazyWrapper><UserProfile /></LazyWrapper>,
      },
    ],
  },
  
  // 404 fallback
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])

// Role-based dashboard component
const RoleDashboard = () => {
  const { user } = useAuthStore()
  
  if (user?.role === 'PROFESSOR' || user?.role === 'ADMIN') {
    return <ProfessorDashboard />
  }
  
  return <StudentDashboard />
}

// Protected Route component with authentication check
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore()
  const { connectionStatus } = useRealtimeStore()
  const location = useLocation()
  
  // Show maintenance page if backend is down
  if (connectionStatus === 'maintenance') {
    return <Navigate to="/maintenance" replace />
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }
  
  // Check if user account is active
  if (user && !user.isActive) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Account Suspended</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your account has been suspended. Please contact support for assistance.
            </p>
            <Button onClick={() => useAuthStore.getState().logout()} className="mt-4">
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return <>{children}</>
}

// Authentication guard hook for component-level protection
export const useAuthGuard = (requiredRoles?: UserRole[]) => {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login')
      return
    }
    
    if (requiredRoles && user && !requiredRoles.includes(user.role)) {
      navigate('/dashboard')
      return
    }
  }, [isAuthenticated, user, requiredRoles, navigate])
  
  return { user, isAuthenticated, hasPermission: !requiredRoles || (user && requiredRoles.includes(user.role)) }
}

// Route params and search params hooks
export const useRouteParams = () => {
  const params = useParams()
  return params
}

export const useSearchParams = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  
  const updateSearchParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key)
      } else {
        newParams.set(key, value)
      }
    })
    setSearchParams(newParams)
  }
  
  return { searchParams, updateSearchParams }
}
```

**Rationale:** This routing configuration provides comprehensive navigation for the LMS with role-based access control, lazy loading for performance, and proper error boundaries. The structure supports the educational workflow from course browsing to CNN analysis while maintaining security through authentication guards.

**Key Decisions:**
- React Router DOM v7 for modern routing with data APIs
- Lazy loading all major components for optimal bundle splitting
- Role-based dashboard rendering for different user types
- Maintenance mode routing for graceful backend downtime handling
- Nested routes for logical feature organization (courses, assignments, discussions)

**Trade-offs:**
- More complex routing setup vs. better performance and security
- Nested route structure vs. flat routes (better organization but more complex navigation)
- Component-level vs. route-level authentication guards (flexibility vs. simplicity)

**Areas Needing Attention:**
- Deep linking support for course modules and analysis results
- Route transition animations with Framer Motion
- SEO considerations for course and content pages

**Select 1-9 or just type your question/feedback:**

1. **Proceed to next section**
2. **Stakeholder Interview** - Interview team about navigation preferences and user flows
3. **Competitive Analysis** - Research routing patterns in educational platforms
4. **Technical Deep Dive** - Explore advanced routing patterns and navigation UX
5. **User Journey Mapping** - Map routing flow through student/professor workflows
6. **Performance Requirements** - Define route loading and transition performance
7. **Accessibility Audit** - Review routing accessibility and navigation patterns
8. **Constraint Analysis** - Identify routing limitations and browser compatibility
9. **Risk Assessment** - Evaluate routing security and navigation risks

## Styling Guidelines

**Styling Architecture for LMS CNN Integration:**

### Styling Approach

The project uses a **Tailwind CSS + shadcn/ui** approach for consistent, scalable styling:

**Core Philosophy:**
- **Utility-first**: Tailwind CSS for rapid development and consistent spacing/colors
- **Component-based**: shadcn/ui components provide accessible, customizable foundations
- **Design system**: CSS custom properties for theme consistency and dark mode support
- **Performance-focused**: Minimal CSS bundle through Tailwind's purging and utility reuse

**Why This Approach:**
- **Developer Experience**: Fast iteration with utility classes
- **Consistency**: Design tokens enforced through Tailwind configuration
- **Accessibility**: shadcn/ui components ensure WCAG compliance
- **Maintainability**: Component-based styling reduces CSS complexity
- **Performance**: Smaller CSS bundles than traditional CSS frameworks

### Global Theme Variables

```css
/* Global theme system with CSS custom properties */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Color System - Light Mode */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;

    /* Educational Theme Colors */
    --success: 142.1 76.2% 36.3%;
    --success-foreground: 355.7 100% 97.3%;
    --warning: 32.2 95% 44.1%;
    --warning-foreground: 355.7 100% 97.3%;
    --info: 199.9 89.1% 48.4%;
    --info-foreground: 355.7 100% 97.3%;

    /* CNN Analysis Specific Colors */
    --cnn-processing: 262.1 83.3% 57.8%;
    --cnn-completed: 142.1 76.2% 36.3%;
    --cnn-failed: 0 84.2% 60.2%;
    --cnn-confidence-high: 142.1 76.2% 36.3%;
    --cnn-confidence-medium: 32.2 95% 44.1%;
    --cnn-confidence-low: 0 84.2% 60.2%;

    /* Spacing and Layout */
    --radius: 0.5rem;
    --header-height: 4rem;
    --sidebar-width: 16rem;
    --sidebar-width-collapsed: 4rem;

    /* Typography Scale */
    --font-size-xs: 0.75rem;
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    --font-size-xl: 1.25rem;
    --font-size-2xl: 1.5rem;
    --font-size-3xl: 1.875rem;
    --font-size-4xl: 2.25rem;

    /* Shadows and Effects */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

    /* Animation Durations */
    --duration-75: 75ms;
    --duration-100: 100ms;
    --duration-150: 150ms;
    --duration-200: 200ms;
    --duration-300: 300ms;
    --duration-500: 500ms;
    --duration-700: 700ms;
    --duration-1000: 1000ms;
  }

  .dark {
    /* Color System - Dark Mode */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;

    /* Educational Theme Colors - Dark Mode */
    --success: 142.1 70.6% 45.3%;
    --success-foreground: 144.9 80.4% 10%;
    --warning: 32.2 95% 44.1%;
    --warning-foreground: 20.5 90.2% 4.3%;
    --info: 199.9 89.1% 48.4%;
    --info-foreground: 220.9 39.3% 11%;

    /* CNN Analysis Specific Colors - Dark Mode */
    --cnn-processing: 262.1 83.3% 57.8%;
    --cnn-completed: 142.1 70.6% 45.3%;
    --cnn-failed: 0 62.8% 30.6%;
    --cnn-confidence-high: 142.1 70.6% 45.3%;
    --cnn-confidence-medium: 32.2 95% 44.1%;
    --cnn-confidence-low: 0 62.8% 30.6%;
  }

  /* Base Typography */
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  /* Custom Scrollbar */
  ::-webkit-scrollbar {
    @apply w-2;
  }

  ::-webkit-scrollbar-track {
    @apply bg-muted;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-muted-foreground/20 rounded-full;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-muted-foreground/30;
  }

  /* Focus Styles for Accessibility */
  *:focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
  }

  /* Print Styles */
  @media print {
    .no-print {
      display: none !important;
    }
    
    .print-break-before {
      break-before: page;
    }
  }
}

@layer components {
  /* Custom Component Classes */
  .btn-gradient {
    @apply bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground;
  }

  .card-glass {
    @apply bg-background/80 backdrop-blur-md border border-border/50;
  }

  .text-gradient {
    @apply bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent;
  }

  /* CNN Analysis Progress Bar */
  .progress-cnn {
    @apply relative overflow-hidden rounded-full bg-muted;
  }

  .progress-cnn::before {
    content: '';
    @apply absolute inset-0 bg-gradient-to-r from-cnn-processing to-cnn-processing/70;
    width: var(--progress, 0%);
    transition: width 0.3s ease-in-out;
  }

  /* Course Progress Indicators */
  .progress-course {
    @apply h-2 bg-muted rounded-full overflow-hidden;
  }

  .progress-course-fill {
    @apply h-full bg-gradient-to-r from-success to-success/80 transition-all duration-500;
  }

  /* Discussion Thread Styling */
  .discussion-content {
    @apply prose prose-sm dark:prose-invert max-w-none;
  }

  .discussion-content h1,
  .discussion-content h2,
  .discussion-content h3 {
    @apply text-foreground;
  }

  .discussion-content code {
    @apply bg-muted px-1.5 py-0.5 rounded text-sm;
  }

  .discussion-content pre {
    @apply bg-muted border border-border rounded-lg p-4 overflow-x-auto;
  }

  /* Assignment Submission Status */
  .status-submitted {
    @apply bg-info/10 text-info border-info/20;
  }

  .status-graded {
    @apply bg-success/10 text-success border-success/20;
  }

  .status-late {
    @apply bg-warning/10 text-warning border-warning/20;
  }

  .status-missing {
    @apply bg-destructive/10 text-destructive border-destructive/20;
  }

  /* Mobile-specific styles */
  @media (max-width: 768px) {
    .mobile-scroll {
      @apply overflow-x-auto;
    }
    
    .mobile-grid {
      @apply grid-cols-1;
    }
  }
}

@layer utilities {
  /* Animation Utilities */
  .animate-fade-in {
    animation: fadeIn var(--duration-300) ease-in-out;
  }

  .animate-slide-up {
    animation: slideUp var(--duration-300) ease-out;
  }

  .animate-pulse-slow {
    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  /* Layout Utilities */
  .full-bleed {
    width: 100vw;
    margin-left: calc(50% - 50vw);
  }

  .container-narrow {
    @apply max-w-4xl mx-auto px-4;
  }

  .container-wide {
    @apply max-w-7xl mx-auto px-4;
  }

  /* Typography Utilities */
  .text-balance {
    text-wrap: balance;
  }

  .text-pretty {
    text-wrap: pretty;
  }

  /* Accessibility Utilities */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .focus-trap {
    @apply focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2;
  }
}

/* Keyframe Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Component-specific animations */
@keyframes cnn-scan {
  0%, 100% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
}

.cnn-scanning::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent);
  animation: cnn-scan 2s infinite;
}
```

**Rationale:** This styling system provides a comprehensive design foundation that scales with the LMS application. The CSS custom properties enable consistent theming across light/dark modes while the component-specific classes handle domain-specific styling for CNN analysis, course progress, and educational workflows.

## 8. Enhanced Styling Guidelines

### Modern OKLCH Color Architecture

```css
/* OKLCH Base Color System with Dynamic Theming */
:root {
  /* Primary base color - Professional, approachable blue */
  --color-primary-base: oklch(0.55 0.15 250);
  
  /* Dynamic color calculations using 'from' syntax */
  --primary: oklch(from var(--color-primary-base) l c h);
  --primary-hover: oklch(from var(--color-primary-base) calc(l - 0.05) c h);
  --primary-active: oklch(from var(--color-primary-base) calc(l - 0.1) c h);
  --primary-muted: oklch(from var(--color-primary-base) calc(l + 0.2) calc(c * 0.3) h);
  --primary-foreground: oklch(from var(--color-primary-base) 0.98 0 h);
  
  /* Academic secondary - Approachable green */
  --color-secondary-base: oklch(0.65 0.15 140);
  --secondary: oklch(from var(--color-secondary-base) l c h);
  --secondary-hover: oklch(from var(--color-secondary-base) calc(l - 0.05) c h);
  --secondary-muted: oklch(from var(--color-secondary-base) calc(l + 0.15) calc(c * 0.4) h);
  --secondary-foreground: oklch(from var(--color-secondary-base) 0.98 0 h);
  
  /* CNN Analysis accent - Vibrant orange */
  --color-accent-base: oklch(0.70 0.25 45);
  --accent: oklch(from var(--color-accent-base) l c h);
  --accent-hover: oklch(from var(--color-accent-base) calc(l - 0.05) c h);
  --accent-muted: oklch(from var(--color-accent-base) calc(l + 0.15) calc(c * 0.3) h);
  --accent-foreground: oklch(from var(--color-accent-base) 0.98 0 h);
  
  /* Neutral system with automatic light/dark adaptation */
  --color-neutral-base: oklch(0.98 0.005 250);
  --background: oklch(from var(--color-neutral-base) l c h);
  --surface: oklch(from var(--color-neutral-base) calc(l - 0.02) c h);
  --surface-hover: oklch(from var(--color-neutral-base) calc(l - 0.04) c h);
  --border: oklch(from var(--color-neutral-base) calc(l - 0.08) calc(c * 2) h);
  --input: oklch(from var(--color-neutral-base) calc(l - 0.02) c h);
  
  /* Text colors */
  --foreground: oklch(from var(--color-neutral-base) 0.15 0.005 h);
  --muted-foreground: oklch(from var(--color-neutral-base) 0.45 0.005 h);
  
  /* Status colors with semantic meaning */
  --success: oklch(0.65 0.15 140);
  --warning: oklch(0.75 0.15 85);
  --destructive: oklch(0.60 0.20 25);
  --info: oklch(from var(--color-primary-base) l c h);
}

/* Dark mode - Automatic color inversion with OKLCH */
[data-theme="dark"] {
  --color-neutral-base: oklch(0.15 0.005 250);
  --background: oklch(from var(--color-neutral-base) l c h);
  --surface: oklch(from var(--color-neutral-base) calc(l + 0.03) c h);
  --surface-hover: oklch(from var(--color-neutral-base) calc(l + 0.05) c h);
  --border: oklch(from var(--color-neutral-base) calc(l + 0.12) calc(c * 2) h);
  --input: oklch(from var(--color-neutral-base) calc(l + 0.03) c h);
  
  --foreground: oklch(from var(--color-neutral-base) 0.95 0.005 h);
  --muted-foreground: oklch(from var(--color-neutral-base) 0.65 0.005 h);
  
  /* Adjust primary colors for dark mode */
  --primary: oklch(from var(--color-primary-base) calc(l + 0.1) c h);
  --secondary: oklch(from var(--color-secondary-base) calc(l + 0.1) c h);
  --accent: oklch(from var(--color-accent-base) calc(l + 0.05) c h);
}

/* User customization - Dynamic base color updates */
[data-user-color="blue"] { --color-primary-base: oklch(0.55 0.15 250); }
[data-user-color="green"] { --color-primary-base: oklch(0.55 0.15 140); }
[data-user-color="purple"] { --color-primary-base: oklch(0.55 0.15 290); }
[data-user-color="orange"] { --color-primary-base: oklch(0.60 0.20 45); }
[data-user-color="teal"] { --color-primary-base: oklch(0.60 0.15 180); }
```

### Professional Academic Component Styling

```css
/* Educational interface components with accessibility focus */
.course-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.course-card:hover {
  background: var(--surface-hover);
  border-color: var(--primary);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px oklch(from var(--foreground) l c h / 0.1);
}

.course-card:focus-within {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* CNN Analysis interface with academic professionalism */
.cnn-analysis-container {
  background: linear-gradient(135deg, 
    var(--background) 0%, 
    oklch(from var(--accent) calc(l + 0.25) calc(c * 0.1) h) 100%
  );
  border: 1px solid oklch(from var(--accent) l calc(c * 0.3) h);
  border-radius: 16px;
  padding: 2rem;
  position: relative;
}

.cnn-analysis-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--accent), var(--primary));
  border-radius: 16px 16px 0 0;
}

/* Academic progress indicators */
.progress-container {
  background: oklch(from var(--muted-foreground) l c h / 0.1);
  border-radius: 8px;
  height: 8px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  height: 100%;
  border-radius: 8px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(90deg, 
    transparent 0%, 
    oklch(from var(--background) l c h / 0.3) 50%, 
    transparent 100%
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Technical report styling */
.technical-report {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  line-height: 1.6;
}

.technical-report h3 {
  color: var(--primary);
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}
```

### Minimal Animation System (Performance-Optimized)

```css
/* Performance-focused, accessibility-first animations */
@media (prefers-reduced-motion: no-preference) {
  .fade-in {
    animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .slide-up {
    animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .cnn-processing {
    animation: processingPulse 1.5s ease-in-out infinite alternate;
  }
  
  .loading-spinner {
    animation: spin 1s linear infinite;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0; 
    transform: translateY(12px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes processingPulse {
  from { 
    opacity: 0.6; 
    transform: scale(1); 
  }
  to { 
    opacity: 1; 
    transform: scale(1.02); 
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Provide alternative feedback for loading states */
  .loading-spinner {
    animation: none;
    opacity: 0.7;
  }
  
  .cnn-processing {
    animation: none;
    border-left: 3px solid var(--accent);
  }
}
```

### Mobile-First Responsive Grid System

```css
/* Container system with academic spacing */
.container {
  width: 100%;
  margin: 0 auto;
  padding: 1rem;
  max-width: 100%;
}

@media (min-width: 640px) {
  .container { 
    padding: 1.5rem;
    max-width: 640px;
  }
}

@media (min-width: 768px) {
  .container { 
    padding: 2rem;
    max-width: 768px;
  }
}

@media (min-width: 1024px) {
  .container { 
    padding: 2.5rem;
    max-width: 1024px;
  }
}

@media (min-width: 1280px) {
  .container { 
    padding: 3rem;
    max-width: 1200px;
  }
}

/* Educational content grid system */
.grid-responsive {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .grid-responsive {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
}

/* Course layout specific grids */
.course-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .course-grid {
    grid-template-columns: 1fr 300px;
    gap: 2rem;
  }
}

@media (min-width: 1024px) {
  .course-grid {
    grid-template-columns: 250px 1fr 300px;
    gap: 2.5rem;
  }
}
```

### WCAG 2.1 AA Accessibility & Standards Compliance

```css
/* Focus management with enhanced visibility */
.focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: 4px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --color-primary-base: oklch(0.45 0.25 250);
    --color-neutral-base: oklch(1.0 0 0);
    --border: oklch(0.20 0 0);
  }
  
  [data-theme="dark"] {
    --color-neutral-base: oklch(0.10 0 0);
    --border: oklch(0.80 0 0);
  }
  
  /* Ensure sufficient contrast for interactive elements */
  .course-card {
    border-width: 2px;
  }
  
  .progress-bar {
    outline: 1px solid var(--foreground);
  }
}

/* Print optimization for academic reports */
@media print {
  * {
    background: white !important;
    color: black !important;
    box-shadow: none !important;
  }
  
  .no-print { display: none !important; }
  
  .print-break-before { page-break-before: always; }
  .print-break-after { page-break-after: always; }
  
  /* Optimize CNN analysis results for printing */
  .cnn-analysis-container {
    border: 2px solid black !important;
    padding: 1rem !important;
    margin: 1rem 0 !important;
  }
  
  .course-card {
    border: 1px solid black !important;
    margin-bottom: 1rem !important;
    page-break-inside: avoid;
  }
}

/* Screen reader accessibility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Skip navigation for keyboard users */
.skip-nav {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary);
  color: var(--primary-foreground);
  padding: 8px;
  border-radius: 4px;
  text-decoration: none;
  z-index: 1000;
  transition: top 0.2s;
}

.skip-nav:focus {
  top: 6px;
}

/* Improved focus indicators for educational workflows */
.interactive-element:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px oklch(from var(--primary) l c h / 0.2);
}

/* Color-blind friendly status indicators */
.status-success::before { content: "✓ "; }
.status-warning::before { content: "⚠ "; }
.status-error::before { content: "✗ "; }
.status-info::before { content: "ℹ "; }
```

### Theme Implementation Helper

```typescript
// Theme management utility
export const themeManager = {
  setUserColor: (color: string) => {
    document.documentElement.setAttribute('data-user-color', color)
    localStorage.setItem('user-preferred-color', color)
  },
  
  toggleDarkMode: () => {
    const current = document.documentElement.getAttribute('data-theme')
    const newTheme = current === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme-preference', newTheme)
  },
  
  initializeTheme: () => {
    // Respect system preference initially
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const savedTheme = localStorage.getItem('theme-preference')
    const savedColor = localStorage.getItem('user-preferred-color')
    
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light')
    const color = savedColor || 'blue'
    
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-user-color', color)
  }
}
```

**Rationale:** This enhanced OKLCH-based styling system provides a future-proof color architecture that automatically adapts across light/dark modes while maintaining WCAG 2.1 AA accessibility standards. The professional, academic styling reflects the educational context while the performance-optimized animations ensure fast loading speeds on mid-tier devices.

**Key Decisions:**
- CSS custom properties for runtime theme switching
- Educational-specific color tokens for different states and contexts
- Component-based utility classes for common patterns
- CNN analysis specific styling for progress and confidence indicators
- Accessibility-first focus management and screen reader support

**Trade-offs:**
- Larger CSS file vs. comprehensive design system
- CSS custom properties vs. Tailwind config (runtime vs. build-time theming)
- Component classes vs. pure utilities (maintainability vs. flexibility)

**Areas Needing Attention:**
- Print styles for course materials and analysis reports
- High contrast mode support for accessibility compliance
- Performance optimization for mobile devices

**Select 1-9 or just type your question/feedback:**

1. **Proceed to next section**
2. **Stakeholder Interview** - Interview team about design preferences and branding
3. **Competitive Analysis** - Research styling approaches in educational platforms
4. **Technical Deep Dive** - Explore advanced Tailwind patterns and design systems
5. **User Journey Mapping** - Map visual design through user workflows
6. **Performance Requirements** - Define CSS performance and loading benchmarks
7. **Accessibility Audit** - Review styling accessibility and contrast requirements
8. **Constraint Analysis** - Identify styling limitations and browser support
9. **Risk Assessment** - Evaluate design system maintainability risks

**Select 1-9 or just type your question/feedback:**

1. **Proceed to next section**
2. **Stakeholder Interview** - Interview team about API error handling preferences
3. **Competitive Analysis** - Research API patterns in educational platforms
4. **Technical Deep Dive** - Explore advanced HTTP client patterns and caching
5. **User Journey Mapping** - Map API calls through user workflows
6. **Performance Requirements** - Define API response time benchmarks
7. **Accessibility Audit** - Review API error messaging accessibility
8. **Constraint Analysis** - Identify API integration constraints
9. **Risk Assessment** - Evaluate API dependency risks and fallbacks
