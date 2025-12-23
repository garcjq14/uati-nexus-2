import { cn } from '../../lib/utils';

export type ProjectStatus = 'em_progresso' | 'finalizado' | 'planejado';

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline';
  className?: string;
}

const statusConfig = {
  em_progresso: {
    label: 'Em Progresso',
    colors: 'text-[#780606] border-[#780606]/40 bg-[#780606]/10',
  },
  finalizado: {
    label: 'Finalizado',
    colors: 'text-emerald-400 border-emerald-400/40 bg-emerald-500/5',
  },
  planejado: {
    label: 'Planejado',
    colors: 'text-muted-foreground border-white/10 bg-white/[0.02]',
  },
};

const sizeConfig = {
  sm: {
    text: 'text-[10px]',
    padding: 'px-2 py-0.5',
  },
  md: {
    text: 'text-xs',
    padding: 'px-3 py-1',
  },
  lg: {
    text: 'text-sm',
    padding: 'px-4 py-1.5',
  },
};

export function ProjectStatusBadge({
  status,
  size = 'md',
  variant = 'default',
  className,
}: ProjectStatusBadgeProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold uppercase tracking-[0.2em] whitespace-nowrap flex-shrink-0',
        sizeStyles.text,
        sizeStyles.padding,
        variant === 'outline' ? 'bg-transparent' : config.colors,
        className
      )}
      role="status"
      aria-label={`Status do projeto: ${config.label}`}
    >
      {config.label}
    </span>
  );
}

