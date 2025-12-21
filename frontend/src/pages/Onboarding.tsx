import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowRight, ArrowLeft, BookOpen, Code, Target, Star, Sparkles } from 'lucide-react';
import { Cycle4DAnimation } from '../components/onboarding/Cycle4DAnimation';
import { VideoPlayer } from '../components/onboarding/VideoPlayer';
import api from '../lib/api';

function DashboardPreview() {
  // During onboarding, user hasn't completed setup yet, so show default preview
  // This component doesn't need to access CourseContext during onboarding
  const courseTitle = localStorage.getItem('customCourseTitle') || 'Seu Curso';
  
  // Default values for preview (user hasn't set up course yet)
  const stats = { progress: 0, hoursStudied: 0, booksRead: 0, flashcardsDue: 0 };
  const resourcesCount = 0;
  const projectsCount = 0;

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">{courseTitle}</h3>
        <p className="text-sm text-muted-foreground">Visão geral do semestre</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-xl font-semibold text-foreground mb-1">{stats.progress}%</div>
          <div className="text-xs text-muted-foreground">Progresso</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-xl font-semibold text-foreground mb-1">{stats.hoursStudied.toFixed(1)}h</div>
          <div className="text-xs text-muted-foreground">Estudado</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-xl font-semibold text-foreground mb-1">{resourcesCount}</div>
          <div className="text-xs text-muted-foreground">Recursos</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm font-medium text-foreground">Biblioteca</div>
            <div className="text-xs text-muted-foreground">
              {resourcesCount > 0 ? `${resourcesCount} recursos` : 'Adicionar recursos'}
            </div>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
          <Code className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm font-medium text-foreground">Projetos</div>
            <div className="text-xs text-muted-foreground">
              {projectsCount > 0 ? `${projectsCount} projetos` : 'Criar projeto'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Próximos Passos</h4>
        </div>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Explore sua grade curricular
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Adicione recursos à biblioteca
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Crie seu primeiro projeto
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const onboardingSteps = [
    {
      title: 'O que é Autodidatismo Estruturado',
      content: (
        <div className="space-y-6">
          <VideoPlayer duration={30} />
          <p className="text-base text-muted-foreground leading-relaxed text-center">
            O Autodidatismo Estruturado (AE) é uma metodologia que combina a flexibilidade do aprendizado autônomo com a organização e disciplina necessárias para o domínio profundo de qualquer área de conhecimento.
          </p>
        </div>
      ),
    },
    {
      title: 'Como funciona o Ciclo 4D',
      content: <Cycle4DAnimation />,
    },
    {
      title: 'Sua jornada começa aqui',
      content: (
        <div className="space-y-6">
          <p className="text-base text-muted-foreground text-center">
            Veja uma prévia do seu Dashboard, seu centro de controle para toda a jornada de aprendizado.
          </p>
          <DashboardPreview />
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    localStorage.setItem('onboardingCompleted', 'true');
    localStorage.setItem('onboardingSkipped', 'true');
    
    // Mark onboarding as completed in backend
    try {
      const response = await api.post('/user/onboarding-complete');
      console.log('Onboarding completed:', response.data);
      
      // Dispatch achievement unlock event after a short delay to ensure backend is updated
      setTimeout(() => {
        const achievement = {
          id: 'first_step',
          type: 'first_step',
          title: 'Primeiro Passo',
          description: 'Complete o onboarding',
          icon: Star,
          unlockedAt: new Date().toISOString(),
        };
        window.dispatchEvent(new CustomEvent('achievement:unlock', { detail: achievement }));
      }, 300);
    } catch (error) {
      console.error('Failed to mark onboarding as completed:', error);
      // Continue anyway, but still dispatch event for UI feedback
      const achievement = {
        id: 'first_step',
        type: 'first_step',
        title: 'Primeiro Passo',
        description: 'Complete o onboarding',
        icon: Star,
        unlockedAt: new Date().toISOString(),
      };
      window.dispatchEvent(new CustomEvent('achievement:unlock', { detail: achievement }));
    }
    
    navigate('/initial-setup');
  };

  const handleComplete = async () => {
    localStorage.setItem('onboardingCompleted', 'true');
    
    // Mark onboarding as completed in backend
    try {
      const response = await api.post('/user/onboarding-complete');
      console.log('Onboarding completed:', response.data);
      
      // Dispatch achievement unlock event after a short delay to ensure backend is updated
      setTimeout(() => {
        const achievement = {
          id: 'first_step',
          type: 'first_step',
          title: 'Primeiro Passo',
          description: 'Complete o onboarding',
          icon: Star,
          unlockedAt: new Date().toISOString(),
        };
        window.dispatchEvent(new CustomEvent('achievement:unlock', { detail: achievement }));
      }, 300);
    } catch (error) {
      console.error('Failed to mark onboarding as completed:', error);
      // Continue anyway, but still dispatch event for UI feedback
      const achievement = {
        id: 'first_step',
        type: 'first_step',
        title: 'Primeiro Passo',
        description: 'Complete o onboarding',
        icon: Star,
        unlockedAt: new Date().toISOString(),
      };
      window.dispatchEvent(new CustomEvent('achievement:unlock', { detail: achievement }));
    }
    
    navigate('/initial-setup');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl relative z-10"
      >
        <Card className="border-border/30 bg-card/80 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex gap-2 flex-1">
                {onboardingSteps.map((_, index) => (
                  <motion.div
                    key={index}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: index <= currentStep ? 1 : 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden"
                  >
                    <motion.div
                      className={`h-full rounded-full ${
                        index <= currentStep ? 'bg-primary' : 'bg-muted'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: index <= currentStep ? '100%' : '0%' }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </motion.div>
                ))}
              </div>
              <motion.button
                onClick={handleSkip}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="ml-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Pular
              </motion.button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <CardTitle className="text-2xl md:text-3xl flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  {onboardingSteps[currentStep].title}
                </CardTitle>
              </motion.div>
            </AnimatePresence>
          </CardHeader>
          <CardContent>
            <div className="min-h-[400px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="w-full"
                >
                  {onboardingSteps[currentStep].content}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-8 flex justify-between">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button variant="default" onClick={handleNext} className="gap-2">
                  {currentStep === onboardingSteps.length - 1 ? (
                    <>
                      <Star className="h-4 w-4" />
                      Começar
                    </>
                  ) : (
                    <>
                      Próximo
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}


