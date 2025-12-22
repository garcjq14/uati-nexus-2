import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useCourse } from '../contexts/CourseContext';
import api from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  LogOut, Mail, Clock, BookOpen, Code, TrendingUp, Trophy, Upload,
  Brain, Activity, ArrowRight, Edit, Save, X, Plus, Trash2, 
  GraduationCap, Briefcase, Languages, Award, FileText, Target,
  Globe, Github, Linkedin, Twitter, ExternalLink, Calendar, MapPin,
  CheckCircle2, PlayCircle, Video, File, Layers, Zap, BarChart3,
  Clock3, BookMarked, PenTool, CheckSquare, User, Building2
} from 'lucide-react';
import { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface AcademicInfo {
  university: string;
  course: string;
  period: string;
  startDate: string;
  endDate: string;
  status: 'studying' | 'completed' | 'paused';
  gpa?: string;
  description?: string;
}

interface Experience {
  id: string;
  title: string;
  company: string;
  type: 'academic' | 'professional' | 'internship' | 'research';
  startDate: string;
  endDate: string;
  description: string;
  current: boolean;
  location?: string;
}

interface Language {
  id: string;
  name: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'native';
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
  link?: string;
}

interface Publication {
  id: string;
  title: string;
  type: 'article' | 'paper' | 'poster' | 'book';
  venue: string;
  date: string;
  link?: string;
  authors?: string;
}

interface ProfileData {
  headline: string;
  location: string;
  about: string;
  academicInfo: AcademicInfo | null;
  experiences: Experience[];
  languages: Language[];
  certifications: Certification[];
  publications: Publication[];
}

interface StudySession {
  id: string;
  duration: number;
  type: string;
  createdAt: string;
}

const STORAGE_KEY = 'user_profile_data';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useUser();
  const { courseData } = useCourse();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name || '');
  const [competences, setCompetences] = useState<Competence[]>([]);
  const [loadingCompetences, setLoadingCompetences] = useState(true);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [loadingUatiData, setLoadingUatiData] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData>({
    headline: '',
    location: '',
    about: '',
    academicInfo: null,
    experiences: [],
    languages: [],
    certifications: [],
    publications: [],
  });
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar dados do perfil
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setProfileData({
          headline: parsed.headline || '',
          location: parsed.location || '',
          about: parsed.about || parsed.bio || '',
          academicInfo: parsed.academicInfo || null,
          experiences: parsed.experiences || [],
          languages: parsed.languages || [],
          certifications: parsed.certifications || [],
          publications: parsed.publications || [],
        });
      } catch (e) {
        console.error('Failed to parse profile data:', e);
      }
    }
  }, []);

  // Salvar dados do perfil
  const saveProfileData = (data: ProfileData) => {
    setProfileData(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

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

  // Buscar dados da UATI (sessões de estudo)
  useEffect(() => {
    const fetchUatiData = async () => {
      try {
        setLoadingUatiData(true);
        const sessionsResponse = await api.get('/timer/history').catch(() => ({ data: [] }));
        setStudySessions(Array.isArray(sessionsResponse.data) ? sessionsResponse.data : []);
      } catch (error) {
        console.error('Failed to fetch UATI data:', error);
        setStudySessions([]);
      } finally {
        setLoadingUatiData(false);
      }
    };
    fetchUatiData();
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

  // Estatísticas de sessões de estudo
  const sessionsStats = useMemo(() => {
    const total = studySessions.length;
    const totalMinutes = studySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const thisWeek = studySessions.filter(s => {
      const sessionDate = new Date(s.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sessionDate >= weekAgo;
    }).length;
    
    return { total, totalHours, thisWeek };
  }, [studySessions]);

  const topCompetences = useMemo(() => {
    return [...competences]
      .sort((a, b) => b.currentLevel - a.currentLevel)
      .slice(0, 10);
  }, [competences]);

  // Handlers para edição
  const handleAddExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      title: '',
      company: '',
      type: 'professional',
      startDate: '',
      endDate: '',
      description: '',
      current: false,
      location: '',
    };
    saveProfileData({ ...profileData, experiences: [...profileData.experiences, newExp] });
    setEditingSection(`exp-${newExp.id}`);
  };

  const handleUpdateExperience = (id: string, data: Partial<Experience>) => {
    saveProfileData({
      ...profileData,
      experiences: profileData.experiences.map(exp => exp.id === id ? { ...exp, ...data } : exp),
    });
  };

  const handleDeleteExperience = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta experiência?')) {
      saveProfileData({
        ...profileData,
        experiences: profileData.experiences.filter(exp => exp.id !== id),
      });
    }
  };

  const handleAddLanguage = () => {
    const newLang: Language = {
      id: Date.now().toString(),
      name: '',
      level: 'intermediate',
    };
    saveProfileData({ ...profileData, languages: [...profileData.languages, newLang] });
    setEditingSection(`lang-${newLang.id}`);
  };

  const handleUpdateLanguage = (id: string, data: Partial<Language>) => {
    saveProfileData({
      ...profileData,
      languages: profileData.languages.map(lang => lang.id === id ? { ...lang, ...data } : lang),
    });
  };

  const handleDeleteLanguage = (id: string) => {
    saveProfileData({
      ...profileData,
      languages: profileData.languages.filter(lang => lang.id !== id),
    });
  };

  const handleAddCertification = () => {
    const newCert: Certification = {
      id: Date.now().toString(),
      name: '',
      issuer: '',
      date: '',
      link: '',
    };
    saveProfileData({ ...profileData, certifications: [...profileData.certifications, newCert] });
    setEditingSection(`cert-${newCert.id}`);
  };

  const handleUpdateCertification = (id: string, data: Partial<Certification>) => {
    saveProfileData({
      ...profileData,
      certifications: profileData.certifications.map(cert => cert.id === id ? { ...cert, ...data } : cert),
    });
  };

  const handleDeleteCertification = (id: string) => {
    saveProfileData({
      ...profileData,
      certifications: profileData.certifications.filter(cert => cert.id !== id),
    });
  };

  const handleAddPublication = () => {
    const newPub: Publication = {
      id: Date.now().toString(),
      title: '',
      type: 'article',
      venue: '',
      date: '',
      link: '',
    };
    saveProfileData({ ...profileData, publications: [...profileData.publications, newPub] });
    setEditingSection(`pub-${newPub.id}`);
  };

  const handleUpdatePublication = (id: string, data: Partial<Publication>) => {
    saveProfileData({
      ...profileData,
      publications: profileData.publications.map(pub => pub.id === id ? { ...pub, ...data } : pub),
    });
  };

  const handleDeletePublication = (id: string) => {
    saveProfileData({
      ...profileData,
      publications: profileData.publications.filter(pub => pub.id !== id),
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary mb-2">Currículo Profissional</p>
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

      {/* Perfil Principal - Estilo LinkedIn */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border border-white/10 bg-transparent">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="relative group">
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=780606&color=fff`}
                  alt={user?.name}
                  className="h-32 w-32 rounded-full border-2 border-white/10 object-cover"
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

              {/* Info Principal */}
              <div className="flex-1">
                {editingName ? (
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      className="text-3xl font-light bg-transparent border-b-2 border-primary focus:outline-none text-white"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleNameSave();
                        if (e.key === 'Escape') {
                          setEditingName(false);
                          setNameValue(user?.name || '');
                        }
                      }}
                    />
                    <Button size="sm" variant="ghost" onClick={handleNameSave} className="h-8 w-8 p-0">✓</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingName(false); setNameValue(user?.name || ''); }} className="h-8 w-8 p-0">✕</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-3xl font-light text-white">{user?.name}</h2>
                    <button onClick={() => setEditingName(true)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/5 rounded">
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                )}

                {/* Headline */}
                {editingSection === 'headline' ? (
                  <div className="flex items-center gap-2 mb-3">
                    <Input
                      value={profileData.headline}
                      onChange={(e) => saveProfileData({ ...profileData, headline: e.target.value })}
                      placeholder="Título profissional (ex: Estudante de Ciência da Computação)"
                      className="bg-transparent border-white/10"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingSection(null);
                      }}
                    />
                    <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)} className="h-8 w-8 p-0">✓</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-lg text-muted-foreground">
                      {profileData.headline || 'Adicione um título profissional'}
                    </p>
                    <button onClick={() => setEditingSection('headline')} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                )}

                {/* Localização */}
                {editingSection === 'location' ? (
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={profileData.location}
                      onChange={(e) => saveProfileData({ ...profileData, location: e.target.value })}
                      placeholder="Localização"
                      className="bg-transparent border-white/10 flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingSection(null);
                      }}
                    />
                    <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)} className="h-8 w-8 p-0">✓</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {profileData.location || 'Adicione sua localização'}
                    </span>
                    <button onClick={() => setEditingSection('location')} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                )}

                {/* Links Sociais */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {user?.email && (
                    <a href={`mailto:${user.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </a>
                  )}
                  {user?.github && (
                    <a href={user.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <Github className="h-4 w-4" />
                      <span>GitHub</span>
                    </a>
                  )}
                  {user?.linkedin && (
                    <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <Linkedin className="h-4 w-4" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {user?.portfolio && (
                    <a href={user.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <ExternalLink className="h-4 w-4" />
                      <span>Portfólio</span>
                    </a>
                  )}
                </div>

                {/* Stats Rápidas */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Nível {level + 1} • {levelName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-400" />
                    <span className="text-muted-foreground">{stats.booksRead} livros</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-green-400" />
                    <span className="text-muted-foreground">{completedProjects.length} projetos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-purple-400" />
                    <span className="text-muted-foreground">{sessionsStats.totalHours.toFixed(1)}h estudadas</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sobre */}
      <Card className="border border-white/10 bg-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Sobre</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingSection(editingSection === 'about' ? null : 'about')}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
          {editingSection === 'about' ? (
            <div className="space-y-3">
              <textarea
                value={profileData.about}
                onChange={(e) => saveProfileData({ ...profileData, about: e.target.value })}
                placeholder="Escreva sobre você, suas experiências, objetivos e interesses..."
                className="w-full min-h-[150px] rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/30"
              />
              <Button size="sm" onClick={() => setEditingSection(null)}>Salvar</Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {profileData.about || 'Adicione informações sobre você.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Experiência */}
      <Card className="border border-white/10 bg-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Experiência
            </h3>
            <Button variant="outline" size="sm" onClick={handleAddExperience}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar experiência
            </Button>
          </div>
          <div className="space-y-6">
            {profileData.experiences.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma experiência adicionada ainda.</p>
            ) : (
              profileData.experiences.map((exp) => (
                <div key={exp.id} className="border-l-2 border-white/10 pl-4">
                  {editingSection === `exp-${exp.id}` ? (
                    <div className="space-y-3">
                      <Input
                        placeholder="Título/Cargo"
                        value={exp.title}
                        onChange={(e) => handleUpdateExperience(exp.id, { title: e.target.value })}
                      />
                      <Input
                        placeholder="Empresa/Instituição"
                        value={exp.company}
                        onChange={(e) => handleUpdateExperience(exp.id, { company: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={exp.type}
                          onChange={(e) => handleUpdateExperience(exp.id, { type: e.target.value as any })}
                          className="rounded-lg border border-white/10 bg-white/5 p-2 text-sm text-white"
                        >
                          <option value="professional">Profissional</option>
                          <option value="academic">Acadêmica</option>
                          <option value="internship">Estágio</option>
                          <option value="research">Pesquisa</option>
                        </select>
                        <Input
                          placeholder="Localização"
                          value={exp.location || ''}
                          onChange={(e) => handleUpdateExperience(exp.id, { location: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="month"
                          placeholder="Data início"
                          value={exp.startDate}
                          onChange={(e) => handleUpdateExperience(exp.id, { startDate: e.target.value })}
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            type="month"
                            placeholder="Data fim"
                            value={exp.endDate}
                            onChange={(e) => handleUpdateExperience(exp.id, { endDate: e.target.value })}
                            disabled={exp.current}
                            className="flex-1"
                          />
                          <label className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={exp.current}
                              onChange={(e) => handleUpdateExperience(exp.id, { current: e.target.checked })}
                              className="rounded"
                            />
                            Atual
                          </label>
                        </div>
                      </div>
                      <textarea
                        placeholder="Descrição das responsabilidades e conquistas..."
                        value={exp.description}
                        onChange={(e) => handleUpdateExperience(exp.id, { description: e.target.value })}
                        className="w-full min-h-[100px] rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/30"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setEditingSection(null)}>Salvar</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteExperience(exp.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-base font-semibold text-white">{exp.title || 'Sem título'}</h4>
                          <p className="text-sm text-muted-foreground">{exp.company}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {exp.startDate && new Date(exp.startDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                            {exp.startDate && (exp.endDate || exp.current) && ' - '}
                            {exp.current ? 'Atual' : exp.endDate && new Date(exp.endDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                            {exp.location && ` • ${exp.location}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setEditingSection(`exp-${exp.id}`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteExperience(exp.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {exp.description && (
                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{exp.description}</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Educação */}
      <Card className="border border-white/10 bg-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Educação
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingSection(editingSection === 'academic' ? null : 'academic')}
            >
              {editingSection === 'academic' ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            </Button>
          </div>
          {editingSection === 'academic' ? (
            <div className="space-y-4">
              <Input
                placeholder="Escola/Universidade"
                value={profileData.academicInfo?.university || ''}
                onChange={(e) => saveProfileData({
                  ...profileData,
                  academicInfo: { ...(profileData.academicInfo || {} as AcademicInfo), university: e.target.value } as AcademicInfo,
                })}
              />
              <Input
                placeholder="Curso/Grau"
                value={profileData.academicInfo?.course || ''}
                onChange={(e) => saveProfileData({
                  ...profileData,
                  academicInfo: { ...(profileData.academicInfo || {} as AcademicInfo), course: e.target.value } as AcademicInfo,
                })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Período/Ano"
                  value={profileData.academicInfo?.period || ''}
                  onChange={(e) => saveProfileData({
                    ...profileData,
                    academicInfo: { ...(profileData.academicInfo || {} as AcademicInfo), period: e.target.value } as AcademicInfo,
                  })}
                />
                <select
                  value={profileData.academicInfo?.status || 'studying'}
                  onChange={(e) => saveProfileData({
                    ...profileData,
                    academicInfo: { ...(profileData.academicInfo || {} as AcademicInfo), status: e.target.value as any } as AcademicInfo,
                  })}
                  className="rounded-lg border border-white/10 bg-white/5 p-2 text-sm text-white"
                >
                  <option value="studying">Cursando</option>
                  <option value="completed">Concluído</option>
                  <option value="paused">Trancado</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="month"
                  placeholder="Data de início"
                  value={profileData.academicInfo?.startDate || ''}
                  onChange={(e) => saveProfileData({
                    ...profileData,
                    academicInfo: { ...(profileData.academicInfo || {} as AcademicInfo), startDate: e.target.value } as AcademicInfo,
                  })}
                />
                <Input
                  type="month"
                  placeholder="Data de término"
                  value={profileData.academicInfo?.endDate || ''}
                  onChange={(e) => saveProfileData({
                    ...profileData,
                    academicInfo: { ...(profileData.academicInfo || {} as AcademicInfo), endDate: e.target.value } as AcademicInfo,
                  })}
                />
              </div>
              <Input
                placeholder="GPA/Nota (opcional)"
                value={profileData.academicInfo?.gpa || ''}
                onChange={(e) => saveProfileData({
                  ...profileData,
                  academicInfo: { ...(profileData.academicInfo || {} as AcademicInfo), gpa: e.target.value } as AcademicInfo,
                })}
              />
              <textarea
                placeholder="Descrição, atividades, conquistas..."
                value={profileData.academicInfo?.description || ''}
                onChange={(e) => saveProfileData({
                  ...profileData,
                  academicInfo: { ...(profileData.academicInfo || {} as AcademicInfo), description: e.target.value } as AcademicInfo,
                })}
                className="w-full min-h-[80px] rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/30"
              />
              <Button size="sm" onClick={() => setEditingSection(null)}>Salvar</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {profileData.academicInfo ? (
                <>
                  <div className="flex items-center gap-2 text-white">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{profileData.academicInfo.course}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{profileData.academicInfo.university}</p>
                  <p className="text-sm text-muted-foreground">
                    {profileData.academicInfo.period}
                    {profileData.academicInfo.gpa && ` • GPA: ${profileData.academicInfo.gpa}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profileData.academicInfo.startDate && new Date(profileData.academicInfo.startDate).getFullYear()}
                    {profileData.academicInfo.startDate && profileData.academicInfo.endDate && ' - '}
                    {profileData.academicInfo.endDate && new Date(profileData.academicInfo.endDate).getFullYear()}
                    {profileData.academicInfo.status === 'studying' && ' • Cursando'}
                    {profileData.academicInfo.status === 'completed' && ' • Concluído'}
                    {profileData.academicInfo.status === 'paused' && ' • Trancado'}
                  </p>
                  {profileData.academicInfo.description && (
                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{profileData.academicInfo.description}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Adicione suas informações educacionais.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Licenças e Certificações */}
      <Card className="border border-white/10 bg-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Licenças e Certificações
            </h3>
            <Button variant="outline" size="sm" onClick={handleAddCertification}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar certificação
            </Button>
          </div>
          <div className="space-y-4">
            {profileData.certifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma certificação adicionada ainda.</p>
            ) : (
              profileData.certifications.map((cert) => (
                <div key={cert.id} className="border-l-2 border-white/10 pl-4">
                  {editingSection === `cert-${cert.id}` ? (
                    <div className="space-y-3">
                      <Input
                        placeholder="Nome da certificação"
                        value={cert.name}
                        onChange={(e) => handleUpdateCertification(cert.id, { name: e.target.value })}
                      />
                      <Input
                        placeholder="Organização emissora"
                        value={cert.issuer}
                        onChange={(e) => handleUpdateCertification(cert.id, { issuer: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="month"
                          placeholder="Data de emissão"
                          value={cert.date}
                          onChange={(e) => handleUpdateCertification(cert.id, { date: e.target.value })}
                        />
                        <Input
                          type="month"
                          placeholder="Data de expiração (opcional)"
                          value={cert.expiryDate || ''}
                          onChange={(e) => handleUpdateCertification(cert.id, { expiryDate: e.target.value })}
                        />
                      </div>
                      <Input
                        placeholder="ID da credencial (opcional)"
                        value={cert.credentialId || ''}
                        onChange={(e) => handleUpdateCertification(cert.id, { credentialId: e.target.value })}
                      />
                      <Input
                        placeholder="Link (opcional)"
                        value={cert.link || ''}
                        onChange={(e) => handleUpdateCertification(cert.id, { link: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setEditingSection(null)}>Salvar</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteCertification(cert.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-base font-semibold text-white">{cert.name}</h4>
                          <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {cert.date && new Date(cert.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                            {cert.expiryDate && ` - ${new Date(cert.expiryDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`}
                            {!cert.expiryDate && cert.date && ' • Sem expiração'}
                          </p>
                          {cert.credentialId && (
                            <p className="text-xs text-muted-foreground">ID: {cert.credentialId}</p>
                          )}
                          {cert.link && (
                            <a href={cert.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                              Ver credencial <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setEditingSection(`cert-${cert.id}`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteCertification(cert.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Competências */}
      <Card className="border border-white/10 bg-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Competências
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/paradigms')}
              className="border-white/10 hover:bg-white/5"
            >
              Gerenciar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          {loadingCompetences ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : topCompetences.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma competência registrada ainda.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topCompetences.map((comp) => {
                const percentage = levelToPercentage(comp.currentLevel);
                return (
                  <div
                    key={comp.id}
                    className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02] hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{comp.name}</span>
                      <span className="text-xs text-muted-foreground">({comp.currentLevel}/12)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Idiomas */}
      <Card className="border border-white/10 bg-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" />
              Idiomas
            </h3>
            <Button variant="outline" size="sm" onClick={handleAddLanguage}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar idioma
            </Button>
          </div>
          <div className="space-y-3">
            {profileData.languages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum idioma adicionado ainda.</p>
            ) : (
              profileData.languages.map((lang) => (
                <div key={lang.id} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                  {editingSection === `lang-${lang.id}` ? (
                    <div className="flex-1 flex items-center gap-3">
                      <Input
                        placeholder="Idioma"
                        value={lang.name}
                        onChange={(e) => handleUpdateLanguage(lang.id, { name: e.target.value })}
                        className="flex-1"
                      />
                      <select
                        value={lang.level}
                        onChange={(e) => handleUpdateLanguage(lang.id, { level: e.target.value as any })}
                        className="rounded-lg border border-white/10 bg-white/5 p-2 text-sm text-white"
                      >
                        <option value="basic">Básico</option>
                        <option value="intermediate">Intermediário</option>
                        <option value="advanced">Avançado</option>
                        <option value="native">Nativo</option>
                      </select>
                      <Button size="sm" onClick={() => setEditingSection(null)}>Salvar</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteLanguage(lang.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="text-sm font-semibold text-white">{lang.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          • {lang.level === 'basic' ? 'Básico' : lang.level === 'intermediate' ? 'Intermediário' : lang.level === 'advanced' ? 'Avançado' : 'Nativo'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingSection(`lang-${lang.id}`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteLanguage(lang.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Projetos */}
      {(activeProjects.length > 0 || completedProjects.length > 0) && (
        <Card className="border border-white/10 bg-transparent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Projetos
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/projects')}
                className="border-white/10 hover:bg-white/5"
              >
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              {[...activeProjects.slice(0, 3), ...completedProjects.slice(0, 3)].map((project) => (
                <div key={project.id} className="border-l-2 border-white/10 pl-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-white">{project.title}</h4>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                      )}
                      {project.technologies && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(Array.isArray(project.technologies) ? project.technologies : [project.technologies]).map((tech, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-lg bg-primary/10 text-xs text-primary border border-primary/20"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded-full",
                      project.status === 'completed' || project.progress === 100
                        ? "bg-green-500/20 text-green-400"
                        : "bg-primary/20 text-primary"
                    )}>
                      {project.status === 'completed' || project.progress === 100 ? 'Concluído' : `${project.progress}%`}
                    </span>
                  </div>
                  {project.repository && (
                    <a
                      href={project.repository}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                    >
                      Ver repositório <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Publicações */}
      {profileData.publications.length > 0 && (
        <Card className="border border-white/10 bg-transparent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Publicações
              </h3>
              <Button variant="outline" size="sm" onClick={handleAddPublication}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar publicação
              </Button>
            </div>
            <div className="space-y-4">
              {profileData.publications.map((pub) => (
                <div key={pub.id} className="border-l-2 border-white/10 pl-4">
                  {editingSection === `pub-${pub.id}` ? (
                    <div className="space-y-3">
                      <Input
                        placeholder="Título"
                        value={pub.title}
                        onChange={(e) => handleUpdatePublication(pub.id, { title: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={pub.type}
                          onChange={(e) => handleUpdatePublication(pub.id, { type: e.target.value as any })}
                          className="rounded-lg border border-white/10 bg-white/5 p-2 text-sm text-white"
                        >
                          <option value="article">Artigo</option>
                          <option value="paper">Paper</option>
                          <option value="poster">Poster</option>
                          <option value="book">Livro</option>
                        </select>
                        <Input
                          type="month"
                          placeholder="Data"
                          value={pub.date}
                          onChange={(e) => handleUpdatePublication(pub.id, { date: e.target.value })}
                        />
                      </div>
                      <Input
                        placeholder="Local/Venue"
                        value={pub.venue}
                        onChange={(e) => handleUpdatePublication(pub.id, { venue: e.target.value })}
                      />
                      <Input
                        placeholder="Autores (opcional)"
                        value={pub.authors || ''}
                        onChange={(e) => handleUpdatePublication(pub.id, { authors: e.target.value })}
                      />
                      <Input
                        placeholder="Link (opcional)"
                        value={pub.link || ''}
                        onChange={(e) => handleUpdatePublication(pub.id, { link: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setEditingSection(null)}>Salvar</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeletePublication(pub.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-base font-semibold text-white">{pub.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {pub.type === 'article' ? 'Artigo' : pub.type === 'paper' ? 'Paper' : pub.type === 'poster' ? 'Poster' : 'Livro'} • {pub.venue}
                          </p>
                          {pub.authors && (
                            <p className="text-xs text-muted-foreground mt-1">Autores: {pub.authors}</p>
                          )}
                          {pub.date && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(pub.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                            </p>
                          )}
                          {pub.link && (
                            <a href={pub.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                              Ver publicação <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setEditingSection(`pub-${pub.id}`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeletePublication(pub.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão para adicionar publicação se não houver nenhuma */}
      {profileData.publications.length === 0 && (
        <Card className="border border-white/10 bg-transparent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Publicações
              </h3>
              <Button variant="outline" size="sm" onClick={handleAddPublication}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar publicação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
