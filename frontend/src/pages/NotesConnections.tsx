import { useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Network, Info, ZoomIn, ZoomOut, Focus } from 'lucide-react';
import { useState } from 'react';
import CustomNode from '../components/knowledge/CustomNode';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  Panel,
  ReactFlowProvider,
  type Connection,
  type Node,
  type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import api from '../lib/api';
import { EmptyState } from '../components/empty-states/EmptyState';

const nodeTypes = { custom: CustomNode };

function NotesConnectionsContent() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<any[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  // Fit view when nodes are updated
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
      }, 100);
    }
  }, [nodes.length, reactFlowInstance]);

  const fetchNotes = async () => {
    try {
      const response = await api.get('/notes');
      // Normalize connections to always be arrays
      const normalizedNotes = response.data.map((note: any) => ({
        ...note,
        connections: Array.isArray(note.connections) 
          ? note.connections 
          : note.connections 
            ? [note.connections] 
            : []
      }));
      setNotes(normalizedNotes);
      buildGraph(normalizedNotes);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildGraph = (notesData: any[]) => {
    if (notesData.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Calculate positions in a better layout
    const centerX = 400;
    const centerY = 400;
    const radius = Math.max(200, notesData.length * 30);
    
    const flowNodes: Node[] = notesData.map((note, index) => {
      const angle = (index / notesData.length) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      return {
        id: note.id,
        type: 'custom',
        position: { x, y },
        data: { 
          label: note.title || 'Sem título',
          type: 'concept',
          color: '#bdbdbd'
        },
      };
    });

    const flowEdges: Edge[] = [];
    const edgeSet = new Set<string>(); // Prevent duplicate edges
    
    notesData.forEach((note) => {
      if (Array.isArray(note.connections) && note.connections.length > 0) {
        note.connections.forEach((connId: string) => {
          const edgeId = note.id < connId 
            ? `e${note.id}-${connId}` 
            : `e${connId}-${note.id}`;
          
          // Only add edge if it doesn't exist and target node exists
          if (!edgeSet.has(edgeId) && notesData.some(n => n.id === connId)) {
            edgeSet.add(edgeId);
            flowEdges.push({
              id: edgeId,
              source: note.id,
              target: connId,
              style: { 
                stroke: 'rgba(255,255,255,0.28)', 
                strokeWidth: 1.3,
                opacity: 0.8
              },
              animated: false,
              type: 'straight',
            });
          }
        });
      }
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  const stats = useMemo(() => {
    const totalConnections = edges.length;
    const connectedNotes = new Set<string>();
    edges.forEach(edge => {
      connectedNotes.add(edge.source);
      connectedNotes.add(edge.target);
    });
    
    return {
      totalNotes: notes.length,
      totalConnections,
      connectedNotes: connectedNotes.size,
      isolatedNotes: notes.length - connectedNotes.size
    };
  }, [notes, edges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (loading) {
    return <div className="text-center text-muted-foreground">Carregando...</div>;
  }

  if (notes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/notes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-serif">Mapa de Conexões (Zettelkasten)</h1>
            <p className="text-muted-foreground">
              Visualização gráfica das conexões entre suas fichas
            </p>
          </div>
        </div>
        <EmptyState
          icon={Network}
          title="Nenhuma ficha encontrada"
          description="Crie fichas e conecte-as para ver o mapa de conexões aqui."
          actionLabel="Criar Primeira Ficha"
          onAction={() => navigate('/notes/new')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/notes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif">Mapa de Conexões (Zettelkasten)</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Visualização gráfica das conexões entre suas fichas
            </p>
          </div>
        </div>
        {stats.totalConnections > 0 && (
          <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
            <div className="rounded-lg bg-primary/20 px-3 py-1.5 text-primary">
              <span className="font-semibold">{stats.totalNotes}</span> fichas
            </div>
            <div className="rounded-lg bg-primary/20 px-3 py-1.5 text-primary">
              <span className="font-semibold">{stats.totalConnections}</span> conexões
            </div>
            {stats.isolatedNotes > 0 && (
              <div className="rounded-lg bg-muted px-3 py-1.5 text-muted-foreground">
                <span className="font-semibold">{stats.isolatedNotes}</span> isoladas
              </div>
            )}
          </div>
        )}
      </div>

      <Card className="h-[calc(100vh-16rem)] sm:h-[calc(100vh-14rem)] border border-white/5 bg-[#0c0c0f] relative overflow-hidden" style={{ contentVisibility: 'auto' }}>
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff06_1px,transparent_1px)] [background-size:18px_18px] opacity-25 pointer-events-none" />
        <CardContent className="h-full p-0 relative">
          {nodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <Network className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhum nó para exibir</p>
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
              onInit={setReactFlowInstance}
              fitView
              minZoom={0.1}
              maxZoom={2}
              defaultEdgeOptions={{
                type: 'straight',
                animated: false,
                style: { stroke: 'rgba(255,255,255,0.28)', strokeWidth: 1.3, opacity: 0.8 }
              }}
              onNodeClick={(event, node) => {
                navigate(`/notes/${node.id}`);
              }}
              className="bg-transparent"
              proOptions={{ hideAttribution: true }}
            >
              <Background 
                color="#1a1a1a" 
                gap={18} 
                size={1}
                style={{ opacity: 0.25 }}
              />
              <Controls className="!bg-[#0f0f12]/80 !border-white/10 !text-white !fill-white [&_button]:!border-white/10 [&_button]:!bg-[#15151b] [&_button]:hover:!bg-white/10" showInteractive={false} />
              <MiniMap
                nodeColor={() => '#bdbdbd'}
                maskColor="rgba(0, 0, 0, 0.8)"
                className="bg-black/80 border border-white/10 rounded-lg"
                pannable
                zoomable
              />
              <Panel position="top-right" className="hidden sm:block">
                <div className="bg-[#0f0f12]/80 border border-white/10 rounded-lg p-3 text-xs space-y-1 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Info className="h-3 w-3" />
                    <span className="font-semibold text-white/80">Dica</span>
                  </div>
                  <div className="ml-5">Clique em um nó para ver a ficha</div>
                  <div className="ml-5">Arraste para reorganizar</div>
                </div>
              </Panel>
              <Panel position="bottom-right" className="hidden sm:flex gap-2 m-4">
                <Button variant="outline" onClick={() => reactFlowInstance?.zoomIn?.()} className="h-10 w-10 p-0 rounded-full bg-[#0f0f12]/80 border-white/10 text-white hover:bg-white/10 hover:border-white/30 touch-manipulation">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => reactFlowInstance?.zoomOut?.()} className="h-10 w-10 p-0 rounded-full bg-[#0f0f12]/80 border-white/10 text-white hover:bg-white/10 hover:border-white/30 touch-manipulation">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => reactFlowInstance?.fitView?.({ padding: 0.2, duration: 400 })} className="h-10 w-10 p-0 rounded-full bg-[#0f0f12]/80 border-white/10 text-white hover:bg-white/10 hover:border-white/30 touch-manipulation">
                  <Focus className="h-4 w-4" />
                </Button>
              </Panel>
              <Panel position="bottom-center" className="flex sm:hidden gap-2 mb-4">
                <Button variant="outline" onClick={() => reactFlowInstance?.zoomIn?.()} className="h-12 w-12 p-0 rounded-full bg-[#0f0f12]/80 border-white/10 text-white hover:bg-white/10 hover:border-white/30 touch-manipulation">
                  <ZoomIn className="h-5 w-5" />
                </Button>
                <Button variant="outline" onClick={() => reactFlowInstance?.zoomOut?.()} className="h-12 w-12 p-0 rounded-full bg-[#0f0f12]/80 border-white/10 text-white hover:bg-white/10 hover:border-white/30 touch-manipulation">
                  <ZoomOut className="h-5 w-5" />
                </Button>
                <Button variant="outline" onClick={() => reactFlowInstance?.fitView?.({ padding: 0.2, duration: 400 })} className="h-12 w-12 p-0 rounded-full bg-[#0f0f12]/80 border-white/10 text-white hover:bg-white/10 hover:border-white/30 touch-manipulation">
                  <Focus className="h-5 w-5" />
                </Button>
              </Panel>
            </ReactFlow>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function NotesConnections() {
  return (
    <ReactFlowProvider>
      <NotesConnectionsContent />
    </ReactFlowProvider>
  );
}
