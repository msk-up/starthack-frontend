import { useState, useEffect } from 'react';
import { Zap, CheckCircle, Clock, AlertCircle, MessageSquare } from 'lucide-react';
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
  const [activeConnection, setActiveConnection] = useState<number | null>(null);

  useEffect(() => {
    if (isProcessing) {
      let currentIndex = 0;
      const interval = setInterval(() => {
        setActiveConnection(currentIndex % suppliers.length);
        currentIndex++;
      }, 800);
      return () => clearInterval(interval);
    } else {
      setActiveConnection(null);
    }
  }, [isProcessing, suppliers.length]);

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
    <div className="flex items-center justify-center gap-12 py-8">
      {/* Orchestration Agent - Left Side */}
      <div className="flex-shrink-0">
        <Card className={cn(
          "glass p-8 rounded-2xl shadow-2xl border-2 transition-all duration-300 w-80",
          isProcessing ? "border-primary glow-primary" : "border-border"
        )}>
          <div className="flex flex-col items-center gap-4">
            <div className={cn(
              "rounded-2xl bg-gradient-to-br from-primary to-secondary p-4",
              isProcessing && "animate-pulse"
            )}>
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-xl mb-1">Orchestration Agent</h3>
              <p className="text-sm text-muted-foreground">
                {isProcessing ? 'Distributing tasks...' : 'Ready'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Connection Lines Container */}
      <div className="relative flex-shrink-0" style={{ width: '120px', height: '500px' }}>
        {suppliers.map((_, index) => {
          const isActive = activeConnection === index;
          const yPosition = (index * (500 / suppliers.length)) + (500 / suppliers.length / 2);
          
          return (
            <svg
              key={index}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ zIndex: isActive ? 10 : 1 }}
            >
              <line
                x1="0"
                y1="250"
                x2="120"
                y2={yPosition}
                stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--border))"}
                strokeWidth={isActive ? "3" : "2"}
                strokeDasharray={isActive ? "0" : "5,5"}
                className={cn(
                  "transition-all duration-300",
                  isActive && "animate-pulse"
                )}
              />
              {isActive && (
                <circle cx="120" cy={yPosition} r="4" fill="hsl(var(--primary))">
                  <animate attributeName="r" from="4" to="8" dur="0.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="1" to="0" dur="0.6s" repeatCount="indefinite" />
                </circle>
              )}
            </svg>
          );
        })}
      </div>

      {/* Supplier Seats - Right Side (Stacked Vertically) */}
      <div className="flex flex-col gap-4 flex-shrink-0 w-96">
        {suppliers.map((supplier, index) => {
          const isActive = activeConnection === index;
          
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
                "glass p-5 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
                getStatusColor(supplier.status),
                isActive && "ring-2 ring-primary ring-offset-2 border-primary",
                supplier.hasNewUpdate && "border-primary shadow-primary/20"
              )}>
                {/* New Update Indicator */}
                {supplier.hasNewUpdate && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <Badge className="bg-primary text-white border-0 rounded-full px-3 py-1 shadow-lg animate-bounce">
                      New
                    </Badge>
                  </div>
                )}

                {/* Agent Seat Label */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold shadow-lg">
                  {String.fromCharCode(65 + index)}
                </div>

                <div className="pl-6 flex items-center justify-between">
                  <div className="flex-1">
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
                <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden mt-3 ml-6">
                  <div 
                    className={cn(
                      "h-full transition-all duration-500",
                      supplier.status === 'offer_received' && "w-full bg-success",
                      supplier.status === 'processing' && "w-2/3 bg-primary animate-pulse",
                      supplier.status === 'waiting' && "w-1/3 bg-muted-foreground"
                    )}
                  />
                </div>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
