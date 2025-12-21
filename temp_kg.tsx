import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
import { Input } from '../components/ui/input';
import { Plus, Maximize2, ZoomIn, ZoomOut, Focus, Search, HelpCircle, Download, Edit, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { ContextualHelp } from '../components/help/ContextualHelp';
import { useToast } from '../components/feedback/ToastSystem';
import { GraphPresentationMode } from '../components/knowledge/GraphPresentationMode';
import CustomNode from '../components/knowledge/CustomNode';
import ReactFlow, {
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Panel,
  Controls,
  MiniMap
} from 'reactflow';
import type { NodeDragHandler } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import api from '../lib/api';
import 'reactflow/dist/style.css';

// Registrar o tipo de n├│ customizado
const nodeTypes = {
  custom: CustomNode,
};

interface KnowledgeNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  connectionsFrom: unknown[];
  connectionsTo: unknown[];
}

function GraphContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [nodeForConnection, setNodeForConnection] = useState<Node | null>(null); // N├│ selecionado para conectar
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingConnection, setDeletingConnection] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPresentationMode, setShowPresentationMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNodeLabel, setEditNodeLabel] = useState('');
  const [editNodeType, setEditNodeType] = useState('concept');
  const [updatingNode, setUpdatingNode] = useState(false);
  const [deletingNode, setDeletingNode] = useState(false);
  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();
  const { success, error: showError } = useToast();
  const positionUpdateTimeoutRef = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});

  // Filtered nodes
  const filteredNodes = useMemo(() => {
      if (!searchQuery) return nodes;
      return nodes.filter((n: Node) => n.data.label.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [nodes, searchQuery]);

  // Highlight filtered nodes
  useEffect(() => {
     setNodes((nds: Node[]) => nds.map((n: Node) => {
        const isMatch = !searchQuery || n.data.label.toLowerCase().includes(searchQuery.toLowerCase());
        return {
           ...n,
           style: {
              ...n.style,
              opacity: isMatch ? 1 : 0.2,
           }
        };
     }));
  }, [searchQuery, setNodes]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
     if (e.key === 'Enter' && filteredNodes.length > 0) {
        const node = filteredNodes[0];
        setCenter(node.position.x, node.position.y, { zoom: 1.5, duration: 800 });
        setSelectedNode(node);
     }
  };

  // Fun├º├úo para obter cor baseada no tipo do n├│
  const getNodeColor = (type?: string): string => {
    switch (type) {
      case 'theory':
        return '#3b82f6'; // Azul
      case 'practice':
        return '#10b981'; // Verde
      case 'concept':
      default:
        return '#780606'; // Vermelho do branding
    }
  };

  // Function to fetch and load knowledge graph
  const fetchKnowledgeGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/knowledge-graph');
      const knowledgeNodes = response.data || [];
      

      // Calcular posi├º├Áes autom├íticas se n├úo existirem (layout circular inicial)
      const hasPositions = knowledgeNodes.some((n: KnowledgeNode) => n.x !== 0 || n.y !== 0);
      
      const flowNodes: Node[] = knowledgeNodes.map((node: KnowledgeNode, index: number) => {
        const nodeType = node.type || 'concept';
        const nodeColor = getNodeColor(nodeType);
        const hasPosition = node.x !== 0 || node.y !== 0;
        
        // Se n├úo tem posi├º├úo salva, usar layout circular
        let position = { x: node.x, y: node.y };
        if (!hasPosition && !hasPositions) {
          const angle = (index / knowledgeNodes.length) * 2 * Math.PI;
          const radius = Math.min(400, knowledgeNodes.length * 15);
          position = {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
          };
        }
        
        return {
          id: node.id,
          type: 'custom',
          position,
          data: { 
            label: node.label, 
            type: nodeType,
            color: nodeColor,
          },
        };
      });

      const flowEdges: Edge[] = [];
      const edgeIds = new Set<string>(); // Para evitar duplicatas
      const connectionIds = new Set<string>(); // Para evitar duplicatas por ID de conex├úo
      
      // Criar um mapa de cores dos n├│s para acesso r├ípido
      const nodeColorMap = new Map<string, string>();
      flowNodes.forEach((node: Node) => {
        nodeColorMap.set(node.id, node.data?.color || '#6b7280');
      });
      
      knowledgeNodes.forEach((node: KnowledgeNode) => {
        // Process connectionsFrom (outgoing connections)
        if (node.connectionsFrom && Array.isArray(node.connectionsFrom)) {
          node.connectionsFrom.forEach((conn: unknown) => {
            const connection = conn as { 
              id?: string;
              toNodeId?: string; 
              toNode?: { id: string } 
            };
            const targetId = connection.toNodeId || connection.toNode?.id;
            const connectionId = connection.id;
            
            if (targetId && typeof targetId === 'string') {
              const edgeId = `e${node.id}-${targetId}`;
              // Evitar duplicatas: verificar tanto pelo edgeId quanto pelo connectionId
              if (!edgeIds.has(edgeId) && (!connectionId || !connectionIds.has(connectionId))) {
                edgeIds.add(edgeId);
                if (connectionId) {
                  connectionIds.add(connectionId);
                }
                
                flowEdges.push({
                  id: edgeId,
                  source: node.id,
                  target: targetId,
                  data: {
                    connectionId: connectionId, // Armazenar ID da conex├úo para poder deletar
                  },
                  style: { 
                    stroke: '#6b7280', 
                    strokeWidth: 1, 
                    opacity: 0.5,
                  },
                  animated: false,
                  type: 'straight',
                });
              }
            }
          });
        }
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error('Error fetching knowledge graph:', error);
      const axiosError = error as { 
        response?: { status?: number; data?: { error?: string } };
      };
      
      // If 404, just show empty graph (no major selected)
      if (axiosError.response?.status === 404) {
        setNodes([]);
        setEdges([]);
      } else {
        setError('Erro ao carregar o grafo de conhecimento');
        setNodes([]);
        setEdges([]);
      }
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  const handleExportGraph = () => {
    // Export as JSON
    const graphData = {
      nodes: nodes.map((n: Node) => ({
        id: n.id,
        label: n.data.label,
        type: n.data.type,
        position: n.position,
      })),
      edges: edges.map((e: Edge) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
    };
    const dataStr = JSON.stringify(graphData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'knowledge-graph.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Fun├º├úo para criar conex├úo entre dois n├│s
  const createConnection = useCallback(
    async (sourceId: string, targetId: string) => {
      if (sourceId === targetId) {
        showError('N├úo ├® poss├¡vel conectar um n├│ a si mesmo');
        return;
      }

      // Verificar se a conex├úo j├í existe (em ambas as dire├º├Áes para garantir)
      const edgeExists = edges.some(
        (e: Edge) => (e.source === sourceId && e.target === targetId) ||
             (e.source === targetId && e.target === sourceId)
      );
      
      if (edgeExists) {
        showError('Esta conex├úo j├í existe');
        setNodeForConnection(null);
        setSelectedNode(null);
        setNodes((nds: Node[]) =>
          nds.map((n: Node) => ({
            ...n,
            selected: false,
            data: { ...n.data, connecting: false },
          }))
        );
        return;
      }

      // Adicionar edge temporariamente
      const newEdge: Edge = {
        id: `e${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        data: {
          connectionId: undefined, // Ser├í preenchido ap├│s criar a conex├úo
        },
        style: { 
          stroke: '#4a4a4a', 
          strokeWidth: 1.5, 
          opacity: 0.4,
        },
        animated: false,
        type: 'straight',
      };
      
      setEdges((eds: Edge[]) => [...eds, newEdge]);
      
      try {
        const response = await api.post('/knowledge-graph/connections', {
          fromNodeId: sourceId,
          toNodeId: targetId,
        });
        // Atualizar a edge com o ID da conex├úo
        setEdges((eds: Edge[]) =>
          eds.map((e: Edge) =>
            e.id === newEdge.id
              ? { ...e, data: { connectionId: response.data.id } }
              : e
          )
        );
        success('Conex├úo criada com sucesso!');
      } catch (error) {
        console.error('Failed to save connection:', error);
        const axiosError = error as { response?: { data?: { error?: string } } };
        const errorMessage = axiosError?.response?.data?.error || 'Erro ao criar conex├úo';
        showError(errorMessage);
        // Remove the edge from UI if connection failed
        setEdges((eds: Edge[]) => eds.filter((e: Edge) => e.id !== newEdge.id));
      }
    },
    [edges, setEdges, setNodes, success, showError]
  );

  // Desabilitar conex├úo por arrastar
  const onConnect = useCallback(() => {
    // N├úo fazer nada - conex├Áes s├úo feitas por clique
  }, []);

  // Load knowledge graph data directly from API
  useEffect(() => {
    fetchKnowledgeGraph();
  }, [fetchKnowledgeGraph]);

  // Fit view when nodes are loaded
  useEffect(() => {
    if (nodes.length > 0) {
      // Small delay to ensure ReactFlow is rendered
      const timer = setTimeout(() => {
        try {
          fitView({ padding: 0.2, duration: 400 });
        } catch (error) {
          console.warn('Failed to fit view:', error);
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, fitView]);

  const handleAddNode = async () => {
    if (!newNodeLabel.trim()) {
      showError('Por favor, informe um nome para o n├│');
      return;
    }

    setSaving(true);
    try {
      const response = await api.post('/knowledge-graph', {
        label: newNodeLabel.trim(),
        type: 'concept',
        x: Math.random() * 400 - 200,
        y: Math.random() * 400 - 200,
      });

      // Cor baseada no tipo do n├│
      const nodeType = 'concept';
      const nodeColor = getNodeColor(nodeType);
      const newNode = {
        id: response.data.id,
        type: 'custom' as const,
        position: { x: response.data.x || 0, y: response.data.y || 0 },
        data: { 
          label: response.data.label, 
          type: nodeType,
          color: nodeColor,
        },
      };

      setNodes((prev: Node[]) => [...prev, newNode]);
      setNewNodeLabel('');
      success('N├│ criado com sucesso!');
    } catch (error) {
      console.error('Failed to add node:', error);
      const axiosError = error as { response?: { data?: { error?: string } } };
      const errorMessage = axiosError?.response?.data?.error || 'Erro ao criar n├│';
      showError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Save node position when dragged
  const onNodeDragStop: NodeDragHandler = useCallback(
    async (_event: React.MouseEvent, node: Node) => {
      // Clear any pending update for this node
      if (positionUpdateTimeoutRef.current[node.id]) {
        clearTimeout(positionUpdateTimeoutRef.current[node.id]);
      }

      // Debounce position updates
      positionUpdateTimeoutRef.current[node.id] = setTimeout(async () => {
        try {
          await api.put(`/knowledge-graph/${node.id}`, {
            x: node.position.x,
            y: node.position.y,
          });
        } catch (error) {
          console.error('Failed to save node position:', error);
          const axiosError = error as { response?: { data?: { error?: string } } };
          const errorMessage = axiosError?.response?.data?.error || 'Erro ao salvar posi├º├úo';
          showError(errorMessage);
        }
        delete positionUpdateTimeoutRef.current[node.id];
      }, 500);
    },
    [showError]
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeouts = positionUpdateTimeoutRef.current;
    return () => {
      Object.values(timeouts).forEach((timeout) => {
        clearTimeout(timeout as ReturnType<typeof setTimeout>);
      });
    };
  }, []);

  const handleEditNode = () => {
    if (!selectedNode) return;
    setEditNodeLabel(selectedNode.data.label);
    setEditNodeType(selectedNode.data.type || 'concept');
    setShowEditModal(true);
  };

  const handleUpdateNode = async () => {
    if (!selectedNode || !editNodeLabel.trim()) {
      showError('Por favor, informe um nome para o n├│');
      return;
    }

    setUpdatingNode(true);
    try {
      const response = await api.put(`/knowledge-graph/${selectedNode.id}`, {
        label: editNodeLabel.trim(),
        type: editNodeType,
      });

      // Update node in state
      setNodes((nds: Node[]) =>
        nds.map((n: Node) => {
          if (n.id === selectedNode.id) {
            const updatedNode = {
              ...n,
              data: { ...n.data, label: response.data.label, type: response.data.type },
            };
            // Cor baseada no tipo do n├│
            const nodeType = response.data.type || 'concept';
            const nodeColor = getNodeColor(nodeType);
            updatedNode.data = { ...updatedNode.data, type: nodeType, color: nodeColor };
            return updatedNode;
          }
          return n;
        })
      );

      setShowEditModal(false);
      setSelectedNode(null);
      success('N├│ atualizado com sucesso!');
    } catch (error) {
      console.error('Failed to update node:', error);
      const axiosError = error as { response?: { data?: { error?: string } } };
      const errorMessage = axiosError?.response?.data?.error || 'Erro ao atualizar n├│';
      showError(errorMessage);
    } finally {
      setUpdatingNode(false);
    }
  };

  const handleDeleteNode = async () => {
    if (!selectedNode) return;

    if (!confirm('Tem certeza que deseja remover este n├│? Todas as conex├Áes ser├úo removidas.')) {
      return;
    }

    setDeletingNode(true);
    try {
      await api.delete(`/knowledge-graph/${selectedNode.id}`);
      
      // Remove node and its edges from state
      setNodes((nds: Node[]) => nds.filter((n: Node) => n.id !== selectedNode.id));
      setEdges((eds: Edge[]) => eds.filter((e: Edge) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
      success('N├│ removido com sucesso!');
    } catch (error) {
      console.error('Failed to delete node:', error);
      const axiosError = error as { response?: { data?: { error?: string } } };
      const errorMessage = axiosError?.response?.data?.error || 'Erro ao remover n├│';
      showError(errorMessage);
    } finally {
      setDeletingNode(false);
    }
  };

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    // Se j├í tem um n├│ selecionado para conex├úo, criar conex├úo
    if (nodeForConnection && nodeForConnection.id !== node.id) {
      createConnection(nodeForConnection.id, node.id);
      setNodeForConnection(null);
      setSelectedNode(node);
      // Atualizar visual dos n├│s
      setNodes((nds: Node[]) =>
        nds.map((n: Node) => ({
          ...n,
          selected: n.id === node.id,
          data: {
            ...n.data,
            connecting: false,
          },
        }))
      );
      return;
    }

    // Se n├úo tem n├│ selecionado, selecionar este para conex├úo
    setNodeForConnection(node);
    setSelectedNode(node);
    
    // Atualizar visual dos n├│s - marcar o selecionado como "connecting"
    setNodes((nds: Node[]) =>
      nds.map((n: Node) => ({
        ...n,
        selected: n.id === node.id,
        data: {
          ...n.data,
          connecting: n.id === node.id,
        },
      }))
    );
    
    success('N├│ selecionado. Clique em outro n├│ para conectar.');
  }, [nodeForConnection, createConnection, setNodes, success]);

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    // Cancelar modo de conex├úo se estiver ativo
    setNodeForConnection(null);
    // Selecionar o n├│ e abrir modal de edi├º├úo
    setSelectedNode(node);
    setEditNodeLabel(node.data.label);
    setEditNodeType(node.data.type || 'concept');
    setShowEditModal(true);
  }, []);

  const onPaneClick = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setNodeForConnection(null);
    // Reset selection
    setNodes((nds: Node[]) =>
      nds.map((n: Node) => ({
        ...n,
        selected: false,
        data: {
          ...n.data,
          connecting: false,
        },
      }))
    );
    setEdges((eds: Edge[]) =>
      eds.map((e: Edge) => ({
        ...e,
        selected: false,
      }))
    );
  };

  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    // Deselecionar n├│ se houver
    setSelectedNode(null);
    setNodeForConnection(null);
    setNodes((nds: Node[]) =>
      nds.map((n: Node) => ({
        ...n,
        selected: false,
        data: {
          ...n.data,
          connecting: false,
        },
      }))
    );
    // Selecionar edge
    setSelectedEdge(edge);
    setEdges((eds: Edge[]) =>
      eds.map((e: Edge) => ({
        ...e,
        selected: e.id === edge.id,
      }))
    );
  }, [setNodes, setEdges]);

  const handleDeleteConnection = async () => {
    if (!selectedEdge || !selectedEdge.data?.connectionId) {
      showError('ID da conex├úo n├úo encontrado');
      return;
    }

    if (!confirm('Tem certeza que deseja remover esta conex├úo?')) {
      return;
    }

    setDeletingConnection(true);
    try {
      await api.delete(`/knowledge-graph/connections/${selectedEdge.data.connectionId}`);
      
      // Remove edge from state
      setEdges((eds: Edge[]) => eds.filter((e: Edge) => e.id !== selectedEdge.id));
      setSelectedEdge(null);
      success('Conex├úo removida com sucesso!');
    } catch (error) {
      console.error('Failed to delete connection:', error);
      const axiosError = error as { response?: { data?: { error?: string } } };
      const errorMessage = axiosError?.response?.data?.error || 'Erro ao remover conex├úo';
      showError(errorMessage);
    } finally {
      setDeletingConnection(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col gap-4 sm:gap-6 px-2 sm:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary mb-2">Mapa Mental</p>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white truncate">Grafo de Conhecimento</h1>
          </div>
          <ContextualHelp section="knowledge" />
        </div>
        
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          <div className="relative group flex-1 min-w-[200px] sm:min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Buscar conceito..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="h-10 min-h-[44px] w-full rounded-lg border border-white/10 bg-white/[0.03] pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none transition-all touch-manipulation"
            />
          </div>
          <div className="relative flex-1 min-w-[200px] sm:min-w-[250px]">
            <input
              type="text"
              placeholder="Novo n├│..."
              value={newNodeLabel}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewNodeLabel(e.target.value)}
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && newNodeLabel.trim()) {
                  handleAddNode();
                }
              }}
              className="h-10 min-h-[44px] w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm text-white placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none transition-colors touch-manipulation"
            />
          </div>
          <Button
            variant="default"
            onClick={handleAddNode}
            disabled={!newNodeLabel.trim() || saving}
            className="bg-primary hover:bg-primary/90 text-white h-10 px-4 rounded-lg shadow-[0_0_20px_rgba(120,6,6,0.2)] touch-manipulation"
            style={{ minHeight: '44px' }}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPresentationMode(true)}
            className="h-10 px-3 sm:px-4 rounded-lg touch-manipulation"
            style={{ minHeight: '44px' }}
          >
            <Maximize2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Apresenta├º├úo</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleExportGraph}
            className="h-10 px-3 sm:px-4 rounded-lg touch-manipulation"
            style={{ minHeight: '44px' }}
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </div>
      </div>

      <Card className="flex-1 border border-white/5 bg-[#0d0d0d] overflow-hidden relative group shadow-2xl min-h-[calc(100vh-20rem)] sm:min-h-[calc(100vh-24rem)]">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />
        
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <CardContent className="h-full p-0 relative">
          {nodes.length === 0 && !loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">Grafo de conhecimento vazio</p>
                <p className="text-sm text-muted-foreground">Adicione um novo n├│ para come├ºar</p>
              </div>
            </div>
          ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onNodeDragStop={onNodeDragStop}
            className="bg-transparent"
            minZoom={0.1}
            maxZoom={8}
            defaultEdgeOptions={{ 
              type: 'straight', 
              animated: false,
              style: { 
                stroke: '#4a4a4a', 
                strokeWidth: 1.5, 
                opacity: 0.4,
              },
            }}
            connectOnClick={false}
            nodesConnectable={false}
            style={{ width: '100%', height: '100%' }}
          >
            <Background color="#1a1a1a" gap={20} size={1} style={{ opacity: 0.2 }} />
            <Controls 
              className="bg-[#0d0d0d]/90 border-[#780606]/30 fill-[#780606] text-[#780606] hover:fill-white hover:text-white" 
              showInteractive={false}
            />
            <MiniMap 
               nodeColor={() => '#780606'} 
               maskColor="rgba(0, 0, 0, 0.8)"
               className="bg-black/80 border border-white/10 rounded-lg"
            />
            
            <Panel position="top-left" className="flex gap-2">
               <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowLegend(!showLegend)}
                  className={cn("bg-black/50 border-white/10 text-white hover:bg-white/10 h-10 w-10 p-0", showLegend && "bg-primary/20 border-primary/50")}
               >
                  <HelpCircle className="h-4 w-4" />
               </Button>
            </Panel>

            {showLegend && (
               <Panel position="top-left" className="mt-12 ml-0">
                  <div className="bg-black/90 border border-white/10 p-4 rounded-xl backdrop-blur-md space-y-2 min-w-[200px]">
                     <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Legenda</h4>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#780606]" />
                        <span className="text-xs text-white">Conceito</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#3b82f6] rounded-[2px]" />
                        <span className="text-xs text-white">Teoria</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#10b981] rotate-45 rounded-none" />
                        <span className="text-xs text-white">Pr├ítica</span>
                     </div>
                     <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                        <div className="w-8 h-0.5 bg-[#6b7280] opacity-50" />
                        <span className="text-xs text-white">Conex├Áes</span>
                     </div>
                     <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-white/10">
                        Clique em um n├│ e depois em outro para conect├í-los
                     </p>
                     <p className="text-xs text-muted-foreground mt-2">
                        Duplo clique em um n├│ para edit├í-lo
                     </p>
                  </div>
               </Panel>
            )}

            <Panel position="bottom-right" className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                onClick={() => zoomIn()} 
                className="h-12 w-12 p-0 rounded-lg bg-[#0d0d0d]/90 border-[#780606]/50 text-[#780606] hover:bg-[#780606]/20 hover:border-[#780606] hover:text-white transition-all touch-manipulation shadow-lg"
                style={{ minHeight: '48px', minWidth: '48px' }}
                title="Aumentar zoom"
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => zoomOut()} 
                className="h-12 w-12 p-0 rounded-lg bg-[#0d0d0d]/90 border-[#780606]/50 text-[#780606] hover:bg-[#780606]/20 hover:border-[#780606] hover:text-white transition-all touch-manipulation shadow-lg"
                style={{ minHeight: '48px', minWidth: '48px' }}
                title="Diminuir zoom"
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => fitView()} 
                className="h-12 w-12 p-0 rounded-lg bg-[#0d0d0d]/90 border-[#780606]/50 text-[#780606] hover:bg-[#780606]/20 hover:border-[#780606] hover:text-white transition-all touch-manipulation shadow-lg"
                style={{ minHeight: '48px', minWidth: '48px' }}
                title="Ajustar visualiza├º├úo"
              >
                <Focus className="h-5 w-5" />
              </Button>
            </Panel>

            {nodeForConnection && (
              <Panel position="top-center" className="m-4">
                <div className="px-4 py-2 rounded-lg bg-[#780606]/20 border border-[#780606]/50 backdrop-blur-sm">
                  <p className="text-sm text-white font-medium">
                    N├│ selecionado: <span className="text-[#780606]">{nodeForConnection.data.label}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique em outro n├│ para conectar ou clique fora para cancelar
                  </p>
                </div>
              </Panel>
            )}

            {selectedEdge && (
              <Panel position="top-right" className="m-4">
                <div className="w-64 p-6 rounded-xl bg-black/90 border border-primary/30 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                  <h3 className="text-lg font-bold text-white mb-2">Conex├úo</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Linha entre dois n├│s
                  </p>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDeleteConnection}
                      disabled={deletingConnection}
                      className="w-full justify-start text-xs border-white/10 hover:bg-white/5 text-red-400 hover:text-red-300 hover:border-red-400/30"
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      {deletingConnection ? 'Removendo...' : 'Remover Conex├úo'}
                    </Button>
                  </div>
                </div>
              </Panel>
            )}

            {selectedNode && !nodeForConnection && !selectedEdge && (
              <Panel position="top-right" className="m-4">
                <div className="w-64 p-6 rounded-xl bg-black/90 border border-primary/30 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                  <h3 className="text-lg font-bold text-white mb-2">{selectedNode.data.label}</h3>
                  <p className="text-xs font-mono uppercase tracking-wider text-primary mb-4">
                    {selectedNode.data.type || 'Concept'}
                  </p>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleEditNode}
                      className="w-full justify-start text-xs border-white/10 hover:bg-white/5"
                    >
                      <Edit className="mr-2 h-3 w-3" />
                      Editar N├│
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDeleteNode}
                      disabled={deletingNode}
                      className="w-full justify-start text-xs border-white/10 hover:bg-white/5 text-red-400 hover:text-red-300 hover:border-red-400/30"
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      {deletingNode ? 'Removendo...' : 'Remover N├│'}
                    </Button>
                  </div>
                </div>
              </Panel>
            )}
          </ReactFlow>
          )}
        </CardContent>
      </Card>

      {/* Edit Node Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditNodeLabel('');
          setEditNodeType('concept');
        }}
        title="Editar N├│"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Nome do N├│</label>
            <Input
              value={editNodeLabel}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditNodeLabel(e.target.value)}
              placeholder="Nome do conceito"
              className="bg-white/5 border-white/10 text-white"
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && editNodeLabel.trim()) {
                  handleUpdateNode();
                }
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Tipo</label>
            <select
              value={editNodeType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditNodeType(e.target.value)}
              aria-label="Tipo do n├│"
              className="w-full h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="concept">Conceito</option>
              <option value="theory">Teoria</option>
              <option value="practice">Pr├ítica</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditNodeLabel('');
                setEditNodeType('concept');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateNode}
              disabled={!editNodeLabel.trim() || updatingNode}
              className="bg-primary hover:bg-primary/90"
            >
              {updatingNode ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Presentation Mode */}
      {showPresentationMode && (
        <GraphPresentationMode
          nodes={nodes}
          edges={edges}
          isActive={showPresentationMode}
          onExit={() => setShowPresentationMode(false)}
        />
      )}
    </div>
  );
}

export default function KnowledgeGraph() {
  return (
    <ReactFlowProvider>
      <GraphContent />
    </ReactFlowProvider>
  );
}
