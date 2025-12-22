import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  FileText, 
  Plus, 
  Search, 
  Network, 
  Grid3x3, 
  List, 
  Filter,
  X,
  SortAsc,
  SortDesc,
  Calendar
} from 'lucide-react';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { EmptyState } from '../components/empty-states/EmptyState';
import { LoadingSkeleton } from '../components/feedback/LoadingStates';
import { useDebounce } from '../hooks/useDebounce';

type ViewMode = 'grid' | 'list';
type SortOption = 'recent' | 'oldest' | 'title-asc' | 'title-desc';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  connections: string[];
  createdAt?: string;
  updatedAt?: string;
}

export default function NotesList() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchNotes();
  }, [debouncedSearch]);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await api.get('/notes', { params });
      // Normalize notes - remove tags and connections
      const normalizedNotes = response.data.map((note: any) => ({
        ...note,
        title: note.title || '',
        content: note.content || '',
        tags: [],
        connections: []
      }));
      setNotes(normalizedNotes);
      setAllTags([]);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedTag]);

  const sortedAndFilteredNotes = useMemo(() => {
    let filtered = [...notes];

    // Sort notes
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.updatedAt || b.createdAt || 0).getTime() - 
                 new Date(a.updatedAt || a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || a.updatedAt || 0).getTime() - 
                 new Date(b.createdAt || b.updatedAt || 0).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title, 'pt-BR');
        case 'title-desc':
          return b.title.localeCompare(a.title, 'pt-BR');
        default:
          return 0;
      }
    });

    return filtered;
  }, [notes, sortBy]);

  const stats = useMemo(() => {
    return {
      total: notes.length
    };
  }, [notes]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setSortBy('recent');
  }, []);

  if (loading && notes.length === 0) {
    return <LoadingSkeleton variant="grid" count={6} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-serif">Fichamento Digital</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Sistema Zettelkasten para organização de conhecimento através de fichas conectadas
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && "bg-primary/10 border-primary")}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" asChild size="sm">
            <Link to="/notes/connections">
              <Network className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Mapa</span>
            </Link>
          </Button>
          <Button variant="default" asChild size="sm">
            <Link to="/notes/new">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nova Ficha</span>
              <span className="sm:hidden">Nova</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      {notes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-2 sm:gap-4">
          <Card className="p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-muted-foreground">Total de Fichas</div>
            <div className="text-lg sm:text-2xl font-bold mt-1">{stats.total}</div>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar fichas por título ou conteúdo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="p-4">
            <div className="space-y-4">
              {/* Sort Options */}
              <div>
                <label className="text-sm font-medium mb-2 block">Ordenar por</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'recent' as SortOption, label: 'Mais recentes', icon: SortDesc },
                    { value: 'oldest' as SortOption, label: 'Mais antigas', icon: SortAsc },
                    { value: 'title-asc' as SortOption, label: 'Título A-Z', icon: SortAsc },
                    { value: 'title-desc' as SortOption, label: 'Título Z-A', icon: SortDesc },
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <Button
                        key={option.value}
                        variant={sortBy === option.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortBy(option.value)}
                      >
                        <Icon className="mr-2 h-3 w-3" />
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* View Mode */}
              <div>
                <label className="text-sm font-medium mb-2 block">Visualização</label>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3x3 className="mr-2 h-4 w-4" />
                    Grade
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="mr-2 h-4 w-4" />
                    Lista
                  </Button>
                </div>
              </div>

              {/* Clear Filters */}
              {(search || sortBy !== 'recent') && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </Card>
        )}

      </div>

      {/* Notes Display */}
      {sortedAndFilteredNotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={notes.length === 0 ? "Nenhuma ficha criada ainda" : "Nenhuma ficha encontrada"}
          description={
            notes.length === 0
              ? "Comece criando sua primeira ficha no sistema Zettelkasten. Conecte ideias, crie links entre conceitos e construa seu mapa de conhecimento."
              : "Tente ajustar os filtros ou termos de busca para encontrar fichas."
          }
          actionLabel={notes.length === 0 ? "Criar Primeira Ficha" : "Limpar Filtros"}
          onAction={notes.length === 0 ? () => navigate('/notes/new') : clearFilters}
        />
      ) : (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
              : 'space-y-3'
          )}
        >
          {sortedAndFilteredNotes.map((note) => (
            <Link key={note.id} to={`/notes/${note.id}`}>
              <Card
                className={cn(
                  'h-full cursor-pointer transition-all hover:border-primary hover:shadow-lg',
                  viewMode === 'list' && 'flex flex-row'
                )}
              >
                {viewMode === 'grid' ? (
                  <>
                    <CardHeader>
                      <CardTitle className="line-clamp-2 text-lg">{note.title || 'Sem título'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3rem]">
                        {note.content || 'Sem conteúdo'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                        {note.updatedAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(note.updatedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short'
                            })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <>
                    <CardHeader className="flex-1">
                      <CardTitle className="line-clamp-1">{note.title || 'Sem título'}</CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                        {note.content || 'Sem conteúdo'}
                      </p>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-between items-end gap-2 min-w-[200px] border-l border-border pl-4">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {note.updatedAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(note.updatedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short'
                            })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Results Count */}
      {sortedAndFilteredNotes.length > 0 && search && (
        <div className="text-center text-sm text-muted-foreground">
          Mostrando {sortedAndFilteredNotes.length} de {notes.length} fichas
        </div>
      )}
    </div>
  );
}