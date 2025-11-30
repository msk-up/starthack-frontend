import { useState, useEffect, useRef } from 'react';
import { Zap, CheckCircle, Clock, AlertCircle, MessageSquare, Send, Search, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import TinderToneSelector from './TinderToneSelector';

interface SupplierSeat {
  id: string;
  name: string;
  status: 'idle' | 'processing' | 'offer_received' | 'waiting';
  lastUpdate?: Date;
  hasNewUpdate?: boolean;
  unreadCount?: number;
  hasOutcome?: boolean;
}

interface OrchestrationVisualProps {
  suppliers: SupplierSeat[];
  onSupplierClick: (id: string) => void;
  isProcessing: boolean;
  onPromptSubmit: (prompt: string, tones: string[]) => void;
  initialPrompt?: string;
  initialTones?: string[];
  initialHasPromptBeenSent?: boolean;
}

export default function OrchestrationVisual({ 
  suppliers, 
  onSupplierClick,
  isProcessing,
  onPromptSubmit,
  initialPrompt,
  initialTones,
  initialHasPromptBeenSent = false
}: OrchestrationVisualProps) {
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const [showToneSelector, setShowToneSelector] = useState(false);
  const [researchingSuppliers, setResearchingSuppliers] = useState<Set<string>>(new Set());
  const [supplierStates, setSupplierStates] = useState<Record<string, { unreadCount: number; hasOutcome: boolean }>>({});
  const [selectedTones, setSelectedTones] = useState<string[]>(initialTones || []);
  const [hasPromptBeenSent, setHasPromptBeenSent] = useState(initialHasPromptBeenSent);
  const [toneSelectorKey, setToneSelectorKey] = useState(0);
  const animationStarted = useRef(false);
  const hasInitiatedNegotiation = useRef(initialHasPromptBeenSent);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      setHasPromptBeenSent(initialHasPromptBeenSent);
      hasInitiatedNegotiation.current = initialHasPromptBeenSent;
    }
    if (initialTones && initialTones.length > 0) {
      setSelectedTones(initialTones);
    }
  }, [initialPrompt, initialHasPromptBeenSent, initialTones]);

  // Initialize supplier states with mock data
  useEffect(() => {
    const initialStates: Record<string, { unreadCount: number; hasOutcome: boolean }> = {};
    suppliers.forEach((supplier, idx) => {
      initialStates[supplier.id] = {
        unreadCount: supplier.unreadCount || (idx === 0 ? 3 : idx === 2 ? 1 : 0),
        hasOutcome: supplier.hasOutcome || idx === 1,
      };
    });
    setSupplierStates(initialStates);
  }, [suppliers]);

  useEffect(() => {
    if (isProcessing && !animationStarted.current && !showToneSelector) {
      animationStarted.current = true;
      let currentIndex = 0;
      
      const animate = () => {
        if (currentIndex < suppliers.length) {
          setAnimatingIndex(currentIndex);
          currentIndex++;
          setTimeout(animate, 400);
        } else {
          setAnimatingIndex(null);
        }
      };
      
      animate();
    } else if (!isProcessing) {
      animationStarted.current = false;
    }
  }, [isProcessing, suppliers.length, showToneSelector]);

  const handleSubmit = () => {
    if (prompt.trim() && !isProcessing && !hasInitiatedNegotiation.current && suppliers.length > 0) {
      console.log('[Orchestration] starting negotiation', {
        prompt,
        suppliers: suppliers.map((s) => ({ id: s.id, name: s.name, status: s.status })),
        isProcessing,
        hasInitiatedNegotiation: hasInitiatedNegotiation.current,
        showToneSelector,
      });
      setToneSelectorKey((k) => k + 1); // force remount for a fresh flow
      setShowToneSelector(true);
    }
  };

  const handleToneSelectionComplete = (tones: string[]) => {
    console.log('Selected tones:', tones);
    setSelectedTones(tones);
    setShowToneSelector(false);
    setHasPromptBeenSent(true);
    hasInitiatedNegotiation.current = true;
    
    // Start researching animation for all suppliers
    const allSupplierIds = new Set(suppliers.map(s => s.id));
    setResearchingSuppliers(allSupplierIds);
    
    // Clear researching state after random time (3-7 seconds) per supplier
    suppliers.forEach(supplier => {
      const delay = 3000 + Math.random() * 4000;
      setTimeout(() => {
        setResearchingSuppliers(prev => {
          const next = new Set(prev);
          next.delete(supplier.id);
          return next;
        });
      }, delay);
    });
    
    // Trigger the actual processing after a short delay
    // Pass the prompt and selected tones
    setTimeout(() => {
      onPromptSubmit(prompt, tones);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const getStatusIcon = (status: string, isResearching: boolean) => {
    if (isResearching) {
      return <Search className="h-4 w-4 animate-pulse" />;
    }
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

  return (
    <>
      {(() => {
        console.log('[Orchestration render]', { showToneSelector, suppliersLen: suppliers.length });
        return null;
      })()}
      {showToneSelector && suppliers.length > 0 && (
        <TinderToneSelector
          key={toneSelectorKey}
          supplierNames={suppliers.map(s => s.name).filter(Boolean)}
          onComplete={handleToneSelectionComplete}
        />
      )}
      
      <div className={cn(
        "flex items-center gap-6 w-full max-w-7xl mx-auto py-8 transition-all duration-500",
        !hasPromptBeenSent && "justify-center"
      )}>
        {/* Orchestration Agent with Prompt - Left Side */}
        <div className={cn(
          "flex-shrink-0 transition-all duration-500",
          !hasPromptBeenSent ? "w-full max-w-2xl" : "w-[420px]"
        )}>
          <Card className={cn(
            "border bg-card transition-all duration-300",
            isProcessing && "border-foreground"
          )}>
            <div className="p-6">
              {/* Agent Header */}
              <div className="flex items-center gap-3 mb-5">
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

              {/* Tabs - Only show after prompt is sent */}
              {hasPromptBeenSent ? (
                <Tabs defaultValue="prompt" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="prompt" className="gap-2">
                      <Send className="h-4 w-4" />
                      Prompt
                    </TabsTrigger>
                    <TabsTrigger value="suppliers" className="gap-2">
                      <Users className="h-4 w-4" />
                      Suppliers ({suppliers.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="prompt" className="space-y-3 mt-0">
                    <label className="text-sm font-medium text-foreground">
                      Negotiation Prompt
                    </label>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="e.g., Request best pricing for bulk order of 100 units with 30-day payment terms..."
                      className="min-h-[140px] resize-none border focus:border-foreground"
                      disabled={isProcessing || hasInitiatedNegotiation.current}
                    />

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-xs text-muted-foreground">
                        Cmd + Enter to send
                      </p>
                      <Button
                        onClick={handleSubmit}
                        disabled={!prompt.trim() || isProcessing || hasInitiatedNegotiation.current}
                        variant="default"
                        size="sm"
                        className="gap-2"
                      >
                        <Send className="h-4 w-4" />
                        Send
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="suppliers" className="mt-0">
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {suppliers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No suppliers selected
                        </p>
                      ) : (
                        suppliers.map((supplier) => (
                          <div
                            key={supplier.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => onSupplierClick(supplier.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
                                <Users className="h-4 w-4 text-foreground" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{supplier.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {supplier.status}
                                </p>
                              </div>
                            </div>
                            {supplier.hasNewUpdate && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    Negotiation Prompt
                  </label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g., Request best pricing for bulk order of 100 units with 30-day payment terms..."
                    className="min-h-[200px] resize-none border focus:border-foreground"
                    disabled={isProcessing || hasInitiatedNegotiation.current}
                  />

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-muted-foreground">
                      Cmd + Enter to send
                    </p>
                    <Button
                      onClick={handleSubmit}
                      disabled={!prompt.trim() || isProcessing || hasInitiatedNegotiation.current}
                      variant="default"
                      size="default"
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Send
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Connection Lines - Visual Flow */}
        {hasPromptBeenSent && (
          <div className="relative flex-shrink-0 transition-all duration-500" style={{ width: '100px', height: `${suppliers.length * 120}px` }}>
            {suppliers.map((_, index) => {
              const yStart = (suppliers.length * 120) / 2;
              const yEnd = (index * 120) + 60;
              const isAnimating = animatingIndex === index;
              
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
                    stroke={isAnimating ? "hsl(var(--foreground))" : "hsl(var(--border))"}
                    strokeWidth={isAnimating ? "2" : "1"}
                    strokeDasharray="4,4"
                    className="transition-all duration-300"
                  />
                </svg>
              );
            })}
          </div>
        )}

        {/* Supplier Seats - Right Side */}
        {hasPromptBeenSent && (
          <div className="flex-1 min-w-0 max-w-2xl transition-all duration-500">
            <div className="space-y-4">
              {suppliers.map((supplier, index) => {
                const isAnimating = animatingIndex === index;
                const isResearching = researchingSuppliers.has(supplier.id);
                const state = supplierStates[supplier.id] || { unreadCount: 0, hasOutcome: false };
                
                return (
                  <button
                    key={supplier.id}
                    onClick={() => onSupplierClick(supplier.id)}
                    className="relative group text-left transition-all duration-200 w-full block"
                    style={{ height: '112px' }}
                  >
                    <Card className={cn(
                      "border bg-card transition-all duration-200 hover:border-foreground h-full flex items-center relative",
                      isAnimating && "border-foreground",
                      isResearching && "border-muted-foreground/50",
                      state.hasOutcome && state.unreadCount > 0 && "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                    )}>
                      {/* Unread Count Badge */}
                      {state.unreadCount > 0 && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <div className="w-6 h-6 rounded-full bg-destructive flex items-center justify-center">
                            <span className="text-xs font-bold text-destructive-foreground">
                              {state.unreadCount}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Seat Label */}
                      <div className={cn(
                        "absolute -left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-background font-semibold text-sm transition-all",
                        isResearching && "animate-pulse"
                      )}>
                        {String.fromCharCode(65 + index)}
                      </div>

                      <div className="pl-8 pr-4 flex items-center justify-between gap-4 w-full">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-base truncate">{supplier.name}</h4>
                            {supplier.hasNewUpdate && (
                              <span className="text-xs font-medium text-muted-foreground">New</span>
                            )}
                          </div>
                          {isResearching ? (
                            <p className="text-xs text-muted-foreground animate-pulse">
                              Researching supplier...
                            </p>
                          ) : (
                            supplier.lastUpdate && (
                              <p className="text-xs text-muted-foreground">
                                Last update: {supplier.lastUpdate.toLocaleTimeString()}
                              </p>
                            )
                          )}
                          {/* Progress Bar */}
                          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                            {isResearching ? (
                              <div className="h-full w-1/3 bg-foreground/50 animate-shimmer" />
                            ) : (
                              <div 
                                className={cn(
                                  "h-full transition-all duration-500 bg-foreground",
                                  supplier.status === 'offer_received' && "w-full",
                                  supplier.status === 'processing' && "w-2/3",
                                  supplier.status === 'waiting' && "w-1/3"
                                )}
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusIcon(supplier.status, isResearching)}
                        </div>
                      </div>
                    </Card>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
