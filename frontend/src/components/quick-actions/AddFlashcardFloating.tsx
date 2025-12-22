import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen } from 'lucide-react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../feedback/ToastSystem';
import { useAchievementChecker } from '../../hooks/useAchievementChecker';
import api from '../../lib/api';

interface AddFlashcardFloatingProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultDeck?: string;
}

export function AddFlashcardFloating({ isOpen, onClose, onSuccess, defaultDeck }: AddFlashcardFloatingProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [deck, setDeck] = useState(defaultDeck || '');
  const [existingDecks, setExistingDecks] = useState<string[]>([]);
  const [isNewDeck, setIsNewDeck] = useState(!defaultDeck);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();
  const { checkAfterAction } = useAchievementChecker();

  useEffect(() => {
    if (isOpen) {
      fetchDecks();
      if (defaultDeck) {
        setDeck(defaultDeck);
        setIsNewDeck(false);
      } else {
        setDeck('');
        setIsNewDeck(true);
      }
    }
  }, [isOpen, defaultDeck]);

  const fetchDecks = async () => {
    try {
      const response = await api.get<{ decks?: Array<{ deck: string }> }>('/flashcards');
      const decks = response.data.decks?.map(d => d.deck) || [];
      setExistingDecks(decks);
    } catch (err) {
      console.error('Failed to fetch decks:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim() || !deck.trim()) return;

    setLoading(true);
    try {
      await api.post('/flashcards', {
        front: front.trim(),
        back: back.trim(),
        deck: deck.trim(),
      });
      
      // Verificar conquistas automaticamente
      await checkAfterAction('flashcard_created');
      
      success('Flashcard criado com sucesso!');
      setFront('');
      setBack('');
      setDeck('');
      setIsNewDeck(true);
      onClose();
      onSuccess?.();
    } catch (err) {
      error('Erro ao criar flashcard. Tente novamente.');
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
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-white">Novo Flashcard</h2>
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
                  Deck *
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setIsNewDeck(false)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !isNewDeck
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Deck Existente
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewDeck(true)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isNewDeck
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Novo Deck
                  </button>
                </div>
                {!isNewDeck && existingDecks.length > 0 ? (
                  <select
                    value={deck}
                    onChange={(e) => setDeck(e.target.value)}
                    className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                    required
                  >
                    <option value="">Selecione um deck...</option>
                    {existingDecks.map((d) => (
                      <option key={d} value={d} className="bg-background">
                        {d}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={deck}
                    onChange={(e) => setDeck(e.target.value)}
                    placeholder="Nome do deck..."
                    required
                    autoFocus={isNewDeck}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Frente *
                </label>
                <Input
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="Pergunta ou conceito..."
                  required
                  autoFocus={!isNewDeck}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Verso *
                </label>
                <textarea
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="Resposta ou explicação..."
                  className="w-full min-h-[120px] rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
                  required
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
                  disabled={loading || !front.trim() || !back.trim() || !deck.trim()}
                >
                  {loading ? 'Criando...' : 'Criar Flashcard'}
                </Button>
              </div>
            </form>
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  );
}

