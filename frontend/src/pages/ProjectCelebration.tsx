import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Trophy, ExternalLink, Share2, Clock, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../lib/api';
import { motion } from 'framer-motion';

export default function ProjectCelebration() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProject();
      calculateTotalTime();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalTime = async () => {
    try {
      // Calculate from study sessions associated with this project
      const response = await api.get('/timer/history');
      // Filter and sum time for this project (simplified)
      setTotalTime(120); // Mock data - would calculate from actual sessions
    } catch (error) {
      console.error('Failed to calculate time:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share && project) {
      try {
        await navigator.share({
          title: `Concluí o projeto: ${project.title}`,
          text: `Acabei de finalizar o projeto ${project.title} no UATI Nexus!`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  if (loading || !project) {
    return <div className="text-center text-muted-foreground">Carregando...</div>;
  }

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} minutos`;
    if (hours < 24) return `${hours.toFixed(1)} horas`;
    return `${Math.floor(hours / 24)} dias e ${(hours % 24).toFixed(1)} horas`;
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl space-y-6"
      >
        {/* Celebration Header */}
        <Card className="border-2 border-success bg-success/10">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <Trophy className="mx-auto h-24 w-24 text-success mb-4" />
            </motion.div>
            <h1 className="text-4xl font-serif font-bold mb-2">Parabéns!</h1>
            <p className="text-xl text-muted-foreground mb-6">
              Você concluiu o projeto <span className="font-semibold text-foreground">{project.title}</span>
            </p>
            <div className="flex gap-4">
              <Button variant="default" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar
              </Button>
              <Button variant="outline" onClick={() => navigate('/projects')}>
                Ver Outros Projetos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle>Tempo Total</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatTime(totalTime)}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Tempo investido neste projeto
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>Data de Conclusão</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {new Date(project.updatedAt).toLocaleDateString('pt-BR')}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Quando você finalizou o projeto
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Repository Link */}
        {project.repository && (
          <Card>
            <CardHeader>
              <CardTitle>Repositório Final</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="default" className="w-full" asChild>
                <a href={project.repository} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir no GitHub
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Project Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.description && (
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-muted-foreground">{project.description}</p>
              </div>
            )}
            {project.technologies && project.technologies.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Tecnologias Utilizadas</h3>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech: string, index: number) => (
                    <span
                      key={index}
                      className="rounded-full bg-primary/20 px-3 py-1 text-sm text-primary"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

