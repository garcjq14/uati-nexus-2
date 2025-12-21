import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Maximize2, Minimize2, Download } from 'lucide-react';
import { Button } from '../ui/button';
import CustomNode from './CustomNode';
import ReactFlow, { useReactFlow, ReactFlowProvider, Background, Controls } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

const nodeTypes = {
  custom: CustomNode,
};

interface GraphPresentationModeProps {
  nodes: Node[];
  edges: Edge[];
  isActive: boolean;
  onExit: () => void;
}

function PresentationContent({
  nodes,
  edges,
  onExit,
}: {
  nodes: Node[];
  edges: Edge[];
  onExit: () => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { fitView } = useReactFlow();

  // Fit view when nodes are loaded
  useEffect(() => {
    if (nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 400 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, fitView]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleExport = () => {
    // Export graph as PNG
    const canvas = document.querySelector('.react-flow__viewport canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'knowledge-graph.png';
      link.href = url;
      link.click();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background"
    >
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleFullscreen}
          className="bg-background/80 backdrop-blur-sm"
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExit}
          className="bg-background/80 backdrop-blur-sm"
        >
          Sair
        </Button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        className="bg-[#0d0d0d]"
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        minZoom={0.1}
        maxZoom={8}
        defaultEdgeOptions={{ type: 'straight', animated: false }}
        style={{ width: '100%', height: '100%' }}
      >
        <Background color="#1a1a1a" gap={16} size={1} style={{ opacity: 0.3 }} />
        <Controls className="bg-black/80 border-white/10 fill-white text-white" />
      </ReactFlow>
    </motion.div>
  );
}

export function GraphPresentationMode({
  nodes,
  edges,
  isActive,
  onExit,
}: GraphPresentationModeProps) {
  if (!isActive) return null;

  return (
    <ReactFlowProvider>
      <PresentationContent nodes={nodes} edges={edges} onExit={onExit} />
    </ReactFlowProvider>
  );
}
