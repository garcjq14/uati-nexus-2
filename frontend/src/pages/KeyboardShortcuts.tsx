import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Keyboard } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navegação
  {
    keys: ['Ctrl', 'K'],
    description: 'Abrir busca global / Command Palette',
    category: 'Navegação',
  },
  {
    keys: ['Ctrl', 'N'],
    description: 'Nova nota',
    category: 'Navegação',
  },
  {
    keys: ['G', 'D'],
    description: 'Ir para Dashboard',
    category: 'Navegação',
  },
  {
    keys: ['G', 'C'],
    description: 'Ir para Currículo',
    category: 'Navegação',
  },
  {
    keys: ['G', 'P'],
    description: 'Ir para Projetos',
    category: 'Navegação',
  },
  {
    keys: ['G', 'N'],
    description: 'Ir para Notas',
    category: 'Navegação',
  },
  {
    keys: ['G', 'S'],
    description: 'Ir para Estatísticas',
    category: 'Navegação',
  },
  {
    keys: ['G', 'F'],
    description: 'Ir para Modo Foco',
    category: 'Navegação',
  },
  {
    keys: ['G', 'M'],
    description: 'Ir para Documentos Mestres',
    category: 'Navegação',
  },
  {
    keys: ['G', 'H'],
    description: 'Ir para Atalhos de Teclado',
    category: 'Navegação',
  },
  // Ações Gerais
  {
    keys: ['Esc'],
    description: 'Fechar modais / Cancelar ações',
    category: 'Ações Gerais',
  },
  {
    keys: ['?'],
    description: 'Mostrar esta página de atalhos',
    category: 'Ações Gerais',
  },
  // Interface
  {
    keys: ['Ctrl', '\\'],
    description: 'Alternar sidebar',
    category: 'Interface',
  },
];

const categoryOrder = ['Navegação', 'Ações Gerais', 'Interface'];

function KeyBadge({ keyName }: { keyName: string }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <kbd
      className={`
        px-2 py-1 text-xs font-semibold rounded
        ${isDark 
          ? 'bg-secondary border border-border text-foreground shadow-sm' 
          : 'bg-muted border border-border-light text-foreground-light shadow-sm'
        }
      `}
    >
      {keyName}
    </kbd>
  );
}

export default function KeyboardShortcuts() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const shortcutsByCategory = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-8 px-4">
      {/* Header */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary mb-2">Atalhos</p>
        <div className="flex items-center gap-3">
          <Keyboard className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-serif font-light text-foreground tracking-tight">
            Atalhos de Teclado
          </h1>
        </div>
        <p className="mt-4 text-sm text-muted-foreground max-w-2xl">
          Use estes atalhos para navegar e interagir com o sistema de forma mais rápida e eficiente.
          No Mac, use <kbd className="px-1.5 py-0.5 text-xs rounded bg-secondary border border-border">Cmd</kbd> em vez de <kbd className="px-1.5 py-0.5 text-xs rounded bg-secondary border border-border">Ctrl</kbd>.
        </p>
      </div>

      {/* Shortcuts by Category */}
      <div className="space-y-6">
        {categoryOrder.map((category) => {
          const categoryShortcuts = shortcutsByCategory[category] || [];
          if (categoryShortcuts.length === 0) return null;

          return (
            <Card
              key={category}
              className="border-white/5 bg-white/[0.02] backdrop-blur-sm"
            >
              <CardHeader>
                <CardTitle className="text-lg font-serif font-light text-foreground">
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors rounded px-2"
                    >
                      <span className="text-sm text-foreground flex-1">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1.5 ml-4">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center gap-1.5">
                            <KeyBadge keyName={key} />
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-muted-foreground text-xs">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tips */}
      <Card className="border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-serif font-light text-foreground">
            Dicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Muitos atalhos funcionam apenas quando você está em páginas específicas (ex: Modo Foco)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Pressione <KeyBadge keyName="?" /> em qualquer lugar para abrir esta página</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Atalhos de navegação (G + letra) funcionam a partir de qualquer página</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Use <KeyBadge keyName="Esc" /> para fechar modais, menus e cancelar ações</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

