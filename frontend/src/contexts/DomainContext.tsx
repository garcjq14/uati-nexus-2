import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useCourse } from './CourseContext';

export interface DomainField {
  id: string;
  domainId: string;
  entity: string; // "Project", "Curriculum", "Resource"
  fieldName: string; // "technologies", "repository", "type"
  fieldType: string; // "string", "array", "number", "boolean", "select"
  label: string;
  required: boolean;
  options?: string | null; // JSON array para campos select
  defaultValue?: string | null;
  order: number;
  isActive: boolean;
}

export interface DomainPlugin {
  id: string;
  domainId: string;
  pluginKey: string; // "paradigms", "code-review", "business-metrics"
  name: string;
  description?: string | null;
  config: string; // JSON string
  isActive: boolean;
}

export interface Domain {
  id: string;
  code: string; // "it", "business", "psychology"
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  config: string; // JSON string
  isActive: boolean;
  domainFields?: DomainField[];
  domainPlugins?: DomainPlugin[];
}

interface DomainContextType {
  currentDomain: Domain | null;
  availableDomains: Domain[];
  domainFields: DomainField[];
  domainPlugins: DomainPlugin[];
  loading: boolean;
  refreshDomains: () => Promise<void>;
  refreshDomainFields: (entity?: string) => Promise<void>;
  refreshDomainPlugins: () => Promise<void>;
  getDomainFieldsForEntity: (entity: string) => DomainField[];
  getDomainConfig: () => Record<string, any>;
}

const DomainContext = createContext<DomainContextType | undefined>(undefined);

export function DomainProvider({ children }: { children: React.ReactNode }) {
  const { currentCourse } = useCourse();
  const [currentDomain, setCurrentDomain] = useState<Domain | null>(null);
  const [availableDomains, setAvailableDomains] = useState<Domain[]>([]);
  const [domainFields, setDomainFields] = useState<DomainField[]>([]);
  const [domainPlugins, setDomainPlugins] = useState<DomainPlugin[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshDomains = useCallback(async () => {
    try {
      const response = await api.get('/domains');
      setAvailableDomains(response.data || []);
    } catch (error) {
      console.error('Failed to fetch domains:', error);
      setAvailableDomains([]);
    }
  }, []);

  const refreshCurrentDomain = useCallback(async (domainId?: string) => {
    if (!domainId) {
      setCurrentDomain(null);
      setDomainFields([]);
      setDomainPlugins([]);
      return;
    }

    try {
      const response = await api.get(`/domains/${domainId}`);
      const domain = response.data;
      setCurrentDomain(domain);
      
      // Set fields and plugins from domain
      if (domain.domainFields) {
        setDomainFields(domain.domainFields);
      }
      if (domain.domainPlugins) {
        setDomainPlugins(domain.domainPlugins);
      }
    } catch (error) {
      console.error('Failed to fetch current domain:', error);
      setCurrentDomain(null);
      setDomainFields([]);
      setDomainPlugins([]);
    }
  }, []);

  const refreshDomainFields = useCallback(async (entity?: string) => {
    if (!currentDomain) {
      setDomainFields([]);
      return;
    }

    try {
      const params = entity ? { entity } : {};
      const response = await api.get(`/domains/${currentDomain.id}/fields`, { params });
      setDomainFields(response.data || []);
    } catch (error) {
      console.error('Failed to fetch domain fields:', error);
      setDomainFields([]);
    }
  }, [currentDomain]);

  const refreshDomainPlugins = useCallback(async () => {
    if (!currentDomain) {
      setDomainPlugins([]);
      return;
    }

    try {
      const response = await api.get(`/domains/${currentDomain.id}/plugins`);
      setDomainPlugins(response.data || []);
    } catch (error) {
      console.error('Failed to fetch domain plugins:', error);
      setDomainPlugins([]);
    }
  }, [currentDomain]);

  const getDomainFieldsForEntity = useCallback((entity: string): DomainField[] => {
    return domainFields.filter(field => field.entity === entity && field.isActive);
  }, [domainFields]);

  const getDomainConfig = useCallback((): Record<string, any> => {
    if (!currentDomain || !currentDomain.config) {
      return {};
    }
    try {
      return JSON.parse(currentDomain.config);
    } catch (error) {
      console.error('Failed to parse domain config:', error);
      return {};
    }
  }, [currentDomain]);

  // Load domain when course changes
  useEffect(() => {
    const loadDomain = async () => {
      setLoading(true);
      
      // First, load all available domains
      await refreshDomains();

      // Then, if we have a current course, try to get its domain
      if (currentCourse) {
        // Check if course has domainId (from CourseContext, course should include domain)
        // If course has domain relation, use it directly
        const courseWithDomain = currentCourse as any;
        if (courseWithDomain.domainId) {
          await refreshCurrentDomain(courseWithDomain.domainId);
        } else if (courseWithDomain.domain?.id) {
          await refreshCurrentDomain(courseWithDomain.domain.id);
        } else {
          // Try to fetch course with domain
          try {
            const courseResponse = await api.get(`/courses/${currentCourse.id}`);
            const course = courseResponse.data;
            
            if (course.domainId || course.domain?.id) {
              await refreshCurrentDomain(course.domainId || course.domain?.id);
            } else {
              // No domain assigned to course
              setCurrentDomain(null);
              setDomainFields([]);
              setDomainPlugins([]);
            }
          } catch (error) {
            console.error('Failed to fetch course domain:', error);
            setCurrentDomain(null);
            setDomainFields([]);
            setDomainPlugins([]);
          }
        }
      } else {
        setCurrentDomain(null);
        setDomainFields([]);
        setDomainPlugins([]);
      }
      
      setLoading(false);
    };

    loadDomain();
  }, [currentCourse, refreshDomains, refreshCurrentDomain]);

  // Refresh fields and plugins when domain changes
  useEffect(() => {
    if (currentDomain) {
      refreshDomainFields();
      refreshDomainPlugins();
    }
  }, [currentDomain, refreshDomainFields, refreshDomainPlugins]);

  const contextValue: DomainContextType = {
    currentDomain,
    availableDomains,
    domainFields,
    domainPlugins,
    loading,
    refreshDomains,
    refreshDomainFields,
    refreshDomainPlugins,
    getDomainFieldsForEntity,
    getDomainConfig,
  };

  return (
    <DomainContext.Provider value={contextValue}>
      {children}
    </DomainContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDomain() {
  const context = useContext(DomainContext);
  if (context === undefined) {
    throw new Error('useDomain must be used within a DomainProvider');
  }
  return context;
}

