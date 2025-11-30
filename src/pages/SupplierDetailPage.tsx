import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MessageSquare, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { mockSuppliers, mockConversations, mockOffers } from '@/lib/mockData';
import { Supplier } from '@/types/procurement';
import { getConversation, type Message } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SupplierWithProducts {
  id: string;
  name: string;
  category: string;
  products: any[];
}

interface SupplierDetailState {
  suppliers?: SupplierWithProducts[];
  negotiationId?: string | number;
}

export default function SupplierDetailPage() {
  const navigate = useNavigate();
  const { supplierId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const category = searchParams.get('category');
  const negotiationIdFromUrl = searchParams.get('negotiation_id');

  // Get state from location
  const state = location.state as SupplierDetailState | undefined;
  const negotiationId = state?.negotiationId || negotiationIdFromUrl;
  
  // Debug logging
  console.log('SupplierDetailPage render:', {
    supplierId,
    negotiationId,
    negotiationIdFromUrl,
    state,
    hasState: !!state,
    hasNegotiationIdInState: !!state?.negotiationId
  });

  // Try to get supplier from location state (passed from NegotiationPage)
  const suppliersFromState = state?.suppliers;
  const supplierFromState = suppliersFromState?.find((s) => s.id === supplierId);
  
  // Fallback to mock data if not found in state
  const mockSupplier = mockSuppliers.find((s) => s.id === supplierId);
  
  // Use supplier from state if available, otherwise use mock
  const supplier: Supplier | null = supplierFromState 
    ? {
        id: supplierFromState.id,
        name: supplierFromState.name,
        category: supplierFromState.category as any,
        rating: 0,
        responseTime: '',
        priceRange: '',
        location: '',
      }
    : mockSupplier || null;
    
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mockConversation = mockConversations.find((c) => c.supplierId === supplierId);
  const offer = mockOffers.find((o) => o.supplierId === supplierId);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Fetch messages from backend if negotiation_id is available
  useEffect(() => {
    const fetchMessages = async () => {
      console.log('Fetching messages with:', { negotiationId, supplierId, state });
      
      if (!negotiationId) {
        console.warn('No negotiationId available. State:', state);
        return;
      }
      
      if (!supplierId) {
        console.warn('No supplierId available');
        return;
      }
      
      setLoadingMessages(true);
      setFetchError(null);
      try {
        console.log(`Calling getConversation with negotiationId: ${negotiationId}, supplierId: ${supplierId}`);
        const fetchedMessages = await getConversation(String(negotiationId), String(supplierId));
        console.log('Raw fetched messages:', fetchedMessages);
        
        // Sort messages by timestamp
        const sortedMessages = [...fetchedMessages].sort((a, b) => {
          const timeA = new Date(a.timestamp || a.created_at || 0).getTime();
          const timeB = new Date(b.timestamp || b.created_at || 0).getTime();
          return timeA - timeB;
        });
        
        console.log('Sorted messages:', sortedMessages);
        setMessages(sortedMessages);
        
        // If we got empty array but have negotiationId, it might be a CORS issue
        if (sortedMessages.length === 0 && negotiationId) {
          // Check if there was a network error (likely CORS)
          const errorCheck = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5147'}/health`).catch(() => null);
          if (!errorCheck || !errorCheck.ok) {
            setFetchError('CORS_ERROR');
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
        // Check if it's a CORS error
        if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('CORS'))) {
          setFetchError('CORS_ERROR');
        } else {
          setFetchError('NETWORK_ERROR');
        }
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [negotiationId, supplierId, state]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'offer_received':
        return 'Offer Received';
      case 'negotiating':
        return 'Negotiating';
      case 'waiting':
        return 'Waiting';
      default:
        return 'Unknown';
    }
  };

  if (!supplier) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center border">
          <h2 className="text-xl font-semibold mb-4">Supplier Not Found</h2>
          <Button onClick={() => navigate(-1)} variant="default">
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-title font-light tracking-tight">Supplier Details</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 max-w-5xl">
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="p-6 border">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="mb-2 text-2xl font-title font-light">{supplier.name}</h2>
                {supplier.location && (
                  <p className="text-muted-foreground text-base">{supplier.location}</p>
                )}
              </div>
              {(mockConversation || messages.length > 0) && (
                <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                  {mockConversation ? getStatusLabel(mockConversation.status) : 'Active'}
                </Badge>
              )}
            </div>

            {mockConversation && (
              <>
                <div className="mb-3">
                  <Progress value={mockConversation.progress} className="h-3" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  Last update: {mockConversation.timestamp.toLocaleTimeString()}
                </p>
              </>
            )}
          </Card>

          {/* Conversation Messages */}
          <Card className="p-6 border">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Conversation</h3>
              {negotiationId && (
                <Badge variant="secondary" className="text-xs">
                  Negotiation: {String(negotiationId).substring(0, 8)}...
                </Badge>
              )}
            </div>
            
            {loadingMessages ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Loading messages...</p>
              </div>
            ) : messages.length > 0 ? (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {messages.map((message, index) => {
                    // Determine if message is from negotiator/agent (our side) or supplier
                    // Roles: 'agent', 'negotiator', 'user' = our side (left)
                    // Roles: 'supplier', or no role but from supplier = supplier side (right)
                    const role = (message.role || '').toLowerCase();
                    const isNegotiator = role === 'agent' || role === 'negotiator' || role === 'user' || !role;
                    const isSupplier = role === 'supplier' || role === 'supplier_response';
                    
                    // Default to negotiator if unclear, but prefer supplier if explicitly marked
                    const isFromNegotiator = isNegotiator && !isSupplier;
                    
                    // Backend might return 'message' field instead of 'content'
                    const messageContent = message.content || message.message || message.text || message.body || '';
                    const timestamp = message.timestamp || message.created_at || message.sent_at || message.date || '';
                    
                    // Format timestamp
                    const formatTime = (ts: string) => {
                      if (!ts) return '';
                      const date = new Date(ts);
                      const now = new Date();
                      const isToday = date.toDateString() === now.toDateString();
                      
                      if (isToday) {
                        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                      }
                      return date.toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit' 
                      });
                    };
                    
                    return (
                      <div
                        key={message.message_id || message.id || index}
                        className={cn(
                          "flex gap-3 items-start",
                          isFromNegotiator ? "justify-start" : "justify-end"
                        )}
                      >
                        {isFromNegotiator && (
                          <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot className="h-4 w-4 text-background" />
                          </div>
                        )}
                        <div className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-3 shadow-sm",
                          isFromNegotiator 
                            ? "bg-muted/60 rounded-tl-sm" 
                            : "bg-foreground text-background rounded-tr-sm"
                        )}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={cn(
                              "text-xs font-semibold uppercase tracking-wide",
                              isFromNegotiator ? "text-muted-foreground" : "text-background/80"
                            )}>
                              {isFromNegotiator ? 'Negotiator' : supplier.name}
                            </span>
                            {timestamp && (
                              <span className={cn(
                                "text-xs",
                                isFromNegotiator ? "text-muted-foreground/70" : "text-background/70"
                              )}>
                                {formatTime(timestamp)}
                              </span>
                            )}
                          </div>
                          <p className={cn(
                            "text-sm leading-relaxed whitespace-pre-wrap break-words",
                            isFromNegotiator ? "text-foreground" : "text-background"
                          )}>
                            {messageContent}
                          </p>
                        </div>
                        {!isFromNegotiator && (
                          <div className="w-8 h-8 rounded-full bg-muted border-2 border-foreground/20 flex items-center justify-center flex-shrink-0 mt-1">
                            <User className="h-4 w-4 text-foreground" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            ) : mockConversation ? (
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 border-l-2 border-muted rounded-md">
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Agent</p>
                  <p className="text-sm">
                    Requested quote for bulk order with volume discount. Asked about delivery timeline and payment terms.
                  </p>
                </div>
                <div className="bg-muted/30 p-4 border-l-2 border-foreground rounded-md">
                  <p className="mb-2 text-xs font-medium text-foreground uppercase tracking-wide">Supplier Response</p>
                  <p className="text-sm">{mockConversation.lastMessage}</p>
                </div>
              </div>
            ) : fetchError === 'CORS_ERROR' ? (
              <div className="text-center py-8">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm font-semibold text-destructive mb-2">CORS Configuration Error</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    The backend is not allowing requests from this origin. Please ensure the backend CORS settings include:
                  </p>
                  <code className="text-xs bg-muted px-2 py-1 rounded block text-left">
                    http://localhost:8081
                  </code>
                  <p className="text-xs text-muted-foreground mt-3">
                    Backend needs to be restarted after CORS configuration changes.
                  </p>
                </div>
              </div>
            ) : fetchError === 'NETWORK_ERROR' ? (
              <div className="text-center py-8">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm font-semibold text-destructive mb-2">Network Error</p>
                  <p className="text-xs text-muted-foreground">
                    Could not connect to the backend. Please check if the backend is running.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No conversation messages available</p>
                {!negotiationId ? (
                  <p className="text-xs text-muted-foreground mt-2">
                    Open this supplier from an active negotiation to see messages
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    No messages found for this negotiation and supplier
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Offer Details */}
          {offer && (
            <Card className={cn(
              'p-6 border',
              offer.isWinner && 'border-2'
            )}>
              <div className="mb-5 flex items-start justify-between">
                <h3 className="text-lg font-semibold">Offer Details</h3>
                {offer.isWinner && (
                  <Badge variant="default" className="px-3 py-1 text-sm font-medium">
                    Winner
                  </Badge>
                )}
              </div>

              <div className="mb-6 space-y-3">
                <div className="flex justify-between items-baseline bg-muted/30 p-4 rounded-md">
                  <span className="text-muted-foreground font-medium text-base">Price</span>
                  <span className="text-3xl font-semibold text-foreground">
                    ${offer.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm bg-muted/50 p-3 rounded-md">
                  <span className="text-muted-foreground font-medium">Delivery Time</span>
                  <span className="font-semibold">{offer.deliveryTime}</span>
                </div>
                <div className="flex justify-between items-center text-sm bg-muted/50 p-3 rounded-md">
                  <span className="text-muted-foreground font-medium">Terms</span>
                  <span className="max-w-xs text-right font-semibold">{offer.terms}</span>
                </div>
              </div>

              <div className="mb-6 bg-muted/30 p-4 border rounded-md">
                <p className="text-sm leading-relaxed">{offer.summary}</p>
              </div>

              <Button 
                onClick={() => navigate(-1)} 
                variant="outline" 
                size="lg"
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
