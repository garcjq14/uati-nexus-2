import { memo } from 'react';
import { Handle, Position } from 'reactflow';

interface CustomNodeData {
  label: string;
  type?: string;
  color?: string;
  connecting?: boolean;
}

interface CustomNodeProps {
  data: CustomNodeData;
  selected?: boolean;
  id?: string;
}

function CustomNode({ data, selected }: CustomNodeProps) {
  const nodeType = data.type || 'concept';
  const isConnecting = data.connecting || false;
<<<<<<< HEAD
  
  // Cores inspiradas no Obsidian - tons suaves e minimalistas
  const getNodeColor = () => {
    switch (nodeType) {
      case 'theory':
        return '#5b9bd5'; // Azul suave
      case 'practice':
        return '#70ad47'; // Verde suave
      case 'concept':
      default:
        return '#a5a5a5'; // Cinza neutro (Obsidian usa tons de cinza)
    }
  };
  
  const nodeColor = getNodeColor();
  
  // Design Obsidian: nós pequenos e circulares
  const nodeSize = selected || isConnecting ? 10 : 6;
  const glowSize = selected || isConnecting ? 16 : 8;
  
  return (
    <div className="relative group">
      {/* Label no hover - estilo Obsidian */}
      <div 
        className={`
          absolute left-12 top-1/2 -translate-y-1/2 
          text-white text-xs font-normal whitespace-nowrap
          pointer-events-none
          transition-all duration-150
          ${selected || isConnecting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          z-10
        `}
        style={{ 
          maxWidth: '200px',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {data.label}
      </div>
      
      {/* Nó circular estilo Obsidian */}
      <div
        className="relative transition-all duration-150 cursor-pointer"
        style={{
          width: nodeSize,
          height: nodeSize,
          borderRadius: '50%',
          background: nodeColor,
          boxShadow: selected || isConnecting
            ? `0 0 ${glowSize}px ${nodeColor}80, 0 0 ${glowSize * 0.5}px ${nodeColor}40`
            : `0 0 4px ${nodeColor}30`,
          transform: selected || isConnecting ? 'scale(1.3)' : 'scale(1)',
        }}
      >
        {/* Handles invisíveis no centro */}
=======

  // Cores por tipo (todas circulares para seguir padrão Obsidian)
  const getNodeColor = () => {
    switch (nodeType) {
      case 'theory':
        return '#3b82f6'; // Azul
      case 'practice':
        return '#10b981'; // Verde
      case 'concept':
      default:
        return '#bdbdbd'; // Cinza claro para parecer o grafo do Obsidian
    }
  };

  const nodeColor = data.color || getNodeColor();

  const getCircleStyle = () => {
    const baseSize = selected || isConnecting ? 16 : 12;
    const glow = selected || isConnecting ? '0 0 24px' : '0 0 10px';
    return {
      width: baseSize,
      height: baseSize,
      borderRadius: '50%',
      background: nodeColor,
      boxShadow: `${glow} ${nodeColor}80`,
      transform: selected || isConnecting ? 'scale(1.18)' : 'scale(1)',
      transition: 'all 180ms ease',
      border: '1px solid rgba(255,255,255,0.12)',
    };
  };
  
  return (
    <div className="relative group">
      {/* Label apenas no hover - sem caixinha, texto simples */}
      <div
        className={`
          absolute left-12 top-1/2 -translate-y-1/2
          text-white text-sm sm:text-sm font-medium whitespace-nowrap
          pointer-events-none
          transition-all duration-200
          ${selected || isConnecting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          z-10
        `}
        style={{
          maxWidth: '180px',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7)',
          fontSize: 'clamp(12px, 2.5vw, 14px)',
        }}
      >
        {data.label}
        {isConnecting && (
          <span className="ml-2 text-xs" style={{ color: nodeColor }}>(selecionado)</span>
        )}
      </div>
      
      {/* Nó com forma baseada no tipo */}
      <div
        className={`
          relative transition-all duration-200 cursor-pointer
          ${selected || isConnecting ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-[#0d0d0d]' : ''}
          ${isConnecting ? 'animate-pulse' : ''}
        `}
        style={getCircleStyle()}
      >
        {/* Handles invisíveis no centro para permitir conexão das edges */}
>>>>>>> c315a4020eb8d25b22caf84cc7e3ea2df752fed4
        <Handle
          type="target"
          position={Position.Top}
          className="!opacity-0 !pointer-events-none !border-0 !bg-transparent"
          style={{ width: 1, height: 1, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className="!opacity-0 !pointer-events-none !border-0 !bg-transparent"
          style={{ width: 1, height: 1, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
      </div>
    </div>
  );
}

export default memo(CustomNode);

