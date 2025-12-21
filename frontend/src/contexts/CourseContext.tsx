import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useUser } from './UserContext';

interface Curriculum {
  id: string;
  code: string;
  title: string;
  description?: string;
  order: number;
  progress: number;
  status: 'locked' | 'active' | 'completed';
  block?: string | null;
  milestones?: string;
}

interface Project {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  progress: number;
  priority: boolean;
  technologies?: string | string[];
  deadline?: string | null;
  repository?: string | null;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  status: string;
  order: number;
}

interface Flashcard {
  id: string;
  deck: string;
  front: string;
  back: string;
  lastReview?: string;
  nextReview?: string;
}

interface ResourceAnnotation {
  id: string;
  resourceId: string;
  chapter?: string | null;
  content: string;
  createdAt: string;
}

interface Resource {
  id: string;
  title: string;
  author?: string;
  format: string;
  status: string;
  url?: string;
  description?: string | null;
  notes?: string | null;
  progress?: number;
  tags?: string[] | string | null;
  createdAt?: string;
  updatedAt?: string;
  topicId?: string | null;
  estimatedChapters?: number;
  annotations?: ResourceAnnotation[];
}

interface KnowledgeNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  connectionsFrom: unknown[];
  connectionsTo: unknown[];
}

interface CourseData {
  curriculum: Curriculum[];
  projects: Project[];
  flashcards: Flashcard[];
  resources: Resource[];
  knowledgeNodes: KnowledgeNode[];
  stats: {
    progress: number;
    hoursStudied: number;
    booksRead: number;
    flashcardsDue: number;
  };
}

interface Course {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface CourseContextType {
  courseData: CourseData;
  currentCourse: Course | null;
  courses: Course[];
  loading: boolean;
  refreshCourseData: () => Promise<void>;
  switchCourse: (courseId: string) => Promise<void>;
  createCourse: (title: string, description?: string) => Promise<Course>;
  updateCourse: (courseId: string, title: string, description?: string) => Promise<Course>;
  deleteCourse: (courseId: string) => Promise<void>;
  refreshCourses: () => Promise<void>;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useUser();
  const [courseData, setCourseData] = useState<CourseData>({
    curriculum: [],
    projects: [],
    flashcards: [],
    resources: [],
    knowledgeNodes: [],
    stats: {
      progress: 0,
      hoursStudied: 0,
      booksRead: 0,
      flashcardsDue: 0,
    },
  });
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshCourses = useCallback(async () => {
    if (!user) {
      setCourses([]);
      setCurrentCourse(null);
      return;
    }

    try {
      const response = await api.get('/courses');
      setCourses(response.data);
      
      // Get current course
      if (response.data.length > 0) {
        const currentResponse = await api.get('/courses/current');
        setCurrentCourse(currentResponse.data.course);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  }, [user]);

  const refreshCourseData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      // Return empty structure instead of null for consistency
      setCourseData({
        curriculum: [],
        projects: [],
        flashcards: [],
        resources: [],
        knowledgeNodes: [],
        stats: {
          progress: 0,
          hoursStudied: 0,
          booksRead: 0,
          flashcardsDue: 0,
        },
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/courses/current');
      const data = response.data;
      
      // Update current course
      if (data.course) {
        setCurrentCourse(data.course);
      } else {
        // No course available - user needs to create one
        setCurrentCourse(null);
      }
      
      // Always return a valid structure, even if backend returns empty data
      setCourseData({
        curriculum: Array.isArray(data.curriculum) ? data.curriculum : [],
        projects: Array.isArray(data.projects) ? data.projects : [],
        flashcards: Array.isArray(data.flashcards) ? data.flashcards : [],
        resources: Array.isArray(data.resources) ? data.resources : [],
        knowledgeNodes: Array.isArray(data.knowledgeNodes) ? data.knowledgeNodes : [],
        stats: data.stats && typeof data.stats === 'object' ? {
          progress: typeof data.stats.progress === 'number' ? data.stats.progress : 0,
          hoursStudied: typeof data.stats.hoursStudied === 'number' ? data.stats.hoursStudied : 0,
          booksRead: typeof data.stats.booksRead === 'number' ? data.stats.booksRead : 0,
          flashcardsDue: typeof data.stats.flashcardsDue === 'number' ? data.stats.flashcardsDue : 0,
        } : {
          progress: 0,
          hoursStudied: 0,
          booksRead: 0,
          flashcardsDue: 0,
        },
      });
    } catch (error) {
      console.error('Failed to fetch course data:', error);
      const axiosError = error as { 
        response?: { status?: number; data?: { error?: string; requiresCourseCreation?: boolean } };
        name?: string;
        message?: string;
      };
      
      if (axiosError.name === 'NetworkError' || axiosError.message?.includes('Network Error')) {
        // Network error - backend might not be running
        console.error('Network error: Backend might not be running');
        // Return empty structure instead of null
        setCourseData({
          curriculum: [],
          projects: [],
          flashcards: [],
          resources: [],
          knowledgeNodes: [],
          stats: {
            progress: 0,
            hoursStudied: 0,
            booksRead: 0,
            flashcardsDue: 0,
          },
        });
      } else if (axiosError.response?.status === 404 && axiosError.response?.data?.requiresCourseCreation) {
        // No course available - user needs to create one
        console.log('⚠️  No course available - user needs to create one');
        setCurrentCourse(null);
        setCourseData({
          curriculum: [],
          projects: [],
          flashcards: [],
          resources: [],
          knowledgeNodes: [],
          stats: {
            progress: 0,
            hoursStudied: 0,
            booksRead: 0,
            flashcardsDue: 0,
          },
        });
      } else if (axiosError.response?.status === 404 && axiosError.response?.data?.error?.includes('User not found')) {
        // User not found - token might be invalid, need to re-login
        console.warn('User not found in database. Please log in again.');
        // Return empty structure instead of null
        setCourseData({
          curriculum: [],
          projects: [],
          flashcards: [],
          resources: [],
          knowledgeNodes: [],
          stats: {
            progress: 0,
            hoursStudied: 0,
            booksRead: 0,
            flashcardsDue: 0,
          },
        });
      } else {
        // For other errors, return empty structure instead of null
        setCourseData({
          curriculum: [],
          projects: [],
          flashcards: [],
          resources: [],
          knowledgeNodes: [],
          stats: {
            progress: 0,
            hoursStudied: 0,
            booksRead: 0,
            flashcardsDue: 0,
          },
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const switchCourse = useCallback(async (courseId: string) => {
    if (!user) return;

    try {
      await api.put(`/courses/${courseId}/switch`);
      await refreshCourses();
      await refreshCourseData();
    } catch (error) {
      console.error('Failed to switch course:', error);
      throw error;
    }
  }, [user, refreshCourses, refreshCourseData]);

  const createCourse = useCallback(async (title: string, description?: string) => {
    if (!user) throw new Error('User not logged in');

    try {
      const response = await api.post('/courses', { title, description });
      await refreshCourses();
      await refreshCourseData();
      return response.data;
    } catch (error) {
      console.error('Failed to create course:', error);
      throw error;
    }
  }, [user, refreshCourses, refreshCourseData]);

  const updateCourse = useCallback(async (courseId: string, title: string, description?: string) => {
    if (!user) throw new Error('User not logged in');

    try {
      const response = await api.put(`/courses/${courseId}`, { title, description });
      await refreshCourses();
      if (currentCourse?.id === courseId) {
        await refreshCourseData();
      }
      return response.data;
    } catch (error) {
      console.error('Failed to update course:', error);
      throw error;
    }
  }, [user, currentCourse, refreshCourses, refreshCourseData]);

  const deleteCourse = useCallback(async (courseId: string) => {
    if (!user) throw new Error('User not logged in');

    try {
      await api.delete(`/courses/${courseId}`);
      await refreshCourses();
      await refreshCourseData();
    } catch (error) {
      console.error('Failed to delete course:', error);
      throw error;
    }
  }, [user, refreshCourses, refreshCourseData]);

  useEffect(() => {
    // Wait for user to be loaded before fetching course data
    if (!userLoading) {
      if (user) {
        refreshCourses();
        refreshCourseData();
      } else {
        // Reset to empty structure when user logs out
        setCourseData({
          curriculum: [],
          projects: [],
          flashcards: [],
          resources: [],
          knowledgeNodes: [],
          stats: {
            progress: 0,
            hoursStudied: 0,
            booksRead: 0,
            flashcardsDue: 0,
          },
        });
        setCurrentCourse(null);
        setCourses([]);
        setLoading(false);
      }
    }
  }, [user, userLoading, refreshCourses, refreshCourseData]);

  // Always provide context value, even during loading
  const contextValue: CourseContextType = {
    courseData,
    currentCourse,
    courses,
    loading: loading || userLoading,
    refreshCourseData,
    switchCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    refreshCourses,
  };

  return (
    <CourseContext.Provider value={contextValue}>
      {children}
    </CourseContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCourse() {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
}
