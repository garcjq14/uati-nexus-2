import { useState } from 'react';
import { useCourse } from '../../contexts/CourseContext';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useToast } from '../feedback/ToastSystem';
import { GraduationCap } from 'lucide-react';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCourseModal({ isOpen, onClose }: CreateCourseModalProps) {
  const { createCourse } = useCourse();
  const { success, error: showError } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      showError('O título do curso é obrigatório');
      return;
    }

    setLoading(true);
    try {
      await createCourse(title.trim(), description.trim() || undefined);
      success('Curso criado com sucesso!');
      setTitle('');
      setDescription('');
      onClose();
    } catch (error: any) {
      showError(error?.response?.data?.error || 'Erro ao criar curso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Novo Curso">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Título do Curso *
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Ciência da Computação"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Descrição (opcional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o curso..."
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground min-h-[100px] resize-none"
            disabled={loading}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || !title.trim()}>
            {loading ? 'Criando...' : 'Criar Curso'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}



