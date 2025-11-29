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
    <div className="flex items-start gap-8 w-full max-w-7xl mx-auto">
      {/* Orchestration Agent with Prompt - Left Side */}
      <div className="w-[420px] flex-shrink-0">
        <Card className={cn(
          "glass p-6 rounded-2xl shadow-2xl border-2 transition-all duration-300",
          isProcessing ? "border-primary" : "border-border"
        )}>
          <div className="flex flex-col gap-5">
            {/* Agent Header */}
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-primary to-secondary p-3">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl">Orchestration Agent</h3>
                <p className="text-sm text-muted-foreground">
                  {isProcessing ? 'Distributing tasks...' : 'Ready'}
                </p>
              </div>
            </div>

            {/* Prompt Input */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">
                Negotiation Prompt
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Request best pricing for bulk order of 100 units with 30-day payment terms..."
                className="min-h-[140px] resize-none glass border-2 focus:border-primary transition-all"
                disabled={isProcessing}
              />
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-muted-foreground">
                  Cmd/Ctrl + Enter to send
                </p>
                <Button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || isProcessing}
                  variant="gradientAccent"
                  size="default"
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
      <div className="relative flex-shrink-0 self-center" style={{ width: '80px', height: '400px' }}>
        {suppliers.map((_, index) => {
          const isActive = activeConnection === index;
          const spacing = 400 / Math.max(suppliers.length, 1);
          const yPosition = (index * spacing) + (spacing / 2);
          
          return (
            <svg
              key={index}
              className="absolute inset-0 pointer-events-none"
              style={{ width: '80px', height: '400px' }}
            >
              <line
                x1="0"
                y1="200"
                x2="80"
                y2={yPosition}
                stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)"}
                strokeWidth={isActive ? "2" : "1"}
                strokeDasharray="4,4"
              />
            </svg>
          );
        })}
      </div>

      {/* Supplier Seats - Right Side */}
      <div className="flex-1 min-w-0">
        <div className="space-y-4">
          {suppliers.map((supplier, index) => {
            const isActive = activeConnection === index;
            
            return (
              <button
                key={supplier.id}
                onClick={() => onSupplierClick(supplier.id)}
                className="relative group text-left transition-all duration-200 w-full block"
              >
                <Card className={cn(
                  "glass p-5 rounded-2xl border-2 transition-all duration-200 hover:shadow-xl hover:border-primary/50",
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
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-base shadow-lg z-10">
                    {String.fromCharCode(65 + index)}
                  </div>

                  <div className="pl-10 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-lg mb-1 truncate">{supplier.name}</h4>
                      {supplier.lastUpdate && (
                        <p className="text-xs text-muted-foreground">
                          Last update: {supplier.lastUpdate.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusIcon(supplier.status)}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden mt-4 ml-10">
                    <div 
                      className={cn(
                        "h-full transition-all duration-500 rounded-full",
                        supplier.status === 'offer_received' && "w-full bg-success",
                        supplier.status === 'processing' && "w-2/3 bg-primary",
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
    </div>
  );
}
