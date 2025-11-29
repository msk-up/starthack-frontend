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
    <div className="flex flex-col lg:flex-row items-start justify-center gap-8 py-6 w-full">
      {/* Orchestration Agent - Left Side */}
      <div className="w-full lg:w-96 flex-shrink-0">
        <Card className={cn(
          "glass p-6 rounded-2xl shadow-2xl border-2 transition-all duration-300",
          isProcessing ? "border-primary" : "border-border"
        )}>
          <div className="flex flex-col gap-4">
            {/* Agent Header */}
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-primary to-secondary p-3">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Orchestration Agent</h3>
                <p className="text-xs text-muted-foreground">
                  {isProcessing ? 'Distributing tasks...' : 'Ready'}
                </p>
              </div>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">
                Negotiation Prompt
              </label>
              <div className="flex gap-2">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., Request best pricing for bulk order of 100 units..."
                  className="min-h-[120px] resize-none glass border-2 focus:border-primary transition-all text-sm"
                  disabled={isProcessing}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Cmd/Ctrl + Enter to send
                </p>
                <Button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || isProcessing}
                  variant="gradientAccent"
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

      {/* Connection Lines Container - Hidden on mobile */}
      <div className="hidden lg:block relative flex-shrink-0 self-stretch" style={{ width: '100px', minHeight: '400px' }}>
        {suppliers.map((_, index) => {
          const isActive = activeConnection === index;
          const totalHeight = Math.max(400, suppliers.length * 100);
          const yPosition = (index * (totalHeight / suppliers.length)) + (totalHeight / suppliers.length / 2);
          
          return (
            <svg
              key={index}
              className="absolute top-0 left-0 w-full pointer-events-none"
              style={{ height: `${totalHeight}px`, zIndex: isActive ? 10 : 1 }}
            >
              <line
                x1="0"
                y1={totalHeight / 2}
                x2="100"
                y2={yPosition}
                stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--border))"}
                strokeWidth={isActive ? "2" : "1"}
                strokeDasharray="5,5"
                className="transition-all duration-300"
              />
            </svg>
          );
        })}
      </div>

      {/* Supplier Seats - Right Side (Stacked Vertically with Scroll) */}
      <div className="flex-1 w-full lg:max-w-xl">
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2 space-y-4">
          {suppliers.map((supplier, index) => {
            const isActive = activeConnection === index;
            
            return (
              <button
                key={supplier.id}
                onClick={() => onSupplierClick(supplier.id)}
                className="relative group text-left transition-all duration-200 w-full"
              >
                <Card className={cn(
                  "glass p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg",
                  getStatusColor(supplier.status),
                  isActive && "border-primary",
                  supplier.hasNewUpdate && "border-primary shadow-primary/10"
                )}>
                  {/* New Update Indicator */}
                  {supplier.hasNewUpdate && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="bg-primary text-white border-0 rounded-full px-2 py-1 text-xs shadow-lg">
                        New
                      </Badge>
                    </div>
                  )}

                  {/* Agent Seat Label */}
                  <div className="absolute -left-2 lg:-left-3 top-1/2 -translate-y-1/2 w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {String.fromCharCode(65 + index)}
                  </div>

                  <div className="pl-8 lg:pl-10 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm lg:text-base mb-1 truncate">{supplier.name}</h4>
                      {supplier.lastUpdate && (
                        <p className="text-xs text-muted-foreground">
                          {supplier.lastUpdate.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      {getStatusIcon(supplier.status)}
                    </div>
                  </div>

                  {/* Status Bar */}
                  <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden mt-3 ml-8 lg:ml-10">
                    <div 
                      className={cn(
                        "h-full transition-all duration-500",
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
