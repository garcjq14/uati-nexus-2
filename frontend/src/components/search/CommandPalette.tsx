import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, BookOpen, Code, GraduationCap, ArrowRight, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCourse } from '../../contexts/CourseContext';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';
import api from '../../lib/api';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: any;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { courseData } = useCourse();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navigationCommands: CommandItem[] = [
    { id: 'dashboard', title: 'Dashboard', icon: GraduationCap, action: () => navigate('/'), category: 'Navegação' },
    { id: 'curriculum', title: 'Plano de Curso', icon: GraduationCap, action: () => navigate('/curriculum'), category: 'Navegação' },
    { id: 'library', title: 'Biblioteca', icon: BookOpen, action: () => navigate('/library'), category: 'Navegação' },
    { id: 'projects', title: 'Projetos', icon: Code, action: () => navigate('/projects'), category: 'Navegação' },
    { id: 'notes', title: 'Notas', icon: FileText, action: () => navigate('/notes'), category: 'Navegação' },
  ];

  const actionCommands: CommandItem[] = [
    { id: 'new-note', title: 'Nova Nota', icon: FileText, action: () => navigate('/notes/new'), category: 'Ações' },
    { id: 'new-project', title: 'Novo Projeto', icon: Code, action: () => navigate('/projects'), category: 'Ações' },
    { id: 'add-resource', title: 'Adicionar Recurso', icon: BookOpen, action: () => navigate('/library'), category: 'Ações' },
  ];

  const allCommands = [...navigationCommands, ...actionCommands, ...searchResults];
  
  const filteredCommands = useMemo(() => {
    if (!query) return allCommands;
    const lowerQuery = query.toLowerCase();
    return allCommands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(lowerQuery) ||
        cmd.description?.toLowerCase().includes(lowerQuery) ||
        cmd.category.toLowerCase().includes(lowerQuery)
    );
  }, [query, allCommands]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in input fields (except when palette is open)
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable ||
                          target.closest('input, textarea, [contenteditable="true"]');
      
      // Allow Ctrl/Cmd+K to open palette even in input fields
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
      
      // Don't trigger '/' shortcut when typing in input fields
      if (e.key === '/' && isInputField && !isOpen) {
        return;
      }
      
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
        }
        if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
          e.preventDefault();
          filteredCommands[selectedIndex].action();
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('custom:openCommandPalette', handleOpen);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('custom:openCommandPalette', handleOpen);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, filteredCommands, selectedIndex]);

  useEffect(() => {
    if (query && isOpen) {
      // Simple search - in a real app, this would call an API
      const search = async () => {
        try {
          // Search notes
          const notesRes = await api.get('/notes', { params: { search: query } });
          const notes = notesRes.data.map((note: any) => ({
            id: `note-${note.id}`,
            title: note.title,
            description: note.content?.substring(0, 100),
            icon: FileText,
            action: () => navigate(`/notes/${note.id}`),
            category: 'Notas',
          }));

          // Search projects
          const projects = courseData.projects.filter((p: any) =>
            p.title.toLowerCase().includes(query.toLowerCase())
          ).map((project: any) => ({
            id: `project-${project.id}`,
            title: project.title,
            description: project.description,
            icon: Code,
            action: () => navigate(`/projects/${project.id}`),
            category: 'Projetos',
          }));

          // Search resources
          const resources = courseData.resources.filter((r: any) =>
            r.title.toLowerCase().includes(query.toLowerCase())
          ).map((resource: any) => ({
            id: `resource-${resource.id}`,
            title: resource.title,
            description: resource.author,
            icon: BookOpen,
            action: () => navigate(`/resources/${resource.id}`),
            category: 'Recursos',
          }));

          setSearchResults([...notes, ...projects, ...resources]);
        } catch (error) {
          console.error('Search error:', error);
        }
      };

      const timeout = setTimeout(search, 300);
      return () => clearTimeout(timeout);
    } else {
      setSearchResults([]);
    }
  }, [query, isOpen, courseData, navigate]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl"
      >
        <Card className="border-white/10 bg-background/95 backdrop-blur-md shadow-2xl">
          <CardContent className="p-0">
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-white/5">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Buscar ou navegar..."
                className="flex-1 bg-transparent text-white placeholder:text-muted-foreground focus:outline-none text-lg"
                autoFocus
              />
              <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-white/10 bg-black/40 px-2 font-mono text-xs text-muted-foreground">
                <Command className="h-3 w-3" />K
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto p-2">
              {filteredCommands.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {query ? 'Nenhum resultado encontrado' : 'Digite para buscar...'}
                  </p>
                </div>
              ) : (
                Object.entries(groupedCommands).map(([category, commands]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <h3 className="px-3 py-2 text-xs font-mono uppercase tracking-wider text-muted-foreground/70">
                      {category}
                    </h3>
                    {commands.map((command, index) => {
                      const globalIndex = filteredCommands.indexOf(command);
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <button
                          key={command.id}
                          onClick={() => {
                            command.action();
                            setIsOpen(false);
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                            isSelected
                              ? 'bg-primary/20 text-white'
                              : 'hover:bg-white/5 text-muted-foreground hover:text-white'
                          )}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                        >
                          <command.icon className="h-5 w-5 flex-shrink-0" />
                          <div className="flex-1 text-left min-w-0">
                            <div className="font-medium">{command.title}</div>
                            {command.description && (
                              <div className="text-xs text-muted-foreground truncate">
                                {command.description}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <ArrowRight className="h-4 w-4 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}

export default CommandPalette;
