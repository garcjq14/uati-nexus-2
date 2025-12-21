import React, { useState } from 'react';
import { useDomain } from '../../contexts/DomainContext';
import { useCourse } from '../../contexts/CourseContext';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../lib/api';
import { useToast } from '../feedback/ToastSystem';

interface DomainSelectorProps {
  onDomainChange?: (domainId: string) => void;
  showCurrentDomain?: boolean;
  className?: string;
}

export function DomainSelector({ onDomainChange, showCurrentDomain = true, className }: DomainSelectorProps) {
  const { currentDomain, availableDomains, refreshDomains, loading } = useDomain();
  const { currentCourse, refreshCourseData } = useCourse();
  const { success, error: showError } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const handleDomainSelect = async (domainId: string) => {
    if (!currentCourse) {
      showError('Você precisa ter um curso ativo para alterar o domínio');
      return;
    }

    if (currentCourse.id && domainId === currentDomain?.id) {
      setIsOpen(false);
      return;
    }

    setIsChanging(true);
    try {
      // Atualizar o curso com o novo domainId
      await api.put(`/courses/${currentCourse.id}`, {
        title: currentCourse.title,
        description: currentCourse.description,
        domainId: domainId,
      });

      // Recarregar dados do curso e domínio
      await refreshCourseData();
      await refreshDomains();

      success('Domínio alterado com sucesso');
      setIsOpen(false);
      
      if (onDomainChange) {
        onDomainChange(domainId);
      }
    } catch (error: any) {
      console.error('Failed to change domain:', error);
      showError(error.response?.data?.error || 'Falha ao alterar domínio');
    } finally {
      setIsChanging(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        Carregando domínios...
      </div>
    );
  }

  return (
    <>
      {showCurrentDomain && (
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          className={cn("flex items-center gap-2", className)}
        >
          {currentDomain ? (
            <>
              {currentDomain.icon && (
                <span className="text-lg">{currentDomain.icon}</span>
              )}
              <span>{currentDomain.name}</span>
            </>
          ) : (
            <span>Selecionar Domínio</span>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Selecionar Domínio"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Escolha o domínio de conhecimento para este curso. Isso determinará quais campos e funcionalidades estarão disponíveis.
          </p>

          <div className="grid gap-3">
            {availableDomains.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum domínio disponível. Entre em contato com o administrador.
              </div>
            ) : (
              availableDomains.map((domain) => (
                <Card
                  key={domain.id}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary",
                    currentDomain?.id === domain.id && "border-primary bg-primary/5"
                  )}
                  onClick={() => handleDomainSelect(domain.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {domain.icon && (
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                            style={{
                              backgroundColor: domain.color ? `${domain.color}20` : undefined,
                              color: domain.color || undefined,
                            }}
                          >
                            {domain.icon}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">{domain.name}</h3>
                          {domain.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {domain.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {currentDomain?.id === domain.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {isChanging && (
            <div className="text-center text-sm text-muted-foreground">
              Alterando domínio...
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}




