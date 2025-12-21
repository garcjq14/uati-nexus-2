import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, BookOpen, Video, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface HelpItem {
  id: string;
  title: string;
  content: string;
  type?: 'text' | 'video' | 'link';
  link?: string;
}

interface ContextualHelpProps {
  section: string;
  helpItems?: HelpItem[];
  className?: string;
}

const defaultHelpItems: Record<string, HelpItem[]> = {
  dashboard: [
    {
      id: '1',
      title: 'Como usar o Dashboard',
      content: 'O Dashboard é seu centro de controle. Aqui você vê seu progresso geral, projetos ativos, flashcards pendentes e próximos módulos. Use os widgets para personalizar sua experiência.',
      type: 'text',
    },
    {
      id: '2',
      title: 'Personalizar Dashboard',
      content: 'Clique em "Personalizar Dashboard" para reorganizar os widgets. Arraste para mover e remova os que não deseja ver.',
      type: 'text',
    },
  ],
  projects: [
    {
      id: '1',
      title: 'Gerenciar Projetos',
      content: 'Use a visualização Kanban para mover tarefas entre colunas. Arraste e solte para atualizar o status automaticamente.',
      type: 'text',
    },
    {
      id: '2',
      title: 'Timeline de Projetos',
      content: 'A visualização Timeline mostra todos os projetos ordenados por prazo, ajudando você a priorizar o que precisa ser feito primeiro.',
      type: 'text',
    },
  ],
  knowledge: [
    {
      id: '1',
      title: 'Criar Conexões',
      content: 'Arraste de um nó para outro para criar uma conexão. Isso ajuda a mapear como diferentes conceitos se relacionam.',
      type: 'text',
    },
    {
      id: '2',
      title: 'Modo Apresentação',
      content: 'Use o modo apresentação para visualizar seu conhecimento em tela cheia, perfeito para revisar ou compartilhar.',
      type: 'text',
    },
  ],
};

export function ContextualHelp({ section, helpItems, className }: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const items = helpItems || defaultHelpItems[section] || [];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'p-2 rounded-lg hover:bg-white/5 transition-colors',
          'text-muted-foreground hover:text-primary',
          className
        )}
        aria-label="Ajuda contextual"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl"
            >
              <Card className="border-white/10 bg-background/95 backdrop-blur-md shadow-2xl">
                <CardHeader className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <HelpCircle className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Ajuda Contextual</CardTitle>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-lg border border-white/5 bg-white/[0.02]"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        {item.type === 'video' && <Video className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
                        {item.type === 'link' && <BookOpen className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
                        {!item.type && <MessageCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.content}</p>
                          {item.link && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => window.open(item.link, '_blank')}
                            >
                              Ver mais
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}





