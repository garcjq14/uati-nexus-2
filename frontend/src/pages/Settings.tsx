import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Settings as SettingsIcon, Moon, Sun, Globe, Bell, Eye, FileText, Type, Layout, CheckCircle2, ChevronDown, ChevronUp, Upload, Save, Download, Trash2, Shield, Lock, Mail, User, Palette, Zap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useCourse } from '../contexts/CourseContext';
import { useToast } from '../components/feedback/ToastSystem';
import { cn } from '../lib/utils';
import api from '../lib/api';

interface DisplayPreferences {
  density: 'compact' | 'comfortable' | 'spacious';
  fontSize: 'small' | 'medium' | 'large';
}

const FAQ_ITEMS = [
  {
    question: 'Como altero meu curso?',
    answer: 'Você pode alterar seu curso a qualquer momento nas Configurações > Conta > Configurações Acadêmicas, ou diretamente na página de Perfil.',
  },
  {
    question: 'Como funcionam os flashcards?',
    answer: 'O sistema de revisão espaçada (SRS) usa um algoritmo que ajusta a frequência de revisão baseado no seu desempenho. Cartas que você acerta aparecem com menos frequência, enquanto as que você erra aparecem mais vezes.',
  },
  {
    question: 'Posso usar o app sem internet?',
    answer: 'O app funciona melhor com conexão à internet para sincronizar seus dados. Algumas funcionalidades podem estar limitadas offline.',
  },
  {
    question: 'Como adiciono um novo projeto?',
    answer: 'Vá para a página de Projetos e clique em "Novo Projeto". Preencha as informações necessárias e comece a trabalhar nas tarefas do projeto.',
  },
  {
    question: 'O que é o Grafo de Conhecimento?',
    answer: 'O Grafo de Conhecimento permite visualizar conexões entre diferentes conceitos que você está aprendendo. Isso ajuda a entender como os tópicos se relacionam entre si.',
  },
  {
    question: 'Como funciona o sistema de notas (Zettelkasten)?',
    answer: 'O Zettelkasten é um método de tomada de notas que enfatiza conexões entre ideias. Cada nota pode ser conectada a outras, criando uma rede de conhecimento interligada.',
  },
];

const NAV_SECTIONS = [
  {
    id: 'general',
    label: 'Geral',
    description: 'Idioma, notificações e comportamento',
    icon: SettingsIcon,
  },
  {
    id: 'account',
    label: 'Conta',
    description: 'Dados pessoais e cursos',
    icon: User,
  },
  {
    id: 'appearance',
    label: 'Aparência',
    description: 'Densidade e tipografia',
    icon: Palette,
  },
  {
    id: 'help',
    label: 'Ajuda',
    description: 'FAQ e exclusões',
    icon: FileText,
  },
] as const;

type SectionKey = (typeof NAV_SECTIONS)[number]['id'];

export default function Settings() {
  const { theme } = useTheme();
  const { user, refreshUser } = useUser();
  const { currentCourse, courses, deleteCourse, refreshCourseData, refreshCourses } = useCourse();
  const { success, error: showError } = useToast();
  
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'pt';
  });
  
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : { push: true, email: false, sound: true };
  });
  
  const [displayPrefs, setDisplayPrefs] = useState<DisplayPreferences>(() => {
    const saved = localStorage.getItem('displayPreferences');
    return saved ? JSON.parse(saved) : { density: 'comfortable', fontSize: 'medium' };
  });
  
  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    const saved = localStorage.getItem('animationsEnabled');
    return saved ? JSON.parse(saved) : true;
  });
  
  const [autoSave, setAutoSave] = useState(() => {
    const saved = localStorage.getItem('autoSave');
    return saved ? JSON.parse(saved) : true;
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [emailData, setEmailData] = useState({ newEmail: '' });
  const [portfolioUrl, setPortfolioUrl] = useState(user?.portfolio || '');
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    linkedin: user?.linkedin || '',
    github: user?.github || '',
    twitter: user?.twitter || '',
  });
  const [saving, setSaving] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletingCourse, setDeletingCourse] = useState(false);
  const [courseDeleteConfirm, setCourseDeleteConfirm] = useState<Record<string, string>>({});
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>('general');

  const handleDeleteCourse = async () => {
    if (!currentCourse) {
      showError('Nenhum curso ativo para excluir.');
      return;
    }

    setDeletingCourse(true);
    try {
      await deleteCourse(currentCourse.id);
      await refreshCourses();
      await refreshCourseData();
      setDeleteConfirm('');
      success('Curso excluído com sucesso.');
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string; message?: string } } }).response?.data?.message ||
            (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      showError(message || 'Não foi possível excluir o curso.');
      console.error('Delete course failed:', error);
    } finally {
      setDeletingCourse(false);
    }
  };

  const handleCourseConfirmChange = (courseId: string, value: string) => {
    setCourseDeleteConfirm((prev) => ({ ...prev, [courseId]: value }));
  };

  const handleDeleteCourseById = async (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) {
      showError('Curso não encontrado.');
      return;
    }

    setDeletingCourseId(courseId);
    try {
      await deleteCourse(courseId);
      await refreshCourses();
      await refreshCourseData();
      setCourseDeleteConfirm((prev) => ({ ...prev, [courseId]: '' }));
      success(`Curso "${course.title}" removido.`);
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string; message?: string } } }).response?.data?.message ||
            (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      showError(message || 'Não foi possível remover o curso.');
      console.error('Delete specific course failed:', error);
    } finally {
      setDeletingCourseId(null);
    }
  };

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('animationsEnabled', JSON.stringify(animationsEnabled));
    document.documentElement.setAttribute('data-animations', animationsEnabled.toString());
  }, [animationsEnabled]);

  useEffect(() => {
    localStorage.setItem('autoSave', JSON.stringify(autoSave));
  }, [autoSave]);

  useEffect(() => {
    // Apply display preferences to document
    document.documentElement.setAttribute('data-density', displayPrefs.density);
    document.documentElement.setAttribute('data-font-size', displayPrefs.fontSize);
    localStorage.setItem('displayPreferences', JSON.stringify(displayPrefs));
  }, [displayPrefs]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        linkedin: user.linkedin || '',
        github: user.github || '',
        twitter: user.twitter || '',
      });
      setPortfolioUrl(user.portfolio || '');
    }
  }, [user]);

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('As senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setSaving(true);
    try {
      await api.put('/user/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      success('Senha alterada com sucesso!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      showError(errorMessage || 'Erro ao alterar senha');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async () => {
    if (!emailData.newEmail || !emailData.newEmail.includes('@')) {
      showError('Por favor, insira um email válido');
      return;
    }

    setSaving(true);
    try {
      await api.put('/user/email', emailData);
      success('Email alterado com sucesso!');
      setEmailData({ newEmail: '' });
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      showError(errorMessage || 'Erro ao alterar email');
    } finally {
      setSaving(false);
    }
  };

  const handlePortfolioSave = async () => {
    setSaving(true);
    try {
      await api.put('/user', { portfolio: portfolioUrl });
      success('Portfólio atualizado com sucesso!');
      await refreshUser();
    } catch (error) {
      showError('Erro ao salvar portfólio');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      await api.put('/user', profileData);
      success('Perfil atualizado com sucesso!');
      await refreshUser();
    } catch (error) {
      showError('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleExportSettings = () => {
    const settings = {
      language,
      notifications,
      displayPrefs,
      animationsEnabled,
      autoSave,
    };
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'uati-nexus-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    success('Configurações exportadas com sucesso!');
  };

  const handleResetSettings = () => {
    if (window.confirm('Tem certeza que deseja resetar todas as configurações? Esta ação não pode ser desfeita.')) {
      localStorage.removeItem('language');
      localStorage.removeItem('notifications');
      localStorage.removeItem('displayPreferences');
      localStorage.removeItem('animationsEnabled');
      localStorage.removeItem('autoSave');
      window.location.reload();
    }
  };

  return (
    <div className="mx-auto space-y-8 px-4 py-8 sm:space-y-10 max-w-6xl">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#120505] via-[#050202] to-[#050505] p-6 sm:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-primary">Preferências</p>
            <h1 className="text-3xl font-serif font-light text-white">Configurações do Nexus</h1>
            <p className="mt-2 text-sm text-white/70">
              Ajuste notificações, aparência e dados da sua conta em um único painel.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" className="gap-2 text-white" onClick={handleExportSettings}>
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-white/20 text-red-300 hover:border-red-400 hover:text-red-200"
              onClick={handleResetSettings}
            >
              <Trash2 className="h-4 w-4" />
              Resetar
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-white/60">Idioma</p>
            <p className="mt-2 text-xl font-semibold text-white">{language === 'pt' ? 'Português' : 'English'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-white/60">Auto save</p>
            <p className="mt-2 text-xl font-semibold text-white">{autoSave ? 'Ativo' : 'Inativo'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-white/60">Notificações</p>
            <p className="mt-2 text-xl font-semibold text-white">
              {Object.values(notifications).filter(Boolean).length}/3
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-white/60">Tema</p>
            <p className="mt-2 text-xl font-semibold text-white">{theme === 'dark' ? 'Modo escuro' : 'Modo claro'}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
        <nav className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          {NAV_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'w-full rounded-2xl border px-4 py-3 text-left transition-all',
                  isActive
                    ? 'border-primary/50 bg-primary/10 text-white shadow-lg shadow-primary/10'
                    : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('rounded-full p-2', isActive ? 'bg-primary/20' : 'bg-white/5')}>
                    <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-white/60')} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{section.label}</p>
                    <p className="text-xs text-white/60">{section.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="space-y-6">
          {activeSection === 'general' && (
            <Card className="border-white/5 bg-white/[0.02] backdrop-blur">
              <CardHeader className="border-b border-white/5">
                <div className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5 text-primary" />
                  <CardTitle>Configurações Gerais</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                      <Globe className="h-4 w-4" />
                      Idioma
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="pt">Português</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-wide text-white/60">Estado da conta</p>
                    <p className="text-sm text-white/70">
                      {user?.email ? `Logado como ${user.email}` : 'Você ainda não informou um email.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                    <Bell className="h-4 w-4" />
                    Notificações
                  </label>
                  <div className="space-y-4 rounded-lg border border-white/5 bg-white/[0.02] p-4">
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, push: checked })
                      }
                      label="Notificações Push"
                      description="Receba notificações no navegador"
                    />
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, email: checked })
                      }
                      label="Notificações por Email"
                      description="Receba atualizações importantes por email"
                    />
                    <Switch
                      checked={notifications.sound}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, sound: checked })
                      }
                      label="Sons de Notificação"
                      description="Reproduzir sons ao receber notificações"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                    <Zap className="h-4 w-4" />
                    Desempenho e comportamento
                  </label>
                  <div className="space-y-4 rounded-lg border border-white/5 bg-white/[0.02] p-4">
                    <Switch
                      checked={animationsEnabled}
                      onCheckedChange={setAnimationsEnabled}
                      label="Animações"
                      description="Ativar animações e transições suaves"
                    />
                    <Switch
                      checked={autoSave}
                      onCheckedChange={setAutoSave}
                      label="Salvamento Automático"
                      description="Salvar alterações automaticamente"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                    <Download className="h-4 w-4" />
                    Gerenciamento de dados
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      variant="outline"
                      onClick={handleExportSettings}
                      className="flex-1 gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Exportar Configurações
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleResetSettings}
                      className="flex-1 gap-2 text-red-400 hover:text-red-300 hover:border-red-500/50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Resetar Tudo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'account' && (
            <>
              <Card className="border-white/5 bg-white/[0.02] backdrop-blur">
                <CardHeader className="border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <CardTitle>Configurações de Conta</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
              {/* Name */}
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <label className="text-sm font-medium text-white">Nome</label>
                </div>
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Seu nome"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  />
                  <Button variant="default" onClick={handleProfileSave} disabled={saving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar Nome'}
                  </Button>
                </div>
              </div>

              {/* Profile Picture */}
              <div>
                <label className="mb-3 block text-sm font-medium text-white">
                  Foto de Perfil
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <img
                      src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=780606&color=fff`}
                      alt={user?.name}
                      className="h-20 w-20 rounded-full border-2 border-primary/30 object-cover transition-all group-hover:border-primary"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Upload className="h-5 w-5 text-white" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!file.type.startsWith('image/')) {
                          showError('Por favor, selecione uma imagem válida.');
                          e.target.value = ''; // Reset input
                          return;
                        }
                        if (file.size > 5 * 1024 * 1024) {
                          showError('A imagem deve ter no máximo 5MB.');
                          e.target.value = ''; // Reset input
                          return;
                        }
                        setSaving(true);
                        try {
                          // Convert file to base64
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            try {
                              const base64String = reader.result as string;
                              await api.post('/user/avatar', { avatar: base64String });
                              success('Avatar atualizado com sucesso!');
                              // Refresh user to get updated avatar
                              await refreshUser();
                            } catch {
                              showError('Erro ao fazer upload do avatar.');
                            } finally {
                              setSaving(false);
                              // Reset input to allow selecting the same file again
                              e.target.value = '';
                            }
                          };
                          reader.onerror = () => {
                            showError('Erro ao ler o arquivo. Tente novamente.');
                            setSaving(false);
                            e.target.value = '';
                          };
                          reader.readAsDataURL(file);
                        } catch {
                          showError('Erro ao fazer upload do avatar.');
                          setSaving(false);
                          e.target.value = '';
                        }
                      }}
                      className="hidden"
                      id="avatar-upload"
                      aria-label="Upload avatar image"
                    />
                  </div>
                  <div className="flex-1">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={saving}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {saving ? 'Enviando...' : 'Alterar Foto'}
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Change Password */}
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <label className="text-sm font-medium text-white">Alterar Senha</label>
                </div>
                <div className="space-y-3">
                  <Input
                    type="password"
                    placeholder="Senha atual"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                  />
                  <Input
                    type="password"
                    placeholder="Nova senha"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                  />
                  <Input
                    type="password"
                    placeholder="Confirmar nova senha"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                  />
                  <Button variant="default" onClick={handlePasswordChange} disabled={saving} className="gap-2">
                    <Shield className="h-4 w-4" />
                    {saving ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </div>
              </div>

              {/* Change Email */}
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <label className="text-sm font-medium text-white">Alterar Email</label>
                </div>
                <div className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Novo email"
                    value={emailData.newEmail}
                    onChange={(e) => setEmailData({ newEmail: e.target.value })}
                  />
                  <Button variant="default" onClick={handleEmailChange} disabled={saving} className="gap-2">
                    <Mail className="h-4 w-4" />
                    {saving ? 'Alterando...' : 'Alterar Email'}
                  </Button>
                </div>
              </div>

              {/* Social Links */}
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <label className="text-sm font-medium text-white">
                    Links Sociais
                  </label>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-2 block text-xs text-muted-foreground">LinkedIn</label>
                    <Input
                      type="url"
                      placeholder="https://linkedin.com/in/seu-perfil"
                      value={profileData.linkedin}
                      onChange={(e) => setProfileData({ ...profileData, linkedin: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs text-muted-foreground">GitHub</label>
                    <Input
                      type="url"
                      placeholder="https://github.com/seu-usuario"
                      value={profileData.github}
                      onChange={(e) => setProfileData({ ...profileData, github: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs text-muted-foreground">Twitter</label>
                    <Input
                      type="url"
                      placeholder="https://twitter.com/seu-usuario"
                      value={profileData.twitter}
                      onChange={(e) => setProfileData({ ...profileData, twitter: e.target.value })}
                    />
                  </div>
                  <Button variant="default" onClick={handleProfileSave} disabled={saving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar Links'}
                  </Button>
                </div>
              </div>

              {/* Portfolio */}
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <label className="text-sm font-medium text-white">
                    Link para Portfólio Público
                  </label>
                </div>
                <div className="space-y-3">
                  <Input
                    type="url"
                    placeholder="https://github.com/seu-usuario"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                  />
                  <Button variant="default" onClick={handlePortfolioSave} disabled={saving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar Portfólio'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Management */}
          <Card className="border-white/5 bg-white/[0.02] backdrop-blur-sm">
            <CardHeader className="border-b border-white/5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <CardTitle>Gerenciar Cursos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {courses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum curso cadastrado. Crie um novo curso para começar.
                </p>
              ) : (
                <div className="space-y-4">
                  {courses.map((course) => {
                    const isCurrent = currentCourse?.id === course.id;
                    const confirmValue = courseDeleteConfirm[course.id] || '';

                    return (
                      <div
                        key={course.id}
                        className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <p className="text-white font-medium flex items-center gap-2">
                              {course.title}
                              {isCurrent && (
                                <span className="text-xs uppercase tracking-wide text-primary bg-primary/10 border border-primary/30 rounded-full px-2 py-0.5">
                                  Atual
                                </span>
                              )}
                            </p>
                            {course.description && (
                              <p className="text-sm text-muted-foreground">{course.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Criado em {new Date(course.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Input
                              value={confirmValue}
                              onChange={(e) => handleCourseConfirmChange(course.id, e.target.value)}
                              placeholder="digite EXCLUIR"
                              className="bg-white/5 border-white/10 text-white sm:w-40"
                            />
                            <Button
                              variant="outline"
                              onClick={() => handleDeleteCourseById(course.id)}
                              disabled={
                                confirmValue.toLowerCase() !== 'excluir' || deletingCourseId === course.id
                              }
                              className="gap-2 bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                              {deletingCourseId === course.id ? 'Excluindo...' : 'Remover'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
            </>
          )}

        {activeSection === 'appearance' && (
          <Card className="border-white/5 bg-white/[0.02] backdrop-blur">
            <CardHeader className="border-b border-white/5">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle>Aparência</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <label className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                  <Moon className="h-4 w-4" />
                  Tema
                </label>
                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                  <Moon className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground">Modo Escuro</span>
                  <span className="ml-auto text-xs text-muted-foreground">Sempre ativo</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                  <Eye className="h-4 w-4" />
                  Preferências de Exibição
                </label>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Layout className="h-3 w-3" />
                    Densidade da Interface
                  </label>
                  <div className="flex gap-2">
                    {(['compact', 'comfortable', 'spacious'] as const).map((density) => (
                      <button
                        key={density}
                        onClick={() => setDisplayPrefs({ ...displayPrefs, density })}
                        className={cn(
                          'flex-1 rounded-lg border px-4 py-2 text-xs capitalize transition-all',
                          displayPrefs.density === density
                            ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                            : 'border-white/10 bg-white/[0.02] text-muted-foreground hover:bg-white/5 hover:text-white'
                        )}
                      >
                        {density === 'compact' ? 'Compacta' : density === 'comfortable' ? 'Confortável' : 'Espaçosa'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Type className="h-3 w-3" />
                    Tamanho da Fonte
                  </label>
                  <div className="flex gap-2">
                    {(['small', 'medium', 'large'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setDisplayPrefs({ ...displayPrefs, fontSize: size })}
                        className={cn(
                          'flex-1 rounded-lg border px-4 py-2 text-xs capitalize transition-all',
                          displayPrefs.fontSize === size
                            ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                            : 'border-white/10 bg-white/[0.02] text-muted-foreground hover:bg-white/5 hover:text-white'
                        )}
                      >
                        {size === 'small' ? 'Pequeno' : size === 'medium' ? 'Médio' : 'Grande'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help */}
        {activeSection === 'help' && (
          <Card className="border-white/5 bg-white/[0.02] backdrop-blur">
            <CardHeader className="border-b border-white/5">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>Ajuda e Suporte</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
                  <FileText className="h-4 w-4" />
                  Perguntas Frequentes
                </h3>
                <div className="space-y-2">
                  {FAQ_ITEMS.map((item, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-lg border border-border/30 bg-background/30 transition-all hover:border-border/50"
                    >
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-background/50"
                      >
                        <span className="pr-4 text-sm font-medium text-white">{item.question}</span>
                        {expandedFAQ === index ? (
                          <ChevronUp className="h-4 w-4 text-primary flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </button>
                      {expandedFAQ === index && (
                        <div className="border-t border-border/30 px-4 pb-4 pt-4">
                          <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border/30 bg-background/30 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-white">
                  <FileText className="h-4 w-4" />
                  Documentação
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Acesse os documentos mestres para mais informações sobre o sistema.
                </p>
                <Button variant="outline" asChild className="gap-2">
                  <Link to="/documents">
                    <FileText className="h-4 w-4" />
                    Ver Documentos Mestres
                  </Link>
                </Button>
              </div>

              <div className="rounded-lg border border-red-900/40 bg-red-900/10 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
                  <Trash2 className="h-4 w-4 text-red-400" />
                  Excluir curso
                </h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Esta ação remove o curso atual e seus dados associados. Digite <span className="text-white font-semibold">excluir</span> para confirmar.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="excluir"
                    className="w-40 bg-white/5 border-white/10 text-white"
                  />
                  <Button
                    variant="outline"
                    onClick={handleDeleteCourse}
                    disabled={deleteConfirm !== 'excluir' || deletingCourse}
                    className="gap-2 bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingCourse ? 'Excluindo...' : 'Excluir curso'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}
