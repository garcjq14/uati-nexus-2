import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useCourse } from '../contexts/CourseContext';
import api from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  LogOut, Mail, Code, Trophy, Upload,
  Brain, ArrowRight, Edit, X, Plus, Trash2, 
  GraduationCap, Briefcase, Languages, Award, FileText,
  Github, Linkedin, ExternalLink, MapPin,
  Phone, Globe, Star, Sparkles,
  Target, Heart, Music, Gamepad2
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

// Nova função de cálculo de nível baseada em atividades
function calculateLevel(
  completedSubjects: number,
  completedProjects: number,
  completedResources: number,
  flashcardsCreated: number,
  notesCreated: number,
  hoursStudied: number
): { level: number; name: string; progress: number; nextLevelProgress: number } {
  // Pontos por atividade
  const subjectPoints = completedSubjects * 5; // 5 pontos por matéria concluída
  const projectPoints = completedProjects * 10; // 10 pontos por projeto concluído
  const resourcePoints = completedResources * 2; // 2 pontos por recurso concluído
  const flashcardPoints = Math.min(flashcardsCreated / 10, 20); // Máximo 20 pontos (200 flashcards)
  const notePoints = Math.min(notesCreated / 5, 15); // Máximo 15 pontos (75 notas)
  const hoursPoints = Math.min(hoursStudied / 2, 30); // Máximo 30 pontos (60 horas)
  
  const totalPoints = subjectPoints + projectPoints + resourcePoints + flashcardPoints + notePoints + hoursPoints;
  
  // Níveis: 0-20 (Iniciante), 21-50 (Explorador), 51-100 (Aprendiz), 101-200 (Estudante), 
  // 201-350 (Conhecedor), 351-500 (Mestre), 501-750 (Sábio), 751+ (Lenda)
  let level = 0;
  if (totalPoints >= 751) level = 7;
  else if (totalPoints >= 501) level = 6;
  else if (totalPoints >= 351) level = 5;
  else if (totalPoints >= 201) level = 4;
  else if (totalPoints >= 101) level = 3;
  else if (totalPoints >= 51) level = 2;
  else if (totalPoints >= 21) level = 1;
  else level = 0;
  
  // Calcular progresso para o próximo nível
  const levelThresholds = [0, 21, 51, 101, 201, 351, 501, 751];
  const currentThreshold = levelThresholds[level];
  const nextThreshold = levelThresholds[Math.min(level + 1, 7)];
  const progressInLevel = totalPoints - currentThreshold;
  const levelRange = nextThreshold - currentThreshold;
  const progress = levelRange > 0 ? Math.round((progressInLevel / levelRange) * 100) : 100;
  const nextLevelProgress = nextThreshold - totalPoints;
  
  return { 
    level, 
    name: LEVEL_NAMES[level] || 'Iniciante',
    progress: Math.max(0, Math.min(100, progress)),
    nextLevelProgress: Math.max(0, nextLevelProgress)
  };
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

interface Skill {
  id: string;
  name: string;
  category: 'technical' | 'soft' | 'language' | 'tool';
}

interface Interest {
  id: string;
  name: string;
  category: 'hobby' | 'sport' | 'art' | 'music' | 'other';
}

interface ProfileData {
  headline: string;
  location: string;
  phone?: string;
  website?: string;
  about: string;
  summary: string;
  academicInfo: AcademicInfo | null;
  experiences: Experience[];
  languages: Language[];
  certifications: Certification[];
  publications: Publication[];
  skills: Skill[];
  interests: Interest[];
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
  const [profileData, setProfileData] = useState<ProfileData>({
    headline: '',
    location: '',
    phone: '',
    website: '',
    about: '',
    summary: '',
    academicInfo: null,
    experiences: [],
    languages: [],
    certifications: [],
    publications: [],
    skills: [],
    interests: [],
  });
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar dados do perfil
  useEffect(() => {
    // Carregar headline do backend (user)
    if (user?.headline) {
      setProfileData(prev => ({ ...prev, headline: user.headline || '' }));
    }
    
    // Carregar outros dados do localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setProfileData(prev => ({
          ...prev,
          location: parsed.location || '',
          phone: parsed.phone || '',
          website: parsed.website || '',
          about: parsed.about || parsed.bio || '',
          summary: parsed.summary || '',
          academicInfo: parsed.academicInfo || null,
          experiences: parsed.experiences || [],
          languages: parsed.languages || [],
          certifications: parsed.certifications || [],
          publications: parsed.publications || [],
          skills: parsed.skills || [],
          interests: parsed.interests || [],
        }));
      } catch (e) {
        console.error('Failed to parse profile data:', e);
      }
    }
  }, [user]);

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
        const sessionsResponse = await api.get('/timer/history').catch(() => ({ data: [] }));
        setStudySessions(Array.isArray(sessionsResponse.data) ? sessionsResponse.data : []);
      } catch (error) {
        console.error('Failed to fetch UATI data:', error);
        setStudySessions([]);
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

  // Calcular estatísticas para o nível
  const completedSubjects = useMemo(() => {
    return courseData.curriculum.filter(c => c.status === 'completed').length;
  }, [courseData.curriculum]);

  const completedProjects = useMemo(() => {
    return courseData.projects.filter(project => project.status === 'completed' || project.progress === 100);
  }, [courseData]);

  const completedResources = useMemo(() => {
    return courseData.resources.filter(r => r.status === 'concluido').length;
  }, [courseData.resources]);

  const flashcardsCreated = useMemo(() => {
    return courseData.flashcards.length;
  }, [courseData.flashcards]);

  const notesCreated = useMemo(() => {
    // Assumindo que temos acesso às notas através do courseData ou precisamos buscar
    return 0; // Será atualizado quando tivermos acesso às notas
  }, []);

  const sessionsStats = useMemo(() => {
    const totalMinutes = studySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    return { totalHours };
  }, [studySessions]);

  const { level, name: levelName, progress: levelProgress, nextLevelProgress } = useMemo(() => {
    return calculateLevel(
      completedSubjects,
      completedProjects.length,
      completedResources,
      flashcardsCreated,
      notesCreated,
      sessionsStats.totalHours
    );
  }, [completedSubjects, completedProjects.length, completedResources, flashcardsCreated, notesCreated, sessionsStats.totalHours]);

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

  const handleAddSkill = () => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: '',
      category: 'technical',
    };
    saveProfileData({ ...profileData, skills: [...profileData.skills, newSkill] });
    setEditingSection(`skill-${newSkill.id}`);
  };

  const handleUpdateSkill = (id: string, data: Partial<Skill>) => {
    saveProfileData({
      ...profileData,
      skills: profileData.skills.map(skill => skill.id === id ? { ...skill, ...data } : skill),
    });
  };

  const handleDeleteSkill = (id: string) => {
    saveProfileData({
      ...profileData,
      skills: profileData.skills.filter(skill => skill.id !== id),
    });
  };

  const handleAddInterest = () => {
    const newInterest: Interest = {
      id: Date.now().toString(),
      name: '',
      category: 'hobby',
    };
    saveProfileData({ ...profileData, interests: [...profileData.interests, newInterest] });
    setEditingSection(`interest-${newInterest.id}`);
  };

  const handleUpdateInterest = (id: string, data: Partial<Interest>) => {
    saveProfileData({
      ...profileData,
      interests: profileData.interests.map(interest => interest.id === id ? { ...interest, ...data } : interest),
    });
  };

  const handleDeleteInterest = (id: string) => {
    saveProfileData({
      ...profileData,
      interests: profileData.interests.filter(interest => interest.id !== id),
    });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#050506] via-[#0a0a0b] to-[#050506]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary mb-2">Currículo Profissional</p>
            <h1 className="text-4xl font-serif font-light text-white tracking-tight">Perfil</h1>
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

        {/* Perfil Principal - Estilo LinkedIn Melhorado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-sm">
            <CardContent className="p-10">
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Avatar */}
                <div className="relative group flex-shrink-0">
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=780606&color=fff`}
                    alt={user?.name}
                    className="h-40 w-40 rounded-2xl border-4 border-white/10 object-cover shadow-2xl"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 rounded-2xl bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    {uploadingAvatar ? (
                      <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="h-6 w-6 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  
                  {/* Badge de Nível */}
                  <div className="absolute -bottom-3 -right-3 bg-gradient-to-br from-primary to-primary/80 rounded-full p-3 shadow-xl border-4 border-[#050506]">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Info Principal */}
                <div className="flex-1 w-full">
                  {editingName ? (
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="text"
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        className="text-4xl font-light bg-transparent border-b-2 border-primary focus:outline-none text-white w-full"
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
                    <div className="group flex items-center gap-3 mb-4">
                      <h2 className="text-4xl font-light text-white">{user?.name}</h2>
                      <button onClick={() => setEditingName(true)} className="opacity-60 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/5 rounded">
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  )}

                  {/* Headline */}
                  {editingSection === 'headline' ? (
                    <div className="flex items-center gap-2 mb-4">
                      <Input
                        value={profileData.headline}
                        onChange={(e) => setProfileData({ ...profileData, headline: e.target.value })}
                        placeholder="Título profissional (ex: Estudante de Ciência da Computação)"
                        className="bg-white/5 border-white/10 text-white"
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            try {
                              await api.put('/user', { headline: profileData.headline });
                              await refreshUser();
                              setEditingSection(null);
                            } catch (error) {
                              console.error('Failed to save headline:', error);
                            }
                          }
                        }}
                      />
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={async () => {
                          try {
                            await api.put('/user', { headline: profileData.headline });
                            await refreshUser();
                            setEditingSection(null);
                          } catch (error) {
                            console.error('Failed to save headline:', error);
                          }
                        }} 
                        className="h-8 w-8 p-0"
                      >
                        ✓
                      </Button>
                    </div>
                  ) : (
                    <div className="group flex items-center gap-2 mb-4">
                      <p className="text-xl text-muted-foreground">
                        {profileData.headline || user?.headline || 'Adicione um título profissional'}
                      </p>
                      <button onClick={() => setEditingSection('headline')} className="opacity-60 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/5 rounded">
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  )}

                  {/* Informações de Contato */}
                  <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
                    {editingSection === 'location' ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <Input
                          value={profileData.location}
                          onChange={(e) => saveProfileData({ ...profileData, location: e.target.value })}
                          placeholder="Localização"
                          className="bg-white/5 border-white/10 text-white w-48"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingSection(null);
                          }}
                        />
                        <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)} className="h-6 w-6 p-0">✓</Button>
                      </div>
                    ) : (
                      <div className="group flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {profileData.location || 'Adicione sua localização'}
                        </span>
                        <button onClick={() => setEditingSection('location')} className="opacity-60 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/5 rounded">
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    )}
                    
                    {user?.email && (
                      <a href={`mailto:${user.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </a>
                    )}
                    {profileData.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{profileData.phone}</span>
                      </div>
                    )}
                    {profileData.website && (
                      <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                        <Globe className="h-4 w-4" />
                        <span>Website</span>
                      </a>
                    )}
                    {user?.github && (
                      <a href={user.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                        <Github className="h-4 w-4" />
                        <span>GitHub</span>
                      </a>
                    )}
                    {user?.linkedin && (
                      <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                        <Linkedin className="h-4 w-4" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {user?.portfolio && (
                      <a href={user.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                        <ExternalLink className="h-4 w-4" />
                        <span>Portfólio</span>
                      </a>
                    )}
                  </div>

                  {/* Nível e Progresso */}
                  <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl p-6 border border-primary/20 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Trophy className="h-6 w-6 text-primary" />
                          <div>
                            <h3 className="text-2xl font-bold text-white">Nível {level + 1}</h3>
                            <p className="text-lg text-primary font-semibold">{levelName}</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {nextLevelProgress > 0 
                            ? `${nextLevelProgress} pontos para o próximo nível`
                            : 'Nível máximo alcançado!'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white mb-1">{levelProgress}%</div>
                        <div className="text-xs text-muted-foreground">Progresso</div>
                      </div>
                    </div>
                    <div className="relative w-full bg-white/10 h-3 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${levelProgress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-white">{completedSubjects}</div>
                        <div className="text-xs text-muted-foreground">Matérias</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white">{completedProjects.length}</div>
                        <div className="text-xs text-muted-foreground">Projetos</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white">{completedResources}</div>
                        <div className="text-xs text-muted-foreground">Recursos</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white">{sessionsStats.totalHours.toFixed(1)}h</div>
                        <div className="text-xs text-muted-foreground">Estudadas</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Grid de Seções */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sobre */}
            <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">Sobre</h3>
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
                      className="w-full min-h-[200px] rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/30"
                    />
                    <Button size="sm" onClick={() => setEditingSection(null)}>Salvar</Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {profileData.about || 'Adicione informações sobre você.'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Resumo Profissional */}
            <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Resumo Profissional
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingSection(editingSection === 'summary' ? null : 'summary')}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                {editingSection === 'summary' ? (
                  <div className="space-y-3">
                    <textarea
                      value={profileData.summary}
                      onChange={(e) => saveProfileData({ ...profileData, summary: e.target.value })}
                      placeholder="Resumo profissional destacando suas principais competências e objetivos..."
                      className="w-full min-h-[150px] rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/30"
                    />
                    <Button size="sm" onClick={() => setEditingSection(null)}>Salvar</Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {profileData.summary || 'Adicione um resumo profissional.'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Experiência */}
            <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Experiência
                  </h3>
                  <Button variant="outline" size="sm" onClick={handleAddExperience}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-6">
                  {profileData.experiences.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma experiência adicionada ainda.</p>
                  ) : (
                    profileData.experiences.map((exp) => (
                      <div key={exp.id} className="border-l-2 border-primary/30 pl-6 relative">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-2 border-[#050506]"></div>
                        {editingSection === `exp-${exp.id}` ? (
                          <div className="space-y-3">
                            <Input
                              placeholder="Título/Cargo"
                              value={exp.title}
                              onChange={(e) => handleUpdateExperience(exp.id, { title: e.target.value })}
                              className="bg-white/5 border-white/10 text-white"
                            />
                            <Input
                              placeholder="Empresa/Instituição"
                              value={exp.company}
                              onChange={(e) => handleUpdateExperience(exp.id, { company: e.target.value })}
                              className="bg-white/5 border-white/10 text-white"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <select
                                value={exp.type}
                                onChange={(e) => handleUpdateExperience(exp.id, { type: e.target.value as 'academic' | 'professional' | 'internship' | 'research' })}
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
                                className="bg-white/5 border-white/10 text-white"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                type="month"
                                placeholder="Data início"
                                value={exp.startDate}
                                onChange={(e) => handleUpdateExperience(exp.id, { startDate: e.target.value })}
                                className="bg-white/5 border-white/10 text-white"
                              />
                              <div className="flex items-center gap-2">
                                <Input
                                  type="month"
                                  placeholder="Data fim"
                                  value={exp.endDate}
                                  onChange={(e) => handleUpdateExperience(exp.id, { endDate: e.target.value })}
                                  disabled={exp.current}
                                  className="flex-1 bg-white/5 border-white/10 text-white"
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
                                <h4 className="text-lg font-semibold text-white">{exp.title || 'Sem título'}</h4>
                                <p className="text-base text-muted-foreground">{exp.company}</p>
                                <p className="text-sm text-muted-foreground mt-1">
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
                              <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap leading-relaxed">{exp.description}</p>
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
            <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
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
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <Input
                      placeholder="Curso/Grau"
                      value={profileData.academicInfo?.course || ''}
                      onChange={(e) => saveProfileData({
                        ...profileData,
                        academicInfo: { ...(profileData.academicInfo || {} as AcademicInfo), course: e.target.value } as AcademicInfo,
                      })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Período/Ano"
                        value={profileData.academicInfo?.period || ''}
                        onChange={(e) => saveProfileData({
                          ...profileData,
                          academicInfo: { ...(profileData.academicInfo || {} as AcademicInfo), period: e.target.value } as AcademicInfo,
                        })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <select
                        value={profileData.academicInfo?.status || 'studying'}
                        onChange={(e) => saveProfileData({
                          ...profileData,
                          academicInfo: { ...(profileData.academicInfo || {} as AcademicInfo), status: e.target.value as 'studying' | 'completed' | 'paused' } as AcademicInfo,
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
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Input
                        type="month"
                        placeholder="Data de término"
                        value={profileData.academicInfo?.endDate || ''}
                        onChange={(e) => saveProfileData({
                          ...profileData,
                          academicInfo: { ...(profileData.academicInfo || {} as AcademicInfo), endDate: e.target.value } as AcademicInfo,
                        })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <Input
                      placeholder="GPA/Nota (opcional)"
                      value={profileData.academicInfo?.gpa || ''}
                      onChange={(e) => saveProfileData({
                        ...profileData,
                        academicInfo: { ...(profileData.academicInfo || {} as AcademicInfo), gpa: e.target.value } as AcademicInfo,
                      })}
                      className="bg-white/5 border-white/10 text-white"
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
                          <GraduationCap className="h-5 w-5 text-primary" />
                          <span className="text-lg font-semibold">{profileData.academicInfo.course}</span>
                        </div>
                        <p className="text-base text-muted-foreground">{profileData.academicInfo.university}</p>
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
                          <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap leading-relaxed">{profileData.academicInfo.description}</p>
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
            <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Licenças e Certificações
                  </h3>
                  <Button variant="outline" size="sm" onClick={handleAddCertification}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-4">
                  {profileData.certifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma certificação adicionada ainda.</p>
                  ) : (
                    profileData.certifications.map((cert) => (
                      <div key={cert.id} className="border-l-2 border-primary/30 pl-6 relative">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-2 border-[#050506]"></div>
                        {editingSection === `cert-${cert.id}` ? (
                          <div className="space-y-3">
                            <Input
                              placeholder="Nome da certificação"
                              value={cert.name}
                              onChange={(e) => handleUpdateCertification(cert.id, { name: e.target.value })}
                              className="bg-white/5 border-white/10 text-white"
                            />
                            <Input
                              placeholder="Organização emissora"
                              value={cert.issuer}
                              onChange={(e) => handleUpdateCertification(cert.id, { issuer: e.target.value })}
                              className="bg-white/5 border-white/10 text-white"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                type="month"
                                placeholder="Data de emissão"
                                value={cert.date}
                                onChange={(e) => handleUpdateCertification(cert.id, { date: e.target.value })}
                                className="bg-white/5 border-white/10 text-white"
                              />
                              <Input
                                type="month"
                                placeholder="Data de expiração (opcional)"
                                value={cert.expiryDate || ''}
                                onChange={(e) => handleUpdateCertification(cert.id, { expiryDate: e.target.value })}
                                className="bg-white/5 border-white/10 text-white"
                              />
                            </div>
                            <Input
                              placeholder="ID da credencial (opcional)"
                              value={cert.credentialId || ''}
                              onChange={(e) => handleUpdateCertification(cert.id, { credentialId: e.target.value })}
                              className="bg-white/5 border-white/10 text-white"
                            />
                            <Input
                              placeholder="Link (opcional)"
                              value={cert.link || ''}
                              onChange={(e) => handleUpdateCertification(cert.id, { link: e.target.value })}
                              className="bg-white/5 border-white/10 text-white"
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
                                <h4 className="text-lg font-semibold text-white">{cert.name}</h4>
                                <p className="text-base text-muted-foreground">{cert.issuer}</p>
                                <p className="text-sm text-muted-foreground mt-1">
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

            {/* Projetos */}
            {(completedProjects.length > 0 || courseData.projects.filter(p => p.progress > 0 && p.progress < 100).length > 0) && (
              <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
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
                    {[...courseData.projects.filter(p => p.progress > 0).slice(0, 5)].map((project) => (
                      <div key={project.id} className="border-l-2 border-primary/30 pl-6 relative">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-2 border-[#050506]"></div>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-white">{project.title}</h4>
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
              <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Publicações
                    </h3>
                    <Button variant="outline" size="sm" onClick={handleAddPublication}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {profileData.publications.map((pub) => (
                      <div key={pub.id} className="border-l-2 border-primary/30 pl-6 relative">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-2 border-[#050506]"></div>
                        {editingSection === `pub-${pub.id}` ? (
                          <div className="space-y-3">
                            <Input
                              placeholder="Título"
                              value={pub.title}
                              onChange={(e) => handleUpdatePublication(pub.id, { title: e.target.value })}
                              className="bg-white/5 border-white/10 text-white"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <select
                                value={pub.type}
                                onChange={(e) => handleUpdatePublication(pub.id, { type: e.target.value as 'article' | 'paper' | 'poster' | 'book' })}
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
                                className="bg-white/5 border-white/10 text-white"
                              />
                            </div>
                            <Input
                              placeholder="Local/Venue"
                              value={pub.venue}
                              onChange={(e) => handleUpdatePublication(pub.id, { venue: e.target.value })}
                              className="bg-white/5 border-white/10 text-white"
                            />
                            <Input
                              placeholder="Autores (opcional)"
                              value={pub.authors || ''}
                              onChange={(e) => handleUpdatePublication(pub.id, { authors: e.target.value })}
                              className="bg-white/5 border-white/10 text-white"
                            />
                            <Input
                              placeholder="Link (opcional)"
                              value={pub.link || ''}
                              onChange={(e) => handleUpdatePublication(pub.id, { link: e.target.value })}
                              className="bg-white/5 border-white/10 text-white"
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
                                <h4 className="text-lg font-semibold text-white">{pub.title}</h4>
                                <p className="text-base text-muted-foreground">
                                  {pub.type === 'article' ? 'Artigo' : pub.type === 'paper' ? 'Paper' : pub.type === 'poster' ? 'Poster' : 'Livro'} • {pub.venue}
                                </p>
                                {pub.authors && (
                                  <p className="text-sm text-muted-foreground mt-1">Autores: {pub.authors}</p>
                                )}
                                {pub.date && (
                                  <p className="text-sm text-muted-foreground">
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
              <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Informações de Contato Expandidas */}
            <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Informações de Contato</h3>
                <div className="space-y-3">
                  {editingSection === 'contact' ? (
                    <>
                      <Input
                        placeholder="Telefone"
                        value={profileData.phone || ''}
                        onChange={(e) => saveProfileData({ ...profileData, phone: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Input
                        placeholder="Website"
                        value={profileData.website || ''}
                        onChange={(e) => saveProfileData({ ...profileData, website: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Button size="sm" onClick={() => setEditingSection(null)}>Salvar</Button>
                    </>
                  ) : (
                    <>
                      {user?.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{user.email}</span>
                        </div>
                      )}
                      {profileData.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{profileData.phone}</span>
                        </div>
                      )}
                      {profileData.website && (
                        <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                          <Globe className="h-4 w-4" />
                          <span>Website</span>
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
                      <Button variant="ghost" size="sm" onClick={() => setEditingSection('contact')} className="mt-2">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Competências */}
            <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-sm">
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
                    {topCompetences.map((comp) => (
                      <div
                        key={comp.id}
                        className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02] hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{comp.name}</span>
                          <span className="text-xs text-muted-foreground">({comp.currentLevel}/12)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Habilidades */}
            <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Habilidades
                  </h3>
                  <Button variant="outline" size="sm" onClick={handleAddSkill}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {profileData.skills.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma habilidade adicionada ainda.</p>
                  ) : (
                    profileData.skills.map((skill) => (
                      <div key={skill.id} className="flex items-center justify-between p-2 rounded-lg border border-white/5 bg-white/[0.02]">
                        {editingSection === `skill-${skill.id}` ? (
                          <div className="flex-1 flex items-center gap-2">
                            <Input
                              placeholder="Habilidade"
                              value={skill.name}
                              onChange={(e) => handleUpdateSkill(skill.id, { name: e.target.value })}
                              className="flex-1 bg-white/5 border-white/10 text-white"
                            />
                            <select
                              value={skill.category}
                              onChange={(e) => handleUpdateSkill(skill.id, { category: e.target.value as 'technical' | 'soft' | 'language' | 'tool' })}
                              className="rounded-lg border border-white/10 bg-white/5 p-2 text-sm text-white"
                            >
                              <option value="technical">Técnica</option>
                              <option value="soft">Interpessoal</option>
                              <option value="language">Idioma</option>
                              <option value="tool">Ferramenta</option>
                            </select>
                            <Button size="sm" onClick={() => setEditingSection(null)}>Salvar</Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteSkill(skill.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm font-medium text-white">{skill.name}</span>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setEditingSection(`skill-${skill.id}`)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteSkill(skill.id)}>
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

            {/* Idiomas */}
            <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Languages className="h-5 w-5 text-primary" />
                    Idiomas
                  </h3>
                  <Button variant="outline" size="sm" onClick={handleAddLanguage}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {profileData.languages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum idioma adicionado ainda.</p>
                  ) : (
                    profileData.languages.map((lang) => (
                      <div key={lang.id} className="flex items-center justify-between p-2 rounded-lg border border-white/5 bg-white/[0.02]">
                        {editingSection === `lang-${lang.id}` ? (
                          <div className="flex-1 flex items-center gap-2">
                            <Input
                              placeholder="Idioma"
                              value={lang.name}
                              onChange={(e) => handleUpdateLanguage(lang.id, { name: e.target.value })}
                              className="flex-1 bg-white/5 border-white/10 text-white"
                            />
                            <select
                              value={lang.level}
                              onChange={(e) => handleUpdateLanguage(lang.id, { level: e.target.value as 'basic' | 'intermediate' | 'advanced' | 'native' })}
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
                              <span className="text-sm font-medium text-white">{lang.name}</span>
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

            {/* Interesses */}
            <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Interesses
                  </h3>
                  <Button variant="outline" size="sm" onClick={handleAddInterest}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {profileData.interests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum interesse adicionado ainda.</p>
                  ) : (
                    profileData.interests.map((interest) => (
                      <div key={interest.id} className="flex items-center justify-between p-2 rounded-lg border border-white/5 bg-white/[0.02]">
                        {editingSection === `interest-${interest.id}` ? (
                          <div className="flex-1 flex items-center gap-2">
                            <Input
                              placeholder="Interesse"
                              value={interest.name}
                              onChange={(e) => handleUpdateInterest(interest.id, { name: e.target.value })}
                              className="flex-1 bg-white/5 border-white/10 text-white"
                            />
                            <select
                              value={interest.category}
                              onChange={(e) => handleUpdateInterest(interest.id, { category: e.target.value as 'hobby' | 'sport' | 'art' | 'music' | 'other' })}
                              className="rounded-lg border border-white/10 bg-white/5 p-2 text-sm text-white"
                            >
                              <option value="hobby">Hobby</option>
                              <option value="sport">Esporte</option>
                              <option value="art">Arte</option>
                              <option value="music">Música</option>
                              <option value="other">Outro</option>
                            </select>
                            <Button size="sm" onClick={() => setEditingSection(null)}>Salvar</Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteInterest(interest.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              {interest.category === 'sport' && <Gamepad2 className="h-4 w-4 text-muted-foreground" />}
                              {interest.category === 'music' && <Music className="h-4 w-4 text-muted-foreground" />}
                              {interest.category === 'art' && <Sparkles className="h-4 w-4 text-muted-foreground" />}
                              <span className="text-sm font-medium text-white">{interest.name}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setEditingSection(`interest-${interest.id}`)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteInterest(interest.id)}>
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
          </div>
        </div>
      </div>
    </div>
  );
}
