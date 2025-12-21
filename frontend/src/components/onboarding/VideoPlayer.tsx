import { Card, CardContent } from '../ui/card';

interface VideoPlayerProps {
  src?: string;
  autoPlay?: boolean;
  duration?: number;
  onComplete?: () => void;
}

export function VideoPlayer({ 
  src, 
  autoPlay = false, 
  duration = 30,
  onComplete 
}: VideoPlayerProps) {
  return (
    <Card className="border-border overflow-hidden">
      <CardContent className="p-0">
        <div className="w-full aspect-video bg-muted/50 flex items-center justify-center">
          {src ? (
            <video
              src={src}
              className="w-full h-full object-cover"
              autoPlay={autoPlay}
              controls
            />
          ) : (
            <div className="text-center space-y-4 p-8 max-w-lg">
              <div className="text-5xl mb-4">🎓</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Autodidatismo Estruturado
              </h3>
              <p className="text-muted-foreground">
                Uma metodologia que combina flexibilidade e organização para o domínio profundo de qualquer área de conhecimento.
              </p>
              <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                <p>✓ Aprendizado ativo e prático</p>
                <p>✓ Revisão espaçada para retenção</p>
                <p>✓ Projetos integradores (PoW)</p>
                <p>✓ Mapeamento de conhecimento</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

