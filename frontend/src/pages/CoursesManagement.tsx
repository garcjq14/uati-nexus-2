import { useState } from 'react';
import { useCourse } from '../contexts/CourseContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Modal } from '../components/ui/modal';
import { useToast } from '../components/feedback/ToastSystem';
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  ArrowRight,
} from 'lucide-react';
import { CreateCourseModal } from '../components/courses/CreateCourseModal';

export default function CoursesManagement() {
  const {
    courses,
    currentCourse,
    switchCourse,
    updateCourse,
    deleteCourse,
    refreshCourses,
    loading,
  } = useCourse();
  const { success, error: showError } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleStartEdit = (course: typeof courses[0]) => {
    setEditingId(course.id);
    setEditTitle(course.title);
    setEditDescription(course.description || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
  };

  const handleSaveEdit = async (courseId: string) => {
    if (!editTitle.trim()) {
      showError('O título do curso é obrigatório');
      return;
    }

    try {
      await updateCourse(courseId, editTitle.trim(), editDescription.trim() || undefined);
      success('Curso atualizado com sucesso!');
      setEditingId(null);
      setEditTitle('');
      setEditDescription('');
    } catch (error: any) {
      showError(error?.response?.data?.error || 'Erro ao atualizar curso');
    }
  };

  const handleDelete = async (courseId: string) => {
    if (courses.length === 1) {
      showError('Não é possível deletar o único curso. Crie outro curso primeiro.');
      return;
    }

    if (!confirm('Tem certeza que deseja deletar este curso? Todos os dados relacionados serão perdidos.')) {
      return;
    }

    setDeletingId(courseId);
    try {
      await deleteCourse(courseId);
      success('Curso deletado com sucesso!');
    } catch (error: any) {
      showError(error?.response?.data?.error || 'Erro ao deletar curso');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSwitch = async (courseId: string) => {
    if (courseId === currentCourse?.id) return;
    try {
      await switchCourse(courseId);
      success('Curso alterado com sucesso!');
    } catch (error: any) {
      showError(error?.response?.data?.error || 'Erro ao trocar de curso');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Carregando cursos...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Cursos</h1>
          <p className="text-muted-foreground mt-2">
            Crie e gerencie seus cursos de aprendizado
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Curso
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card
            key={course.id}
            className={course.id === currentCourse?.id ? 'border-primary' : ''}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    {editingId === course.id ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-lg font-bold"
                      />
                    ) : (
                      course.title
                    )}
                  </CardTitle>
                </div>
                {course.id === currentCourse?.id && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    Atual
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingId === course.id ? (
                <div className="space-y-4">
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Descrição do curso..."
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground min-h-[80px] resize-none text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(course.id)}
                      disabled={!editTitle.trim()}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {course.description && (
                    <p className="text-sm text-muted-foreground">
                      {course.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    {course.id !== currentCourse?.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSwitch(course.id)}
                        className="flex-1"
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Usar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartEdit(course)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(course.id)}
                      disabled={deletingId === course.id || courses.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {courses.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum curso encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro curso para começar
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Curso
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateCourseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}



