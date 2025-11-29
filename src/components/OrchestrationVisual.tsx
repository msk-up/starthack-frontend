import { useState, useEffect } from 'react';
import { MessageSquare, Zap, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SupplierSeat {
  id: string;
  name: string;
  status: 'idle' | 'processing' | 'offer_received' | 'waiting';
  lastUpdate?: Date;
  hasNewUpdate?: boolean;
}

interface OrchestrationVisualProps {
  suppliers: SupplierSeat[];
  onSupplierClick: (id: string) => void;
  isProcessing: boolean;
}

export default function OrchestrationVisual({ 
  suppliers, 
  onSupplierClick,
  isProcessing 
}: OrchestrationVisualProps) {
  const [pulseAgents, setPulseAgents] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)];
        setPulseAgents(new Set([randomSupplier.id]));
      }, 1500);
      return () => clearInterval(interval);
    } else {
      setPulseAgents(new Set());
    }
  }, [isProcessing, suppliers]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'offer_received':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'processing':
        return <MessageSquare className="h-4 w-4 text-primary animate-pulse" />;
      case 'waiting':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'offer_received':
        return 'border-success bg-success/5';
      case 'processing':
        return 'border-primary bg-primary/5';
      case 'waiting':
        return 'border-muted bg-muted/5';
      default:
        return 'border-border bg-background/50';
    }
  };

  return (
    <div className="relative w-full">
      {/* Orchestration Agent - Center */}
      <div className="flex justify-center mb-12">
        <Card className={cn(
          "glass p-6 rounded-2xl shadow-2xl border-2 transition-all duration-300",
          isProcessing ? "border-primary glow-primary scale-105" : "border-border"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "rounded-xl bg-gradient-to-br from-primary to-secondary p-3",
              isProcessing && "animate-pulse"
            )}>
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Orchestration Agent</h3>
              <p className="text-sm text-muted-foreground">
                {isProcessing ? 'Distributing tasks...' : 'Ready'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Connection Lines */}
      {isProcessing && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-primary/50 to-transparent" />
      )}

      {/* Supplier Seats Grid */}
      <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
        {suppliers.map((supplier, index) => {
          const isPulsing = pulseAgents.has(supplier.id);
          
          return (
            <button
              key={supplier.id}
              onClick={() => onSupplierClick(supplier.id)}
              className={cn(
                "relative group text-left transition-all duration-300",
                supplier.hasNewUpdate && "animate-pulse"
              )}
            >
              <Card className={cn(
                "glass p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl",
                getStatusColor(supplier.status),
                isPulsing && "ring-2 ring-primary ring-offset-2",
                supplier.hasNewUpdate && "border-primary shadow-primary/20"
              )}>
                {/* New Update Indicator */}
                {supplier.hasNewUpdate && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-primary text-white border-0 rounded-full px-3 py-1 shadow-lg animate-bounce">
                      New
                    </Badge>
                  </div>
                )}

                {/* Agent Seat Label */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {String.fromCharCode(65 + index)}
                </div>

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-base mb-1">{supplier.name}</h4>
                    {supplier.lastUpdate && (
                      <p className="text-xs text-muted-foreground">
                        {supplier.lastUpdate.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  {getStatusIcon(supplier.status)}
                </div>

                {/* Status Bar */}
                <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-500",
                      supplier.status === 'offer_received' && "w-full bg-success",
                      supplier.status === 'processing' && "w-2/3 bg-primary animate-pulse",
                      supplier.status === 'waiting' && "w-1/3 bg-muted-foreground"
                    )}
                  />
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </Card>

              {/* Connection Line to Orchestrator */}
              {isPulsing && isProcessing && (
                <div 
                  className="absolute bottom-full left-1/2 w-px bg-gradient-to-t from-primary/50 to-transparent"
                  style={{ height: '80px' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
