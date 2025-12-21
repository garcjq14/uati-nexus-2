import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import {
  Timer,
  FileText,
  Network,
  BookOpen,
  Target,
} from 'lucide-react';
import { cn } from '../lib/utils';

const tools = [
  {
    id: 'pomodoro',
    name: 'Timer Pomodoro',
    description: 'Foco profundo com técnica de gerenciamento de tempo',
    icon: Timer,
    href: '/tools-focus',
  },
  {
    id: 'zettelkasten',
    name: 'Fichamento Digital',
    description: 'Sistema Zettelkasten para organização de conhecimento',
    icon: FileText,
    href: '/notes',
  },
  {
    id: 'connections',
    name: 'Mapa de Conexões',
    description: 'Visualização gráfica das conexões entre fichas',
    icon: Network,
    href: '/notes/connections',
  },
  {
    id: 'paradigms',
    name: 'Mapa de Competências',
    description: 'Visualize e gerencie suas competências em qualquer área de conhecimento',
    icon: Target,
    href: '/paradigms',
  },
  {
    id: 'flashcards',
    name: 'Revisão Espaçada',
    description: 'Sistema de repetição espaçada para memorização',
    icon: BookOpen,
    href: '/spaced-repetition',
  },
  {
    id: 'knowledge-graph',
    name: 'Grafo de Conhecimento',
    description: 'Visualização do conhecimento em formato de grafo',
    icon: Network,
    href: '/knowledge-graph',
  },
];

export default function ToolsHub() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary mb-2">Ferramentas</p>
        <h1 className="text-3xl font-serif font-light text-white tracking-tight">Hub de Ferramentas</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.id} to={tool.href}>
              <Card className="h-full border border-white/5 bg-card hover:border-primary/30 hover:bg-white/[0.02] transition-all group cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-light text-white mb-1 group-hover:text-primary transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
