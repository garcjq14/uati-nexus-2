import { useState } from 'react';
import { useCourse } from '../../contexts/CourseContext';
import { Button } from '../ui/button';
import { Dropdown, DropdownItem } from '../ui/dropdown';
import { ChevronDown, GraduationCap, Plus } from 'lucide-react';
import { CreateCourseModal } from './CreateCourseModal';

export function CourseSelector() {
  const { currentCourse, courses, switchCourse, loading } = useCourse();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg bg-background/50">
        <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="text-xs sm:text-sm">Carregando...</span>
      </div>
    );
  }

  if (!currentCourse || courses.length === 0) {
    return (
      <>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm touch-manipulation"
          style={{ minHeight: '44px' }}
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Criar Curso</span>
          <span className="sm:hidden">Criar</span>
        </Button>
        <CreateCourseModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </>
    );
  }

  const handleSwitch = async (courseId: string) => {
    if (courseId === currentCourse.id) return;
    try {
      await switchCourse(courseId);
    } catch (error) {
      console.error('Failed to switch course:', error);
    }
  };

  return (
    <>
      <Dropdown
        trigger={
          <Button
            variant="outline"
            className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 min-w-[80px] xs:min-w-[100px] sm:min-w-[180px] max-w-[calc(100vw-7rem)] xs:max-w-[calc(100vw-8rem)] sm:max-w-none justify-between text-[10px] xs:text-xs sm:text-sm touch-manipulation"
            style={{ minHeight: '44px', maxWidth: 'calc(100vw - 7rem)' }}
          >
            <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 min-w-0 flex-1">
              <GraduationCap className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate text-[10px] xs:text-[11px] sm:text-sm">{currentCourse.title}</span>
            </div>
            <ChevronDown className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 opacity-50 flex-shrink-0 ml-0.5 xs:ml-1" />
          </Button>
        }
      >
        {courses.map((course) => (
          <DropdownItem
            key={course.id}
            onClick={() => handleSwitch(course.id)}
            className={course.id === currentCourse.id ? 'bg-primary/10' : ''}
          >
            <div className="flex items-center gap-2 w-full min-w-0">
              <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate flex-1 text-xs sm:text-sm">{course.title}</span>
              {course.id === currentCourse.id && (
                <span className="text-[10px] sm:text-xs text-primary flex-shrink-0">Atual</span>
              )}
            </div>
          </DropdownItem>
        ))}
        <DropdownItem
          onClick={() => setShowCreateModal(true)}
          className="border-t border-border mt-1 pt-2"
        >
          <div className="flex items-center gap-2 w-full text-primary min-w-0">
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm truncate">Criar Novo Curso</span>
          </div>
        </DropdownItem>
      </Dropdown>
      <CreateCourseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}

