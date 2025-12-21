import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText } from 'lucide-react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../feedback/ToastSystem';
import api from '../../lib/api';

interface AddNoteFloatingProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddNoteFloating({ isOpen, onClose, onSuccess }: AddNoteFloatingProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await api.post('/notes', {
        title: title.trim(),
        content: content.trim() || '',
      });
      
      // Check for first note achievement
      const notesResponse = await api.get('/notes').catch(() => ({ data: [] }));
      const noteCount = notesResponse.data?.length || 0;
      if (noteCount === 1) {
        const { checkFirstNoteAchievement } = await import('../../lib/achievements');
        checkFirstNoteAchievement(noteCount);
      }
      
      success('Nota criada com sucesso!');
      setTitle('');
      setContent('');
      onClose();
      onSuccess?.();
    } catch (err) {
      error('Erro ao criar nota. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-background rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-white">Nova Nota</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Título *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título da nota..."
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Conteúdo
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Conteúdo da nota..."
                  className="w-full min-h-[120px] rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  disabled={loading || !title.trim()}
                >
                  {loading ? 'Criando...' : 'Criar Nota'}
                </Button>
              </div>
            </form>
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  );
}


