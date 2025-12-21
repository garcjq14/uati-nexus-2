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

