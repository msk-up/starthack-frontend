import { useState, useEffect } from 'react';
import { Zap, CheckCircle, Clock, AlertCircle, MessageSquare, Send, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  onPromptSubmit: (prompt: string) => void;
}

export default function OrchestrationVisual({ 
  suppliers, 
  onSupplierClick,
  isProcessing,
  onPromptSubmit
}: OrchestrationVisualProps) {
  const [activeConnection, setActiveConnection] = useState<number | null>(null);
  const [prompt, setPrompt] = useState('');

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

  const handleSubmit = () => {
    if (prompt.trim() && !isProcessing) {
      onPromptSubmit(prompt);
      setPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'offer_received':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
        return <MessageSquare className="h-4 w-4" />;
      case 'waiting':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'offer_received':
        return 'border-foreground/20 bg-card';
      case 'processing':
        return 'border-foreground/10 bg-card';
      case 'waiting':
        return 'border-border bg-card';
      default:
        return 'border-border bg-card';
    }
  };

  return (
    <div className="flex items-center gap-6 w-full max-w-7xl mx-auto py-8">
      {/* Orchestration Agent with Prompt - Left Side */}
      <div className="w-[420px] flex-shrink-0">
        <Card className={cn(
          "border bg-card transition-all duration-300",
          isProcessing && "border-foreground"
        )}>
          <div className="p-6 space-y-5">
            {/* Agent Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-foreground flex items-center justify-center">
                <Zap className="h-5 w-5 text-background" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Orchestration Agent</h3>
                <p className="text-sm text-muted-foreground">
                  {isProcessing ? 'Processing...' : 'Ready'}
                </p>
              </div>
            </div>

            {/* Prompt Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Negotiation Prompt
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Request best pricing for bulk order of 100 units with 30-day payment terms..."
                className="min-h-[140px] resize-none border focus:border-foreground"
                disabled={isProcessing}
              />
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-muted-foreground">
                  ⌘ + Enter to send
                </p>
                <Button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || isProcessing}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Connection Lines - Visual Flow */}
      <div className="relative flex-shrink-0" style={{ width: '100px', height: `${suppliers.length * 120}px` }}>
        {suppliers.map((_, index) => {
          const isActive = activeConnection === index;
          const yStart = (suppliers.length * 120) / 2;
          const yEnd = (index * 120) + 60;
          
          return (
            <svg
              key={index}
              className="absolute inset-0 pointer-events-none"
              width="100"
              height={suppliers.length * 120}
            >
              <line
                x1="0"
                y1={yStart}
                x2="100"
                y2={yEnd}
                stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--border))"}
                strokeWidth={isActive ? "2" : "1"}
                strokeDasharray="4,4"
                className="transition-all duration-300"
              />
            </svg>
          );
        })}
      </div>

      {/* Supplier Seats - Right Side (Vertically Aligned with Lines) */}
      <div className="flex-1 min-w-0 max-w-2xl">
        <div className="space-y-4">
          {suppliers.map((supplier, index) => {
            const isActive = activeConnection === index;
            
            return (
              <button
                key={supplier.id}
                onClick={() => onSupplierClick(supplier.id)}
                className="relative group text-left transition-all duration-200 w-full block"
                style={{ height: '112px' }}
              >
                <Card className={cn(
                  "glass p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:border-primary/50 h-full flex items-center",
                  getStatusColor(supplier.status),
                  isActive && "border-primary shadow-primary/20",
                  supplier.hasNewUpdate && "border-success"
                )}>
                  {/* New Update Badge */}
                  {supplier.hasNewUpdate && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="bg-success text-white border-0 rounded-full px-3 py-1 text-xs shadow-lg">
                        New
                      </Badge>
                    </div>
                  )}

                  {/* Seat Label */}
                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shadow-lg z-10">
                    {String.fromCharCode(65 + index)}
                  </div>

                  <div className="pl-10 pr-4 flex items-center justify-between gap-4 w-full">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <h4 className="font-bold text-lg truncate">{supplier.name}</h4>
                        {supplier.lastUpdate && (
                          <p className="text-xs text-muted-foreground">
                            Last update: {supplier.lastUpdate.toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-500 rounded-full",
                            supplier.status === 'offer_received' && "w-full bg-success",
                            supplier.status === 'processing' && "w-2/3 bg-primary",
                            supplier.status === 'waiting' && "w-1/3 bg-muted-foreground"
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusIcon(supplier.status)}
                    </div>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
