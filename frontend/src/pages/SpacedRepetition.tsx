import { useState, useEffect, useMemo } from 'react';
import { useCourse } from '../contexts/CourseContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
import { Input } from '../components/ui/input';
import { FileText, BarChart3, Plus, BrainCircuit, RefreshCw, TrendingUp, Edit2, Trash2, History } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../components/feedback/ToastSystem';
import { useAchievementChecker } from '../hooks/useAchievementChecker';
import api from '../lib/api';

interface Flashcard {
  id: string;
  deck: string;
  front: string;
  back: string;
  lastReview?: string;
  nextReview?: string;
}

interface Deck {
  deck: string;
  lastReview?: string;
  due: number;
  new: number;
}

interface Stats {
  totalCards: number;
  dueCards: number;
  averageAccuracy: number;
  streak: number;
}

type StudyPhase = 'question' | 'answer' | 'complete';

export default function SpacedRepetition() {
  const { courseData, loading } = useCourse();
  const { success, error } = useToast();
  const { checkAfterAction } = useAchievementChecker();

  // Estados principais
  const [decks, setDecks] = useState<Deck[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [phase, setPhase] = useState<StudyPhase>('question');
  const [stats, setStats] = useState<Stats>({ totalCards: 0, dueCards: 0, averageAccuracy: 0, streak: 0 });

  // Modais
  const [showStats, setShowStats] = useState(false);
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [showCreateFlashcard, setShowCreateFlashcard] = useState(false);
  const [showEditFlashcard, setShowEditFlashcard] = useState(false);

  // Formulários
  const [newDeckName, setNewDeckName] = useState('');
  const [flashcardForm, setFlashcardForm] = useState({ front: '', back: '', deck: '' });
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);
  const deckSummary = useMemo(() => {
    const totalDue = decks.reduce((acc, d) => acc + (d.due || 0), 0);
    const totalNew = decks.reduce((acc, d) => acc + (d.new || 0), 0);
    const topDecks = [...decks].sort((a, b) => (b.due || 0) - (a.due || 0)).slice(0, 4);
    return { totalDue, totalNew, topDecks };
  }, [decks]);

  // Carregar dados iniciais
  useEffect(() => {
    if (courseData) {
      loadDecks();
      loadStats();
    }
  }, [courseData]);

  const loadDecks = async () => {
    try {
      const response = await api.get('/flashcards');
      setDecks(response.data.decks || []);
      setFlashcards(response.data.flashcards || []);
    } catch (err) {
      console.error('Erro ao carregar decks:', err);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/flashcards/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  // Iniciar estudo
  const startStudy = async () => {
    try {
      const response = await api.get('/flashcards/due');
      if (response.data && response.data.length > 0) {
        setCurrentCard(response.data[0]);
        setPhase('question');
      } else {
        error('Não há flashcards para revisar no momento!');
      }
    } catch (err) {
      console.error('Erro ao iniciar estudo:', err);
      error('Erro ao iniciar sessão de estudo');
    }
  };

  // Virar card
  const flipCard = () => {
    if (phase === 'question') {
      setPhase('answer');
    } else if (phase === 'answer') {
      setPhase('question');
    }
  };

  // Avaliar card
  const rateCard = async (quality: number) => {
    if (!currentCard) return;

    try {
      await api.post(`/flashcards/${currentCard.id}/review`, { quality });
      
      // Verificar conquistas automaticamente após revisar flashcard
      await checkAfterAction('flashcard_reviewed');
      
      await loadDecks();
      await loadStats();

      // Próximo card
      const response = await api.get('/flashcards/due');
      if (response.data && response.data.length > 0) {
        setCurrentCard(response.data[0]);
        setPhase('question');
      } else {
        setCurrentCard(null);
        setPhase('complete');
      }
    } catch (err) {
      console.error('Erro ao avaliar card:', err);
      error('Erro ao avaliar flashcard');
    }
  };

  // Criar deck
  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return;

    setFlashcardForm({ front: '', back: '', deck: newDeckName.trim() });
    setShowCreateDeck(false);
    setShowCreateFlashcard(true);
    setNewDeckName('');
  };

  // Criar flashcard
  const handleCreateFlashcard = async () => {
    if (!flashcardForm.front.trim() || !flashcardForm.back.trim() || !flashcardForm.deck.trim()) {
      error('Preencha todos os campos');
      return;
    }

    try {
      await api.post('/flashcards', flashcardForm);

      // Verificar conquistas automaticamente
      await checkAfterAction('flashcard_created');

      success('Flashcard criado com sucesso!');
      setFlashcardForm({ front: '', back: '', deck: '' });
      setShowCreateFlashcard(false);
      await loadDecks();
      await loadStats();
    } catch (err) {
      error('Erro ao criar flashcard');
    }
  };

  // Editar flashcard
  const handleEditFlashcard = async () => {
    if (!editingFlashcard || !flashcardForm.front.trim() || !flashcardForm.back.trim() || !flashcardForm.deck.trim()) {
      error('Preencha todos os campos');
      return;
    }

    try {
      await api.put(`/flashcards/${editingFlashcard.id}`, flashcardForm);
      success('Flashcard atualizado com sucesso!');
      setFlashcardForm({ front: '', back: '', deck: '' });
      setEditingFlashcard(null);
      setShowEditFlashcard(false);
      await loadDecks();
    } catch (err) {
      error('Erro ao atualizar flashcard');
    }
  };

  // Deletar flashcard
  const handleDeleteFlashcard = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este flashcard?')) return;

    try {
      await api.delete(`/flashcards/${id}`);
      success('Flashcard deletado com sucesso!');
      await loadDecks();
      await loadStats();
      if (currentCard?.id === id) {
        setCurrentCard(null);
      }
    } catch (err) {
      error('Erro ao deletar flashcard');
    }
  };

  // Helpers
  const openCreateFlashcard = (deckName?: string) => {
    setFlashcardForm({ front: '', back: '', deck: deckName || '' });
    setShowCreateFlashcard(true);
  };

  const openEditFlashcard = (flashcard: Flashcard) => {
    setEditingFlashcard(flashcard);
    setFlashcardForm({ front: flashcard.front, back: flashcard.back, deck: flashcard.deck });
    setShowEditFlashcard(true);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Nunca';
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Ontem';
    return `${diff} dias atrás`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Tela de estudo
  if (currentCard && phase !== 'complete') {
    return (
      <div className="mx-auto flex w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl flex-col gap-4 sm:gap-6 lg:gap-8 xl:gap-10 min-h-[calc(100vh-10rem)] sm:min-h-[calc(100vh-12rem)] justify-center px-3 xs:px-4">
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-mono uppercase tracking-[0.3em] sm:tracking-[0.5em] text-primary">
          <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-primary animate-pulse"></span>
          </span>
          Sessão Ativa
        </div>

        <div className="perspective-1000 w-full h-[400px] sm:h-[450px] lg:h-[500px] xl:h-[550px] 2xl:h-[600px] min-h-[400px] sm:min-h-[450px] lg:min-h-[500px] xl:min-h-[550px] 2xl:min-h-[600px] relative group">
          <Card className="w-full h-full bg-card border-white/10 shadow-2xl hover:shadow-[0_0_50px_rgba(120,6,6,0.1)] transition-all duration-300">
            <CardHeader className="border-b border-white/5 pb-3 sm:pb-4 lg:pb-6 p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <BrainCircuit className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Deck</p>
                    <p className="font-bold text-white text-xs sm:text-sm truncate">{currentCard.deck.toUpperCase()}</p>
                  </div>
                </div>
                <div className={cn(
                  "px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border text-[10px] sm:text-xs font-medium flex-shrink-0",
                  phase === 'question'
                    ? "border-white/10 bg-white/5 text-muted-foreground"
                    : "border-primary/30 bg-primary/10 text-primary"
                )}>
                  {phase === 'question' ? 'Frente' : 'Verso'}
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 text-center">
              <div className="w-full max-w-2xl">
                {phase === 'question' ? (
                  <div>
                    <div className="text-center mb-6 sm:mb-8 lg:mb-12">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                        Pense na resposta...
                      </div>
                    </div>
                    <p className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-serif leading-relaxed text-white break-words">
                      {currentCard.front}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="text-center mb-6 sm:mb-8 lg:mb-12">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium mb-4 border border-green-500/30">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Verifique sua resposta
                      </div>
                    </div>
                    <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-medium leading-relaxed text-white/90 break-words">
                      {currentCard.back}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>

            <div className="p-4 sm:p-6 lg:p-8 border-t border-white/5 bg-white/[0.02]">
              {phase === 'question' ? (
                <Button
                  variant="default"
                  className="w-full py-4 sm:py-5 lg:py-6 text-sm sm:text-base lg:text-lg font-medium shadow-[0_0_20px_rgba(120,6,6,0.3)] bg-primary hover:bg-primary/90 text-white transition-all hover:scale-[1.02] touch-manipulation"
                  style={{ minHeight: '44px' }}
                  onClick={flipCard}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Mostrar Resposta
                </Button>
              ) : (
                <div>
                  <p className="text-center text-[10px] sm:text-xs text-muted-foreground mb-3 sm:mb-4 uppercase tracking-widest">Como foi sua resposta?</p>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
                    {[
                      { label: 'Errei', sub: '< 1min', tone: 'hover:bg-primary/20 hover:text-primary hover:border-primary/40', quality: 0 },
                      { label: 'Difícil', sub: '2 dias', tone: 'hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500/40', quality: 1 },
                      { label: 'Bom', sub: '4 dias', tone: 'hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/40', quality: 2 },
                      { label: 'Fácil', sub: '7 dias', tone: 'hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/40', quality: 3 },
                    ].map((option) => (
                      <button
                        key={option.label}
                        className={cn(
                          'flex flex-col items-center justify-center gap-0.5 sm:gap-1 p-2.5 sm:p-3 lg:p-4 rounded-xl border border-white/10 bg-white/5 transition-all duration-200 hover:scale-105 touch-manipulation active:scale-95',
                          option.tone
                        )}
                        style={{ minHeight: '44px' }}
                        onClick={() => rateCard(option.quality)}
                      >
                        <span className="font-bold text-xs sm:text-sm">{option.label}</span>
                        <span className="text-[9px] sm:text-[10px] opacity-60">{option.sub}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/5">
                    <Button
                      variant="ghost"
                      className="w-full text-xs sm:text-sm text-muted-foreground hover:text-white"
                      onClick={flipCard}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Voltar para a pergunta
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Tela de conclusão
  if (phase === 'complete') {
    return (
      <div className="mx-auto flex w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl flex-col gap-4 sm:gap-6 lg:gap-8 xl:gap-10 min-h-[calc(100vh-10rem)] sm:min-h-[calc(100vh-12rem)] justify-center px-3 xs:px-4">
        <div className="flex flex-col items-center justify-center text-center space-y-6 py-12">
          <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
            <BrainCircuit className="h-10 w-10 text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Sessão Concluída!</h2>
            <p className="text-muted-foreground">Você completou todas as revisões pendentes.</p>
          </div>
          <Button
            variant="default"
            onClick={() => setPhase('question')}
            className="bg-primary hover:bg-primary/90 text-white px-8"
          >
            Voltar para Decks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary mb-2">Memorização</p>
          <h1 className="text-3xl font-serif font-bold text-white">Repetição Espaçada (SRS)</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowStats(true)} className="rounded-lg border-white/10 hover:bg-white/5 text-white gap-2">
            <BarChart3 className="h-4 w-4" />
            Estatísticas
          </Button>
          <Button variant="default" onClick={() => setShowCreateDeck(true)} className="rounded-lg shadow-[0_0_20px_rgba(120,6,6,0.3)] bg-primary hover:bg-primary/90 text-white gap-2">
            <Plus className="h-4 w-4" />
            Criar Deck
          </Button>
        </div>
      </div>

      {/* Stats Modal */}
      <Modal isOpen={showStats} onClose={() => setShowStats(false)} title="Estatísticas de Estudo">
         <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
               <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Cards</p>
               <p className="text-2xl font-bold text-white">{stats.totalCards}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
               <p className="text-xs text-muted-foreground uppercase tracking-wider">A Revisar</p>
               <p className="text-2xl font-bold text-primary">{stats.dueCards}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
               <p className="text-xs text-muted-foreground uppercase tracking-wider">Precisão Média</p>
               <div className="flex items-center gap-2">
                 <p className="text-2xl font-bold text-green-500">{stats.averageAccuracy}%</p>
                 <span className="text-xs text-muted-foreground">últimos ciclos</span>
               </div>
               <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                 <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.averageAccuracy}%` }} />
               </div>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
               <p className="text-xs text-muted-foreground uppercase tracking-wider">Sequência</p>
               <p className="text-2xl font-bold text-orange-500">{stats.streak} {stats.streak === 1 ? 'Dia' : 'Dias'}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
               <p className="text-xs text-muted-foreground uppercase tracking-wider">Novas cartas</p>
               <p className="text-2xl font-bold text-white">{deckSummary.totalNew}</p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
               <p className="text-xs text-muted-foreground uppercase tracking-wider">Pendências nos decks</p>
               <p className="text-2xl font-bold text-white">{deckSummary.totalDue}</p>
            </div>
         </div>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
           <div className="rounded-lg bg-white/5 border border-white/10 p-4">
             <p className="text-sm font-semibold text-white mb-2">Decks com mais revisões</p>
             <div className="space-y-2">
               {deckSummary.topDecks.length === 0 && (
                 <p className="text-xs text-muted-foreground">Sem dados ainda.</p>
               )}
               {deckSummary.topDecks.map((deck: Deck) => (
                 <div key={deck.deck} className="flex items-center gap-3">
                   <div className="flex-1">
                     <p className="text-sm text-white">{deck.deck}</p>
                     <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                       <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (deck.due || 0) * 4)}%` }} />
                     </div>
                   </div>
                   <div className="text-xs text-muted-foreground text-right w-20">
                     {deck.due} revisar • {deck.new} novas
                   </div>
                 </div>
               ))}
             </div>
           </div>
           <div className="rounded-lg bg-white/5 border border-white/10 p-4 h-full">
             <p className="text-sm font-semibold text-white mb-2">Previsão rápida</p>
             <div className="text-sm text-muted-foreground space-y-1">
               <p>Manter precisão acima de 85% mantém o ritmo ideal.</p>
               <p>{deckSummary.totalDue} revisões hoje; conclua para proteger seu streak.</p>
               <p>Distribua as {deckSummary.totalNew} cartas novas ao longo da semana.</p>
             </div>
           </div>
         </div>
      </Modal>

      {/* Criar Deck */}
      <Modal isOpen={showCreateDeck} onClose={() => setShowCreateDeck(false)} title="Criar Novo Deck">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Nome do Deck</label>
            <Input
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              placeholder="Ex: Algoritmos Avançados"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Você será redirecionado para criar o primeiro flashcard deste deck.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowCreateDeck(false)}>Cancelar</Button>
            <Button variant="default" onClick={handleCreateDeck} disabled={!newDeckName.trim()}>
              Continuar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Criar Flashcard */}
      <Modal isOpen={showCreateFlashcard} onClose={() => { setShowCreateFlashcard(false); setFlashcardForm({ front: '', back: '', deck: '' }); }} title="Criar Flashcard">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Deck</label>
            {decks.length > 0 ? (
              <select
                value={flashcardForm.deck}
                onChange={(e) => setFlashcardForm({ ...flashcardForm, deck: e.target.value })}
                className="w-full h-10 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option value="">Selecione um deck...</option>
                {decks.map((d) => (
                  <option key={d.deck} value={d.deck}>{d.deck}</option>
                ))}
              </select>
            ) : (
              <Input
                value={flashcardForm.deck}
                onChange={(e) => setFlashcardForm({ ...flashcardForm, deck: e.target.value })}
                placeholder="Nome do deck..."
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Pergunta</label>
            <Input
              value={flashcardForm.front}
              onChange={(e) => setFlashcardForm({ ...flashcardForm, front: e.target.value })}
              placeholder="Digite a pergunta..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Resposta</label>
            <textarea
              value={flashcardForm.back}
              onChange={(e) => setFlashcardForm({ ...flashcardForm, back: e.target.value })}
              placeholder="Digite a resposta..."
              className="w-full min-h-[100px] rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => { setShowCreateFlashcard(false); setFlashcardForm({ front: '', back: '', deck: '' }); }}>Cancelar</Button>
            <Button variant="default" onClick={handleCreateFlashcard} disabled={!flashcardForm.front.trim() || !flashcardForm.back.trim() || !flashcardForm.deck.trim()}>
              Criar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Editar Flashcard */}
      <Modal isOpen={showEditFlashcard} onClose={() => { setShowEditFlashcard(false); setEditingFlashcard(null); setFlashcardForm({ front: '', back: '', deck: '' }); }} title="Editar Flashcard">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Deck</label>
            <Input
              value={flashcardForm.deck}
              onChange={(e) => setFlashcardForm({ ...flashcardForm, deck: e.target.value })}
              placeholder="Nome do deck..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Pergunta</label>
            <Input
              value={flashcardForm.front}
              onChange={(e) => setFlashcardForm({ ...flashcardForm, front: e.target.value })}
              placeholder="Digite a pergunta..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Resposta</label>
            <textarea
              value={flashcardForm.back}
              onChange={(e) => setFlashcardForm({ ...flashcardForm, back: e.target.value })}
              placeholder="Digite a resposta..."
              className="w-full min-h-[100px] rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => { setShowEditFlashcard(false); setEditingFlashcard(null); setFlashcardForm({ front: '', back: '', deck: '' }); }}>Cancelar</Button>
            {editingFlashcard && (
              <Button variant="outline" onClick={() => handleDeleteFlashcard(editingFlashcard.id)} className="text-red-400 border-red-400/30 hover:bg-red-400/10">
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </Button>
            )}
            <Button variant="default" onClick={handleEditFlashcard} disabled={!flashcardForm.front.trim() || !flashcardForm.back.trim() || !flashcardForm.deck.trim()}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lista de Decks */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {decks.map((deck) => (
          <Card
            key={deck.deck}
            className="group relative overflow-hidden border border-white/5 bg-card hover:border-primary/30 hover:shadow-[0_0_30px_rgba(120,6,6,0.1)] transition-all duration-300"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <BrainCircuit className="h-24 w-24 -mr-8 -mt-8" />
            </div>

            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground bg-white/5 px-2 py-1 rounded-md border border-white/5">
                  <History className="h-3 w-3" />
                  {formatDate(deck.lastReview)}
                </span>
              </div>
              <CardTitle className="text-xl font-bold text-white group-hover:text-primary transition-colors">{deck.deck}</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1 p-3 rounded-lg bg-white/[0.02] border border-white/5 group-hover:bg-green-500/[0.05] group-hover:border-green-500/20 transition-colors">
                  <p className="text-2xl font-bold text-green-500">{deck.due}</p>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Revisar</p>
                </div>
                <div className="flex-1 p-3 rounded-lg bg-white/[0.02] border border-white/5 group-hover:bg-blue-500/[0.05] group-hover:border-blue-500/20 transition-colors">
                  <p className="text-2xl font-bold text-blue-400">{deck.new}</p>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Novas</p>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <Button
                  variant="outline"
                  className="flex-1 border-white/10 hover:border-primary/50 hover:bg-primary/5 hover:text-white group-hover:shadow-[0_0_15px_rgba(120,6,6,0.15)] transition-all"
                  onClick={startStudy}
                >
                  Iniciar Sessão
                </Button>
                <Button
                  variant="outline"
                  className="border-white/10 hover:border-primary/50 hover:bg-primary/5 hover:text-white transition-all"
                  onClick={() => openCreateFlashcard(deck.deck)}
                  title="Adicionar flashcard"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Flashcard list for this deck */}
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                {flashcards
                  .filter((f) => f.deck === deck.deck)
                  .slice(0, 5)
                  .map((flashcard) => (
                    <div
                      key={flashcard.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-colors group/item"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{flashcard.front}</p>
                        <p className="text-xs text-muted-foreground truncate">{flashcard.back}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditFlashcard(flashcard)}
                          className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFlashcard(flashcard.id)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                          title="Deletar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                {flashcards.filter((f) => f.deck === deck.deck).length > 5 && (
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    +{flashcards.filter((f) => f.deck === deck.deck).length - 5} mais
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Deck Card */}
        <button onClick={() => setShowCreateDeck(true)} className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border border-dashed border-white/10 bg-white/[0.01] hover:bg-white/[0.03] hover:border-primary/30 hover:text-primary transition-all group text-muted-foreground h-full min-h-[280px]">
           <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 group-hover:bg-primary/10">
              <Plus className="h-8 w-8" />
           </div>
           <div className="text-center">
              <p className="font-medium text-white group-hover:text-primary transition-colors">Criar Novo Deck</p>
              <p className="text-xs mt-1 opacity-60">Adicione um novo conjunto de flashcards</p>
           </div>
        </button>
      </div>

      {decks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
          <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6 text-muted-foreground">
             <BrainCircuit className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Sua biblioteca está vazia</h3>
          <p className="text-muted-foreground mb-8 max-w-md text-center">
             Crie seu primeiro deck para começar a usar o sistema de repetição espaçada e otimizar seu aprendizado.
          </p>
          <Button variant="default" onClick={() => setShowCreateDeck(true)} className="bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-lg">
            Criar Primeiro Deck
          </Button>
        </div>
      )}
    </div>
  );
}