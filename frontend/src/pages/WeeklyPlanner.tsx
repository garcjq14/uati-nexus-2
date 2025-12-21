import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
import { Input } from '../components/ui/input';
import { Plus, Edit, Trash2, Save, ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../components/feedback/ToastSystem';
import { Skeleton } from '../components/ui/skeleton';

const DAY_LABELS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'] as const;
const ACTIVITY_TYPES = ['Leitura', 'Sprint', 'Estudo', 'Projeto'] as const;

interface WeeklySchedule {
  id: string;
  title: string;
  type: string;
  day: string;
  time?: string;
  description?: string;
  completed: boolean;
  weekStart: string;
}

export default function WeeklyPlanner() {
  const { success, error: showError } = useToast();
  const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(today.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  });
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WeeklySchedule | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Leitura',
    day: 'SEG',
    time: '',
    description: '',
  });

  const getWeekRange = () => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return { start: currentWeekStart, end: weekEnd };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const weekStartISO = currentWeekStart.toISOString();
      const response = await api.get('/weekly-schedule', {
        params: { weekStart: weekStartISO },
      });
      setSchedules(response.data || []);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [currentWeekStart]);

  const handlePreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  };

  const handleNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  };

  const handleToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(today.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    setCurrentWeekStart(weekStart);
  };

  const openCreateModal = (day?: string) => {
    setEditingSchedule(null);
    setFormData({
      title: '',
      type: 'Leitura',
      day: day || 'SEG',
      time: '',
      description: '',
    });
    setShowModal(true);
  };

  const openEditModal = (schedule: WeeklySchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      title: schedule.title,
      type: schedule.type,
      day: schedule.day,
      time: schedule.time || '',
      description: schedule.description || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingSchedule) {
        await api.put(`/weekly-schedule/${editingSchedule.id}`, formData);
        success('Planejamento atualizado!');
      } else {
        await api.post('/weekly-schedule', {
          ...formData,
          weekStart: currentWeekStart.toISOString(),
        });
        success('Planejamento criado!');
      }
      setShowModal(false);
      await fetchSchedules();
    } catch (error) {
      showError('Erro ao salvar planejamento');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este planejamento?')) return;
    try {
      await api.delete(`/weekly-schedule/${id}`);
      success('Planejamento deletado!');
      await fetchSchedules();
    } catch (error) {
      showError('Erro ao deletar planejamento');
    }
  };

  const handleToggleComplete = async (schedule: WeeklySchedule) => {
    try {
      await api.put(`/weekly-schedule/${schedule.id}`, {
        completed: !schedule.completed,
      });
      await fetchSchedules();
    } catch (error) {
      showError('Erro ao atualizar status');
    }
  };

  const getSchedulesForDay = (day: string) => {
    return schedules.filter((s) => s.day === day);
  };

  const getActivityColor = (type: string): string => {
    const colors: Record<string, string> = {
      Leitura: 'text-blue-400',
      Sprint: 'text-[#780606]',
      Estudo: 'text-green-400',
      Projeto: 'text-purple-400',
    };
    return colors[type] || 'text-muted-foreground';
  };

  const getActivityBgColor = (type: string): string => {
    const colors: Record<string, string> = {
      Leitura: 'bg-blue-500/20 border-blue-500/30',
      Sprint: 'bg-[#780606]/20 border-[#780606]/30',
      Estudo: 'bg-green-500/20 border-green-500/30',
      Projeto: 'bg-purple-500/20 border-purple-500/30',
    };
    return colors[type] || 'bg-white/5 border-white/10';
  };

  const weekRange = getWeekRange();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border border-white/5 bg-card rounded-xl">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
                Planejamento Semanal
              </p>
              <CardTitle className="text-white">Planner Semanal</CardTitle>
            </div>
            <Button onClick={() => openCreateModal()} className="bg-[#780606] hover:bg-[#780606]/90">
              <Plus className="mr-2 h-4 w-4" />
              Novo Planejamento
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-white">
                  {formatDate(weekRange.start)} - {formatDate(weekRange.end)}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Hoje
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {DAY_LABELS.map((day) => {
          const daySchedules = getSchedulesForDay(day);
          const isToday = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase() === day;

          return (
            <Card
              key={day}
              className={`border border-white/5 bg-card rounded-xl ${
                isToday ? 'ring-2 ring-primary/50' : ''
              }`}
            >
              <CardHeader className="p-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      {day}
                    </p>
                    <p className="text-xs text-white/60 mt-1">
                      {new Date(
                        currentWeekStart.getTime() +
                          DAY_LABELS.indexOf(day) * 24 * 60 * 60 * 1000
                      ).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => openCreateModal(day)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                {daySchedules.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhum planejamento
                  </p>
                ) : (
                  daySchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className={`p-3 rounded-lg border ${getActivityBgColor(schedule.type)} ${
                        schedule.completed ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-mono uppercase tracking-wider ${getActivityColor(
                                schedule.type
                              )}`}
                            >
                              {schedule.type}
                            </span>
                            {schedule.time && (
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {schedule.time}
                              </div>
                            )}
                          </div>
                          <p
                            className={`text-sm font-medium text-white ${
                              schedule.completed ? 'line-through' : ''
                            }`}
                          >
                            {schedule.title}
                          </p>
                          {schedule.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {schedule.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleComplete(schedule)}
                            className="p-1 rounded hover:bg-white/5"
                            title={schedule.completed ? 'Marcar como não concluído' : 'Marcar como concluído'}
                          >
                            <div
                              className={`h-4 w-4 rounded border-2 ${
                                schedule.completed
                                  ? 'bg-[#780606] border-[#780606]'
                                  : 'border-white/20'
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => openEditModal(schedule)}
                            className="p-1 rounded hover:bg-white/5"
                            title="Editar"
                          >
                            <Edit className="h-3 w-3 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDelete(schedule.id)}
                            className="p-1 rounded hover:bg-white/5"
                            title="Deletar"
                          >
                            <Trash2 className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingSchedule(null);
        }}
        title={editingSchedule ? 'Editar Planejamento' : 'Novo Planejamento'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Título</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nome da atividade"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Tipo</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {ACTIVITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">Dia</label>
              <select
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                {DAY_LABELS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-2 block">Hora (opcional)</label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                placeholder="09:00"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Descrição (opcional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              rows={3}
              placeholder="Descrição da atividade"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setEditingSchedule(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-[#780606] hover:bg-[#780606]/90">
              <Save className="mr-2 h-4 w-4" />
              {editingSchedule ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}




