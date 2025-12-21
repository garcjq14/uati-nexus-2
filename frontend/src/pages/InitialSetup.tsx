import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourse } from '../contexts/CourseContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import { GraduationCap, Calendar, Loader2, AlertCircle, Plus, Sparkles } from 'lucide-react';
import api from '../lib/api';
import { SetupComplete } from '../components/onboarding/SetupComplete';
import { motion, AnimatePresence } from 'framer-motion';

export default function InitialSetup() {
  const { refreshCourseData } = useCourse();
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [completionGoal, setCompletionGoal] = useState(100);
  const [goalDate, setGoalDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!customTitle || !customTitle.trim()) {
      setError('Por favor, informe o nome do curso personalizado.');
      return;
    }

    if (completionGoal < 0 || completionGoal > 100) {
      setError('A meta de conclusão deve estar entre 0 e 100%.');
      return;
    }

    if (goalDate && new Date(goalDate) < new Date()) {
      setError('A data meta não pode ser no passado.');
      return;
    }

    setLoading(true);
    try {
      // Store course title in localStorage (will be used throughout the app)
      localStorage.setItem('customCourseTitle', customTitle.trim());
      if (customDescription.trim()) {
        localStorage.setItem('customCourseDescription', customDescription.trim());
      }

      // Store user preferences
      try {
        await api.post('/user/preferences', {
          completionGoal: completionGoal.toString(),
          goalDate,
          courseTitle: customTitle.trim(),
          courseDescription: customDescription.trim() || null,
        });
      } catch (prefError) {
        console.warn('Failed to save preferences:', prefError);
        // Continue even if preferences fail
      }

      // Refresh course data to ensure everything is synced
      await refreshCourseData();

      // Mark setup as completed FIRST
      localStorage.setItem('initialSetupCompleted', 'true');
      setSuccess(true);

      // Show success animation before navigating
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    } catch (error) {
      console.error('Failed to complete setup:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setError(errorMessage || 'Erro ao configurar o curso. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-serif">Configuração Inicial</CardTitle>
          <CardDescription>
            Configure seu curso e defina suas metas de aprendizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 mb-6">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Criar Curso Personalizado</h4>
                <p className="text-xs text-muted-foreground">
                  Crie seu próprio curso do zero. Você poderá adicionar módulos, projetos e recursos depois.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Plus className="h-4 w-4" />
                Nome do Curso *
              </label>
              <Input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Ex: Desenvolvimento Full Stack, Design Gráfico..."
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Escolha um nome descritivo para seu curso
              </p>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                <GraduationCap className="h-4 w-4" />
                Descrição (Opcional)
              </label>
              <Input
                type="text"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Breve descrição do curso..."
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Adicione uma descrição opcional sobre o que você vai estudar
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Completion Goal */}
            <div>
              <Slider
                label="Meta de Conclusão"
                value={completionGoal}
                onValueChange={setCompletionGoal}
                min={0}
                max={100}
                step={1}
                showValue={true}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Defina a porcentagem de conclusão que deseja alcançar
              </p>
            </div>

            {/* Goal Date */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Data Meta (Opcional)
              </label>
              <Input
                type="date"
                value={goalDate}
                onChange={(e) => setGoalDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mb-2"
              />
              {goalDate && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  {...({ className: 'mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20' } as { className?: string })}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-white">
                      Meta definida para:{' '}
                      <span className="font-semibold text-primary">
                        {new Date(goalDate).toLocaleDateString('pt-BR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {(() => {
                      const daysDiff = Math.ceil(
                        (new Date(goalDate).getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      );
                      if (daysDiff > 0) {
                        return `Faltam ${daysDiff} dias para alcançar sua meta`;
                      }
                      return 'Data no passado';
                    })()}
                  </div>
                </motion.div>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Defina uma data para alcançar sua meta
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SetupComplete onContinue={() => navigate('/', { replace: true })} />
                </motion.div>
              )}
            </AnimatePresence>

            {!success && (
              <Button
                type="submit"
                variant="default"
                className="w-full"
                disabled={!customTitle.trim() || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  'Começar Jornada'
                )}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

