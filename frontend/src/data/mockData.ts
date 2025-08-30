import type { CourseProgress, Assignment, CNNAnalysisResult, CourseDetail } from '@/types/dashboard';

export const mockCourses: CourseProgress[] = [
  {
    id: 'course-1',
    name: 'Introduction to Machine Learning',
    completion: 0.75,
    modulesCompleted: 6,
    totalModules: 8,
    nextDeadline: '2025-09-15',
    color: 'green'
  },
  {
    id: 'course-2',
    name: 'Computer Vision Fundamentals',
    completion: 0.45,
    modulesCompleted: 3,
    totalModules: 7,
    nextDeadline: '2025-09-10',
    color: 'yellow'
  },
  {
    id: 'course-3',
    name: 'Neural Network Architecture',
    completion: 0.25,
    modulesCompleted: 2,
    totalModules: 10,
    nextDeadline: '2025-09-08',
    color: 'red'
  },
  {
    id: 'course-4',
    name: 'Data Preprocessing Techniques',
    completion: 0.90,
    modulesCompleted: 9,
    totalModules: 10,
    nextDeadline: '2025-09-20',
    color: 'green'
  }
];

export const mockAssignments: Assignment[] = [
  {
    id: 'assignment-1',
    title: 'CNN Architecture Analysis',
    courseName: 'Computer Vision Fundamentals',
    dueDate: '2025-09-05',
    status: 'in_progress',
    progress: 0.6,
    urgency: 'due_today'
  },
  {
    id: 'assignment-2',
    title: 'Image Classification Project',
    courseName: 'Introduction to Machine Learning',
    dueDate: '2025-09-02',
    status: 'not_started',
    progress: 0,
    urgency: 'overdue'
  },
  {
    id: 'assignment-3',
    title: 'Data Augmentation Report',
    courseName: 'Data Preprocessing Techniques',
    dueDate: '2025-09-12',
    status: 'ready_to_submit',
    progress: 1,
    urgency: 'due_week'
  },
  {
    id: 'assignment-4',
    title: 'Transfer Learning Implementation',
    courseName: 'Neural Network Architecture',
    dueDate: '2025-09-18',
    status: 'not_started',
    progress: 0,
    urgency: 'future'
  },
  {
    id: 'assignment-5',
    title: 'Model Evaluation Metrics',
    courseName: 'Introduction to Machine Learning',
    dueDate: '2025-08-28',
    status: 'submitted',
    progress: 1,
    urgency: 'overdue'
  }
];

export const mockAnalysisResults: CNNAnalysisResult[] = [
  {
    id: 'analysis-1',
    fileName: 'neural-network-diagram.png',
    confidence: 0.92,
    insights: ['Contains neural network architecture', 'Shows feedforward layers', 'Includes activation functions'],
    timestamp: '2025-08-30T10:30:00Z',
    thumbnail: '/api/placeholder/64/64'
  },
  {
    id: 'analysis-2',
    fileName: 'cnn-layers.jpg',
    confidence: 0.87,
    insights: ['Convolutional layers detected', 'Pooling operations visible', 'Feature maps illustrated'],
    timestamp: '2025-08-29T15:45:00Z',
    thumbnail: '/api/placeholder/64/64'
  },
  {
    id: 'analysis-3',
    fileName: 'dataset-samples.png',
    confidence: 0.78,
    insights: ['Image classification dataset', 'Multiple object categories', 'Training data examples'],
    timestamp: '2025-08-29T09:20:00Z',
    thumbnail: '/api/placeholder/64/64'
  },
  {
    id: 'analysis-4',
    fileName: 'model-performance.pdf',
    confidence: 0.94,
    insights: ['Performance metrics chart', 'Accuracy curves shown', 'Loss function analysis'],
    timestamp: '2025-08-28T14:15:00Z'
  },
  {
    id: 'analysis-5',
    fileName: 'data-preprocessing.png',
    confidence: 0.85,
    insights: ['Data transformation steps', 'Normalization techniques', 'Augmentation examples'],
    timestamp: '2025-08-28T11:00:00Z',
    thumbnail: '/api/placeholder/64/64'
  },
  {
    id: 'analysis-6',
    fileName: 'transfer-learning.jpg',
    confidence: 0.91,
    insights: ['Pre-trained model usage', 'Fine-tuning approach', 'Layer freezing strategy'],
    timestamp: '2025-08-27T16:30:00Z',
    thumbnail: '/api/placeholder/64/64'
  }
];

// Detailed course data for module view
export const mockCourseDetail: CourseDetail = {
  id: 'course-2',
  title: 'Computer Vision Fundamentals',
  description: 'Learn the basics of computer vision and image processing with hands-on CNN implementations.',
  instructor: 'Dr. Sarah Chen',
  progress: 0.45,
  totalSteps: 28,
  completedSteps: 12,
  estimatedHours: 15,
  modules: [
    {
      id: 'module-1',
      title: 'Introduction to Computer Vision',
      description: 'Overview of computer vision concepts and applications',
      order: 1,
      isCompleted: true,
      isLocked: false,
      estimatedMinutes: 45,
      completion: 1.0,
      steps: [
        {
          id: 'step-1-1',
          title: 'What is Computer Vision?',
          type: 'content',
          estimatedTime: 15,
          isCompleted: true,
          isCurrent: false,
          isLocked: false,
          content: '<h2>Introduction to Computer Vision</h2><p>Computer vision is a field of artificial intelligence that trains computers to interpret and understand the visual world...</p>'
        },
        {
          id: 'step-1-2',
          title: 'Applications in Industry',
          type: 'video',
          estimatedTime: 20,
          isCompleted: true,
          isCurrent: false,
          isLocked: false
        },
        {
          id: 'step-1-3',
          title: 'Knowledge Check',
          type: 'quiz',
          estimatedTime: 10,
          isCompleted: true,
          isCurrent: false,
          isLocked: false
        }
      ]
    },
    {
      id: 'module-2',
      title: 'Image Processing Basics',
      description: 'Learn fundamental image processing techniques',
      order: 2,
      isCompleted: false,
      isLocked: false,
      estimatedMinutes: 90,
      completion: 0.5,
      steps: [
        {
          id: 'step-2-1',
          title: 'Digital Images and Pixels',
          type: 'content',
          estimatedTime: 25,
          isCompleted: true,
          isCurrent: false,
          isLocked: false,
          content: '<h2>Understanding Digital Images</h2><p>Digital images are composed of pixels, each containing color information...</p>'
        },
        {
          id: 'step-2-2',
          title: 'Image Filtering Techniques',
          type: 'content',
          estimatedTime: 30,
          isCompleted: true,
          isCurrent: false,
          isLocked: false
        },
        {
          id: 'step-2-3',
          title: 'Upload Image Samples',
          type: 'upload',
          estimatedTime: 20,
          isCompleted: false,
          isCurrent: true,
          isLocked: false,
          cnnAnalysisEnabled: true
        },
        {
          id: 'step-2-4',
          title: 'Edge Detection Assignment',
          type: 'assignment',
          estimatedTime: 35,
          isCompleted: false,
          isCurrent: false,
          isLocked: false,
          cnnAnalysisEnabled: true
        }
      ]
    },
    {
      id: 'module-3',
      title: 'Convolutional Neural Networks',
      description: 'Deep dive into CNN architecture and implementation',
      order: 3,
      isCompleted: false,
      isLocked: false,
      estimatedMinutes: 120,
      completion: 0.0,
      steps: [
        {
          id: 'step-3-1',
          title: 'CNN Architecture Overview',
          type: 'content',
          estimatedTime: 25,
          isCompleted: false,
          isCurrent: false,
          isLocked: false
        },
        {
          id: 'step-3-2',
          title: 'Convolution and Pooling',
          type: 'video',
          estimatedTime: 30,
          isCompleted: false,
          isCurrent: false,
          isLocked: false
        },
        {
          id: 'step-3-3',
          title: 'Build Your First CNN',
          type: 'assignment',
          estimatedTime: 45,
          isCompleted: false,
          isCurrent: false,
          isLocked: false,
          cnnAnalysisEnabled: true
        },
        {
          id: 'step-3-4',
          title: 'CNN Performance Evaluation',
          type: 'quiz',
          estimatedTime: 20,
          isCompleted: false,
          isCurrent: false,
          isLocked: false
        }
      ]
    },
    {
      id: 'module-4',
      title: 'Advanced Topics',
      description: 'Transfer learning, optimization, and real-world applications',
      order: 4,
      isCompleted: false,
      isLocked: true,
      estimatedMinutes: 150,
      completion: 0.0,
      steps: [
        {
          id: 'step-4-1',
          title: 'Transfer Learning',
          type: 'content',
          estimatedTime: 30,
          isCompleted: false,
          isCurrent: false,
          isLocked: true
        },
        {
          id: 'step-4-2',
          title: 'Model Optimization',
          type: 'video',
          estimatedTime: 40,
          isCompleted: false,
          isCurrent: false,
          isLocked: true
        },
        {
          id: 'step-4-3',
          title: 'Final Project',
          type: 'assignment',
          estimatedTime: 80,
          isCompleted: false,
          isCurrent: false,
          isLocked: true,
          cnnAnalysisEnabled: true
        }
      ]
    }
  ]
};
