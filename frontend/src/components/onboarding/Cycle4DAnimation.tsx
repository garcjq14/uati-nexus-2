import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Search, BookOpen, Code, FileText } from 'lucide-react';

const cycleSteps = [
  {
    id: 'discover',
    title: 'Descobrir',
    icon: Search,
    description: 'Identifique o que precisa aprender através de recursos e materiais de estudo.',
    iconColor: 'text-blue-400',
  },
  {
    id: 'master',
    title: 'Dominar',
    icon: BookOpen,
    description: 'Estude profundamente usando fichamentos, revisão espaçada e prática ativa.',
    iconColor: 'text-purple-400',
  },
  {
    id: 'develop',
    title: 'Desenvolver',
    icon: Code,
    description: 'Aplique o conhecimento em projetos práticos (PoW) que demonstram domínio.',
    iconColor: 'text-primary',
  },
  {
    id: 'document',
    title: 'Documentar',
    icon: FileText,
    description: 'Registre seu aprendizado, crie conexões e construa seu portfólio de conhecimento.',
    iconColor: 'text-green-400',
  },
];

export function Cycle4DAnimation() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {cycleSteps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15, duration: 0.4 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Card className="border-border/30 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="p-2 rounded-lg bg-muted/50"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <step.icon className={`h-5 w-5 ${step.iconColor}`} />
                  </motion.div>
                  <CardTitle className="text-lg">
                    {index + 1}. {step.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Cycle visualization */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center justify-center mt-8"
      >
        <div className="relative w-64 h-64">
          {cycleSteps.map((step, index) => {
            const angle = (index * 90 - 90) * (Math.PI / 180);
            const radius = 80;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            return (
              <motion.div
                key={step.id}
                className="absolute"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1, type: "spring", stiffness: 200 }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                  <step.icon className={`h-6 w-6 ${step.iconColor}`} />
                </div>
              </motion.div>
            );
          })}
          <motion.div
            className="absolute inset-0 border-2 border-dashed border-primary/20 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </motion.div>
    </div>
  );
}
