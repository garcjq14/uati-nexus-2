import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useCourse } from '../contexts/CourseContext';
import api from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  LogOut, Mail, Clock, BookOpen, Code, TrendingUp, Trophy, Upload,
  Brain, Activity, ArrowRight
} from 'lucide-react';
import { useState, useRef, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const LEVEL_NAMES = [
  'Iniciante',
  'Explorador',
  'Aprendiz',
  'Estudante',
  'Conhecedor',
  'Mestre',
  'Sábio',
  'Lenda',
];

function calculateLevel(progress: number, hoursStudied: number): { level: number; name: string } {
  const progressScore = progress / 10;
  const hoursScore = Math.min(hoursStudied / 20, 10);
  const totalScore = progressScore + hoursScore;
  const level = Math.min(Math.floor(totalScore / 2.5), 7);
  return { level, name: LEVEL_NAMES[level] || 'Iniciante' };
}

// Converter nível (1-12) para porcentagem para exibição
function levelToPercentage(level: number): number {
  return Math.round((level / 12) * 100);
}

interface Competence {
  id: string;
  name: string;
  category: string;
  currentLevel: number;
  goal: number;
  description?: string;
  color?: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useUser();
  const { courseData } = useCourse();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name || '');
  const [competences, setCompetences] = useState<Competence[]>([]);
  const [loadingCompetences, setLoadingCompetences] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Buscar competências do mapa de competências
  useEffect(() => {
    const fetchCompetences = async () => {
      try {
        setLoadingCompetences(true);
        const response = await api.get('/paradigms').catch(() => ({ data: { competences: [] } }));
        const data = response?.data || {};
        const fetchedCompetences = Array.isArray(data.competences) ? data.competences : [];
        setCompetences(fetchedCompetences);
      } catch (error) {
        console.error('Failed to fetch competences:', error);
        setCompetences([]);
      } finally {
        setLoadingCompetences(false);
      }
    };
    fetchCompetences();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      e.target.value = '';
      return;
    }

    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          await api.post('/user/avatar', { avatar: base64String });
          await refreshUser();
        } catch (error) {
          console.error('Failed to upload avatar:', error);
          alert('Erro ao fazer upload do avatar. Tente novamente.');
        } finally {
          setUploadingAvatar(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.onerror = () => {
        alert('Erro ao ler o arquivo. Tente novamente.');
        setUploadingAvatar(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Erro ao fazer upload do avatar. Tente novamente.');
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    if (user) {
      setNameValue(user.name || '');
    }
  }, [user]);

  const handleNameSave = async () => {
    try {
      await api.put('/user', { name: nameValue });
      await refreshUser();
      setEditingName(false);
    } catch (error) {
      console.error('Failed to update name:', error);
      alert('Erro ao atualizar nome');
    }
  };

  const stats = courseData.stats;
  const { level, name: levelName } = calculateLevel(stats.progress, stats.hoursStudied);

  const completedProjects = useMemo(() => {
    return courseData.projects.filter(project => project.status === 'completed' || project.progress === 100);
  }, [courseData]);

  const activeProjects = useMemo(() => {
    return courseData.projects.filter(project => 
      project.status !== 'completed' && project.progress < 100 && project.progress > 0
    );
  }, [courseData]);

  // Agrupar competências por categoria
  const competencesByCategory = useMemo(() => {
    const grouped: Record<string, Competence[]> = {};
    competences.forEach(comp => {
      const category = comp.category || 'Outras';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(comp);
    });
    return grouped;
  }, [competences]);

  // Top competências (ordenadas por nível atual)
  const topCompetences = useMemo(() => {
    return [...competences]
      .sort((a, b) => b.currentLevel - a.currentLevel)
      .slice(0, 6);
  }, [competences]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      {/* Header Minimalista */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary mb-2">Perfil do Estudante</p>
          <h1 className="text-3xl font-serif font-light text-white tracking-tight">Perfil</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/settings')} 
            size="sm"
            className="border-white/10 hover:bg-white/5"
          >
            Configurações
          </Button>
          <Button 
            variant="outline" 
            onClick={handleLogout} 
            size="sm"
            className="border-white/10 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </motion.div>

      {/* Perfil Card - Minimalista */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border border-white/10 bg-transparent">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              {/* Avatar */}
              <div className="relative group">
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=780606&color=fff`}
                  alt={user?.name}
                  className="h-24 w-24 rounded-full border-2 border-white/10 object-cover"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 rounded-full bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  {uploadingAvatar ? (
                    <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                {editingName ? (
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                    <input
                      type="text"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      className="text-2xl font-light bg-transparent border-b-2 border-primary focus:outline-none text-white text-center md:text-left"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleNameSave();
                        if (e.key === 'Escape') {
                          setEditingName(false);
                          setNameValue(user?.name || '');
                        }
                      }}
                    />
                    <Button size="sm" variant="ghost" onClick={handleNameSave} className="h-8 w-8 p-0">
                      ✓
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingName(false);
                        setNameValue(user?.name || '');
                      }}
                      className="h-8 w-8 p-0"
                    >
                      ✕
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                    <h2 className="text-2xl font-light text-white">{user?.name}</h2>
                    <button
                      onClick={() => setEditingName(true)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/5 rounded"
                    >
                      <span className="text-sm text-muted-foreground">✎</span>
                    </button>
                  </div>
                )}
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-primary">Nível {level + 1} • {levelName}</span>
                  </div>
                </div>

                {/* Stats Minimalistas */}
                <div className="grid grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats.progress}%</div>
                    <div className="text-xs text-muted-foreground">Progresso</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats.hoursStudied.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Horas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats.booksRead}</div>
                    <div className="text-xs text-muted-foreground">Livros</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{completedProjects.length}</div>
                    <div className="text-xs text-muted-foreground">Projetos</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Competências Sincronizadas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-primary mb-1">Competências</p>
            <h2 className="text-xl font-serif font-light text-white">Mapa de Competências</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/paradigms')}
            className="border-white/10 hover:bg-white/5"
          >
            Ver Mapa Completo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {loadingCompetences ? (
          <Card className="border border-white/10 bg-transparent">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </CardContent>
          </Card>
        ) : competences.length === 0 ? (
          <Card className="border border-white/10 bg-transparent">
            <CardContent className="p-8 text-center">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">Nenhuma competência registrada ainda.</p>
              <Button
                variant="outline"
                onClick={() => navigate('/paradigms')}
                className="border-white/10 hover:bg-white/5"
              >
                Adicionar Competências
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Top Competências */}
            {topCompetences.length > 0 && (
              <Card className="border border-white/10 bg-transparent">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-white mb-4">Principais Competências</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topCompetences.map((comp, index) => {
                      const percentage = levelToPercentage(comp.currentLevel);
                      return (
                        <motion.div
                          key={comp.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:border-white/10 transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-white">{comp.name}</h4>
                            <span className="text-xs font-bold text-primary">{comp.currentLevel}/12</span>
                          </div>
                          <div className="relative w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ delay: index * 0.05 + 0.2, duration: 0.6 }}
                              className="absolute inset-y-0 left-0 bg-primary rounded-full"
                            />
                          </div>
                          {comp.category && (
                            <p className="text-xs text-muted-foreground">{comp.category}</p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Competências por Categoria */}
            {Object.keys(competencesByCategory).length > 0 && (
              <div className="space-y-4">
                {Object.entries(competencesByCategory).map(([category, categoryCompetences], catIndex) => (
                  <Card key={category} className="border border-white/10 bg-transparent">
                    <CardContent className="p-6">
                      <h3 className="text-sm font-semibold text-white mb-4">{category}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {categoryCompetences.map((comp, index) => {
                          const percentage = levelToPercentage(comp.currentLevel);
                          return (
                            <div
                              key={comp.id}
                              className="p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:border-white/10 transition-all"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-white">{comp.name}</h4>
                                <span className="text-xs font-bold text-primary">{comp.currentLevel}/12</span>
                              </div>
                              <div className="relative w-full bg-white/10 h-1 rounded-full overflow-hidden">
                                <div
                                  className="absolute inset-y-0 left-0 bg-primary rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Atividades Recentes - Minimalista */}
      {(activeProjects.length > 0 || completedProjects.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-primary mb-1">Atividades</p>
              <h2 className="text-xl font-serif font-light text-white">Projetos</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/projects')}
              className="border-white/10 hover:bg-white/5"
            >
              Ver Todos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeProjects.slice(0, 2).map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white">{project.title}</h3>
                  <span className="text-xs font-bold text-primary">{project.progress}%</span>
                </div>
                <div className="relative w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary rounded-full"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </motion.div>
            ))}
            {completedProjects.slice(0, 2).map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (activeProjects.length + index) * 0.1 }}
                className="p-4 rounded-lg border border-green-500/20 bg-green-500/[0.02] hover:border-green-500/30 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white">{project.title}</h3>
                  <span className="text-xs font-bold text-green-400">Concluído</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
