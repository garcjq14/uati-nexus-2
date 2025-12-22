import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
import { Input } from '../components/ui/input';
import { Plus, Maximize2, Focus, Search, Download, Edit, Trash2, Map as MapIcon } from 'lucide-react';
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
  Panel
} from 'reactflow';
import type { NodeDragHandler } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import api from '../lib/api';
import 'reactflow/dist/style.css';

// Registrar o tipo de nó customizado
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
  const [nodeForConnection, setNodeForConnection] = useState<Node | null>(null); // Nó selecionado para conectar
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingConnection, setDeletingConnection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPresentationMode, setShowPresentationMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNodeLabel, setEditNodeLabel] = useState('');
  const [editNodeType, setEditNodeType] = useState('concept');
  const [updatingNode, setUpdatingNode] = useState(false);
  const [deletingNode, setDeletingNode] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const { fitView, setCenter } = useReactFlow();
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

  // Função para obter cor baseada no tipo do nó
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
      

      // Calcular posições automáticas se não existirem (layout circular inicial)
      const hasPositions = knowledgeNodes.some((n: KnowledgeNode) => n.x !== 0 || n.y !== 0);
      
      const flowNodes: Node[] = knowledgeNodes.map((node: KnowledgeNode, index: number) => {
        const nodeType = node.type || 'concept';
        const nodeColor = getNodeColor(nodeType);
        const hasPosition = node.x !== 0 || node.y !== 0;
        
        // Se não tem posição salva, usar layout circular
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
      const connectionIds = new Set<string>(); // Para evitar duplicatas por ID de conexão
      
      // Criar um mapa de cores dos nós para acesso rápido
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
                    connectionId: connectionId, // Armazenar ID da conexão para poder deletar
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
      setLastSyncedAt(new Date().toISOString());
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
        setLastSyncedAt(new Date().toISOString());
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

  // Função para criar conexão entre dois nós
  const createConnection = useCallback(
    async (sourceId: string, targetId: string) => {
      if (sourceId === targetId) {
        showError('Não é possível conectar um nó a si mesmo');
        return;
      }

      // Verificar se a conexão já existe (em ambas as direções para garantir)
      const edgeExists = edges.some(
        (e: Edge) => (e.source === sourceId && e.target === targetId) ||
             (e.source === targetId && e.target === sourceId)
      );
      
      if (edgeExists) {
        showError('Esta conexão já existe');
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
          connectionId: undefined, // Será preenchido após criar a conexão
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
        // Atualizar a edge com o ID da conexão
        setEdges((eds: Edge[]) =>
          eds.map((e: Edge) =>
            e.id === newEdge.id
              ? { ...e, data: { connectionId: response.data.id } }
              : e
          )
        );
        success('Conexão criada com sucesso!');
      } catch (error) {
        console.error('Failed to save connection:', error);
        const axiosError = error as { response?: { data?: { error?: string } } };
        const errorMessage = axiosError?.response?.data?.error || 'Erro ao criar conexão';
        showError(errorMessage);
        // Remove the edge from UI if connection failed
        setEdges((eds: Edge[]) => eds.filter((e: Edge) => e.id !== newEdge.id));
      }
    },
    [edges, setEdges, setNodes, success, showError]
  );

  // Desabilitar conexão por arrastar
  const onConnect = useCallback(() => {
    // Não fazer nada - conexões são feitas por clique
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
      showError('Por favor, informe um nome para o nó');
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

      // Cor baseada no tipo do nó
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
      success('Nó criado com sucesso!');
    } catch (error) {
      console.error('Failed to add node:', error);
      const axiosError = error as { response?: { data?: { error?: string } } };
      const errorMessage = axiosError?.response?.data?.error || 'Erro ao criar nó';
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
          const errorMessage = axiosError?.response?.data?.error || 'Erro ao salvar posição';
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
      showError('Por favor, informe um nome para o nó');
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
            // Cor baseada no tipo do nó
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
      success('Nó atualizado com sucesso!');
    } catch (error) {
      console.error('Failed to update node:', error);
      const axiosError = error as { response?: { data?: { error?: string } } };
      const errorMessage = axiosError?.response?.data?.error || 'Erro ao atualizar nó';
      showError(errorMessage);
    } finally {
      setUpdatingNode(false);
    }
  };

  const handleDeleteNode = async () => {
    if (!selectedNode) return;

    if (!confirm('Tem certeza que deseja remover este nó? Todas as conexões serão removidas.')) {
      return;
    }

    setDeletingNode(true);
    try {
      await api.delete(`/knowledge-graph/${selectedNode.id}`);
      
      // Remove node and its edges from state
      setNodes((nds: Node[]) => nds.filter((n: Node) => n.id !== selectedNode.id));
      setEdges((eds: Edge[]) => eds.filter((e: Edge) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
      success('Nó removido com sucesso!');
    } catch (error) {
      console.error('Failed to delete node:', error);
      const axiosError = error as { response?: { data?: { error?: string } } };
      const errorMessage = axiosError?.response?.data?.error || 'Erro ao remover nó';
      showError(errorMessage);
    } finally {
      setDeletingNode(false);
    }
  };

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    // Se já tem um nó selecionado para conexão, criar conexão
    if (nodeForConnection && nodeForConnection.id !== node.id) {
      createConnection(nodeForConnection.id, node.id);
      setNodeForConnection(null);
      setSelectedNode(node);
      // Atualizar visual dos nós
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

    // Se não tem nó selecionado, selecionar este para conexão
    setNodeForConnection(node);
    setSelectedNode(node);
    
    // Atualizar visual dos nós - marcar o selecionado como "connecting"
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
    
    success('Nó selecionado. Clique em outro nó para conectar.');
  }, [nodeForConnection, createConnection, setNodes, success]);

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    // Cancelar modo de conexão se estiver ativo
    setNodeForConnection(null);
    // Selecionar o nó e abrir modal de edição
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
    // Deselecionar nó se houver
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
      showError('ID da conexão não encontrado');
      return;
    }

    if (!confirm('Tem certeza que deseja remover esta conexão?')) {
      return;
    }

    setDeletingConnection(true);
    try {
      await api.delete(`/knowledge-graph/connections/${selectedEdge.data.connectionId}`);
      
      // Remove edge from state
      setEdges((eds: Edge[]) => eds.filter((e: Edge) => e.id !== selectedEdge.id));
      setSelectedEdge(null);
      success('Conexão removida com sucesso!');
    } catch (error) {
      console.error('Failed to delete connection:', error);
      const axiosError = error as { response?: { data?: { error?: string } } };
      const errorMessage = axiosError?.response?.data?.error || 'Erro ao remover conexão';
      showError(errorMessage);
    } finally {
      setDeletingConnection(false);
    }
  };

  const handleCenterGraph = () => {
    if (nodes.length === 0) return;
    try {
      fitView({ padding: 0.2, duration: 400 });
    } catch (error) {
      console.warn('Não foi possível centralizar o grafo', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const lastSyncLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '---';
  const selectedConnections = selectedNode
    ? edges.filter(
        (edge: Edge) => edge.source === selectedNode.id || edge.target === selectedNode.id
      ).length
    : 0;
  const heroStats = [
    { label: 'Nós mapeados', value: nodes.length },
    { label: 'Conexões ativas', value: edges.length },
    { label: 'Última sincronização', value: lastSyncLabel },
    { label: 'Seleção ativa', value: selectedNode ? selectedNode.data.label : 'Nenhuma' },
  ];
  const legendItems = [
    { label: 'Conceito', color: '#780606', shape: 'rounded-full' },
    { label: 'Teoria', color: '#3b82f6', shape: 'rounded' },
    { label: 'Prática', color: '#10b981', shape: 'rotate-45' },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <section className="border border-white/10 bg-transparent p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-primary">Mapa mental</p>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-serif font-light text-white">Grafo de conhecimento</h1>
              <ContextualHelp section="knowledge" />
            </div>
            <p className="mt-2 text-sm text-white/70">
              Visualize relações entre conceitos, conecte ideias e mantenha sua trilha de aprendizado atualizada.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" className="gap-2 text-white" onClick={() => setShowPresentationMode(true)}>
              <Maximize2 className="h-4 w-4" />
              Modo apresentação
            </Button>
            <Button variant="outline" className="gap-2 border-white/20 text-white/80 hover:text-white" onClick={handleExportGraph}>
              <Download className="h-4 w-4" />
              Exportar JSON
            </Button>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {heroStats.map((item) => (
            <div key={item.label} className="border-b border-white/10 pb-3">
              <p className="text-xs uppercase tracking-wide text-white/60">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-white truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
        <div className="space-y-4">
          <Card className="border-white/10 bg-transparent">
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Buscar conceito</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearch}
                    placeholder="Digite o nome do nó"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Criar novo nó</label>
                <div className="flex gap-2">
                  <Input
                    value={newNodeLabel}
                    onChange={(e) => setNewNodeLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newNodeLabel.trim()) {
                        handleAddNode();
                      }
                    }}
                    placeholder="Nome do conceito"
                  />
                  <Button onClick={handleAddNode} disabled={!newNodeLabel.trim() || saving} className="whitespace-nowrap">
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" className="gap-2 text-white" onClick={handleCenterGraph} disabled={nodes.length === 0}>
                  <Focus className="h-4 w-4" />
                  Centralizar
                </Button>
                <Button variant="outline" className="gap-2 border-white/10" onClick={() => setShowPresentationMode(true)}>
                  <Maximize2 className="h-4 w-4" />
                  Apresentação
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Edit className="h-4 w-4 text-primary" />
                Detalhes do nó
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedNode ? (
                <>
                  <div>
                    <p className="text-lg font-semibold text-white">{selectedNode.data.label}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-primary">{selectedNode.data.type || 'concept'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-white/70">
                    <div className="border-b border-white/10 pb-3">
                      <p className="text-xs uppercase text-white/50">Conexões</p>
                      <p className="text-lg font-semibold text-white">{selectedConnections}</p>
                    </div>
                    <div className="border-b border-white/10 pb-3">
                      <p className="text-xs uppercase text-white/50">Modo atual</p>
                      <p className="text-lg font-semibold text-white">
                        {nodeForConnection?.id === selectedNode.id ? 'Conectando' : 'Edição'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="gap-2" onClick={handleEditNode}>
                      <Edit className="h-3 w-3" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 border-red-500/40 text-red-300 hover:bg-red-500/10"
                      onClick={handleDeleteNode}
                      disabled={deletingNode}
                    >
                      <Trash2 className="h-3 w-3" />
                      {deletingNode ? 'Removendo...' : 'Remover'}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-white/70 hover:text-white" onClick={onPaneClick}>
                      Limpar seleção
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-white/70">Selecione um nó no grafo para visualizar detalhes e ações rápidas.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <MapIcon className="h-4 w-4 text-primary" />
                Legenda e instruções
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {legendItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-3 w-3',
                        item.shape === 'rounded-full' ? 'rounded-full' : item.shape === 'rounded' ? 'rounded-sm' : 'rotate-45',
                        item.color === '#780606' && 'bg-[#780606]',
                        item.color === '#3b82f6' && 'bg-[#3b82f6]',
                        item.color === '#10b981' && 'bg-[#10b981]'
                      )}
                    />
                    <p className="text-sm text-white">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-1 border-t border-white/10 pt-3 text-xs text-white/70">
                <p>• Clique em um nó para selecioná-lo.</p>
                <p>• Clique duas vezes para editar.</p>
                <p>• Clique em dois nós em sequência para criar conexões.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="flex-1 border border-white/10 bg-transparent overflow-hidden relative group min-h-[calc(100vh-20rem)] sm:min-h-[calc(100vh-24rem)]">
        
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
                <p className="text-sm text-muted-foreground">Adicione um novo nó para começar</p>
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

            {nodeForConnection && (
              <Panel position="top-center" className="m-4">
                <div className="px-4 py-2 border border-[#780606]/50 bg-transparent">
                  <p className="text-sm text-white font-medium">
                    Nó selecionado: <span className="text-[#780606]">{nodeForConnection.data.label}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique em outro nó para conectar ou clique fora para cancelar
                  </p>
                </div>
              </Panel>
            )}

            {selectedEdge && (
              <Panel position="top-right" className="m-4">
                <div className="w-64 p-6 border border-primary/30 bg-transparent">
                  <h3 className="text-lg font-bold text-white mb-2">Conexão</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Linha entre dois nós
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
                      {deletingConnection ? 'Removendo...' : 'Remover Conexão'}
                    </Button>
                  </div>
                </div>
              </Panel>
            )}

          </ReactFlow>
          )}
        </CardContent>
      </Card>
    </div>

      {/* Edit Node Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditNodeLabel('');
          setEditNodeType('concept');
        }}
        title="Editar Nó"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Nome do Nó</label>
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
              aria-label="Tipo do nó"
              className="w-full h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="concept">Conceito</option>
              <option value="theory">Teoria</option>
              <option value="practice">Prática</option>
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
