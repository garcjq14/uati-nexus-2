import { motion } from 'framer-motion';
import { Clock, Target, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';

interface StudySessionSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  duration: number; // in seconds
  onContinue?: () => void;
}

export function StudySessionSummary({
  isOpen,
  onClose,
  duration,
  onContinue,
}: StudySessionSummaryProps) {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;

  const formatDuration = () => {
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background rounded-xl p-6 max-w-md w-full"
      >
        <CardHeader className="text-center pb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-4"
          >
            <div className="h-16 w-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
          </motion.div>
          <CardTitle className="text-2xl font-serif">Sessão Concluída!</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-white/5">
              <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{formatDuration()}</p>
              <p className="text-xs text-muted-foreground mt-1">Tempo estudado</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/5">
              <TrendingUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">+{Math.floor(duration / 60)}</p>
              <p className="text-xs text-muted-foreground mt-1">Minutos acumulados</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-white">Sugestões</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Revise seus flashcards pendentes</li>
              <li>• Faça uma pausa de 5 minutos</li>
              <li>• Continue com o próximo módulo</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Fechar
            </Button>
            {onContinue && (
              <Button
                variant="default"
                onClick={() => {
                  onContinue();
                  onClose();
                }}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Continuar Estudando
              </Button>
            )}
          </div>
        </CardContent>
      </motion.div>
    </Modal>
  );
}





