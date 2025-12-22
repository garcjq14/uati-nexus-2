import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BookOpen, Download, Eye, FileText, GraduationCap, Loader2 } from 'lucide-react';
import { Modal } from '../components/ui/modal';

type DocumentMeta = {
  id: string;
  title: string;
  description: string;
  icon: typeof BookOpen;
  size: string;
  path: string;
};

const documents: DocumentMeta[] = [
  {
    id: 'master-guide',
    title: 'Guia Mestre do Autodidatismo Estruturado',
    description:
      'Documento principal com toda a metodologia do Autodidatismo Estruturado, fundamentos teóricos e práticos para aprendizado autônomo eficaz',
    icon: BookOpen,
    size: '2.4 MB',
    path: '/docs/master-guide.md',
  },
  {
    id: 'methodology-manual',
    title: 'Manual de Metodologia Prática',
    description:
      'Detalhamento completo da metodologia e práticas recomendadas, com exemplos práticos e técnicas avançadas',
    icon: FileText,
    size: '1.8 MB',
    path: '/docs/methodology-manual.md',
  },
  {
    id: 'career-guide',
    title: 'Guia de Carreira e Portfólio',
    description:
      'Orientações sobre desenvolvimento de carreira, construção de portfólio e transição para o mercado de trabalho',
    icon: GraduationCap,
    size: '3.1 MB',
    path: '/docs/career-guide.md',
  },
];

export default function Documents() {
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [docCache, setDocCache] = useState<Record<string, string>>({});
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const [docError, setDocError] = useState<string | null>(null);

  const handleDownload = async (doc: DocumentMeta) => {
    try {
      const response = await fetch(doc.path);
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.id}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const handleView = async (doc: DocumentMeta) => {
    setViewingDoc(doc.id);
    setDocError(null);

    if (docCache[doc.id]) {
      return;
    }

    setLoadingDocId(doc.id);
    try {
      const response = await fetch(doc.path);
      if (!response.ok) {
        throw new Error('Failed to load document');
      }
      const text = await response.text();
      setDocCache((prev) => ({ ...prev, [doc.id]: text }));
    } catch (error) {
      console.error('Error loading document:', error);
      setDocError('Não conseguimos carregar este documento agora. Tente novamente mais tarde.');
    } finally {
      setLoadingDocId(null);
    }
  };

  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={`${part}-${idx}`}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={`${part}-${idx}`}>{part}</span>;
    });
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-2xl font-serif font-bold mt-6 mb-4 text-foreground first:mt-0">
            {trimmed.substring(2)}
          </h1>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-xl font-serif font-bold mt-5 mb-3 text-foreground">
            {trimmed.substring(3)}
          </h2>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-lg font-serif font-semibold mt-4 mb-2 text-foreground">
            {trimmed.substring(4)}
          </h3>
        );
      }
      if (trimmed.startsWith('#### ')) {
        return (
          <h4 key={idx} className="text-base font-serif font-semibold mt-3 mb-2 text-foreground">
            {trimmed.substring(5)}
          </h4>
        );
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={idx} className="ml-6 mb-2 text-foreground list-disc">
            {renderInline(trimmed.substring(2))}
          </li>
        );
      }
      if (trimmed.startsWith('```')) {
        return null;
      }
      if (trimmed === '') {
        return <div key={idx} className="h-3" />;
      }
      return (
        <p key={idx} className="mb-3 text-foreground leading-relaxed">
          {renderInline(line)}
        </p>
      );
    });
  };

  const currentDocument = viewingDoc ? documents.find((doc) => doc.id === viewingDoc) : null;
  const currentContent = viewingDoc ? docCache[viewingDoc] : null;
  const isLoadingCurrent = loadingDocId === viewingDoc && !currentContent;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary mb-2">Documentação</p>
        <h1 className="text-3xl font-serif font-light text-white tracking-tight">Documentos Mestres</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => {
          const Icon = doc.icon;
          const isLoading = loadingDocId === doc.id;
          return (
            <Card key={doc.id} className="flex flex-col border-b border-white/10 bg-transparent hover:border-primary/30 transition-all group min-h-[280px]">
              <CardHeader className="pb-4">
                <div className="mb-4 inline-flex p-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg font-light text-white min-h-[56px]">{doc.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 space-y-4 pt-0">
                <p className="text-sm text-white/70 leading-relaxed flex-1 min-h-[60px]">{doc.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-xs text-white/60">{doc.size}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs border-white/10 hover:bg-white/5"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs border-white/10 hover:bg-white/5"
                      onClick={() => handleView(doc)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Eye className="h-3 w-3 mr-1" />
                      )}
                      Visualizar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Modal
        isOpen={!!viewingDoc}
        onClose={() => {
          setViewingDoc(null);
          setDocError(null);
        }}
        title={currentDocument?.title || 'Documento'}
        size="xl"
      >
        {isLoadingCurrent && (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando documento...
          </div>
        )}

        {!isLoadingCurrent && docError && (
          <p className="text-sm text-destructive leading-relaxed">{docError}</p>
        )}

        {!isLoadingCurrent && !docError && currentContent && (
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="prose prose-invert max-w-none text-foreground">
              {renderContent(currentContent)}
            </div>
          </div>
        )}
      </Modal>

      <Card className="border border-white/5 bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-light text-white">Sobre os Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Os documentos mestres contêm informações essenciais sobre a metodologia do Autodidatismo Estruturado.
            Você pode visualizá-los diretamente no navegador ou fazer o download para consulta offline.
          </p>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p><strong className="text-white">Guia Mestre:</strong> Visão geral completa da metodologia AE</p>
            <p><strong className="text-white">Manual de Metodologia:</strong> Detalhes práticos e técnicas de estudo</p>
            <p><strong className="text-white">Guia de Carreira:</strong> Orientações para desenvolvimento profissional</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
