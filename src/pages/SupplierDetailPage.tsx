import {useLocation, useNavigate, useParams} from 'react-router-dom';
import {useEffect, useRef, useState} from 'react';
import {ArrowLeft, Bot, Clock, User} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
// We avoid inner scroll areas for the conversation so the whole page scrolls
import {mockConversations, mockOffers, mockSuppliers} from '@/lib/mockData';
import {ProductCategory, Supplier} from '@/types/procurement';
import {getConversation, type Message} from '@/lib/api';
import {cn} from '@/lib/utils';

interface SupplierWithProducts {
  id: string;
  name: string;
  category: ProductCategory;
  products: unknown[];
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
  
  const mockSupplier = mockSuppliers.find((s) => s.id === supplierId);
  
  // Use supplier from state if available, otherwise use mock
  const supplier: Supplier | null = supplierFromState 
    ? {
        id: supplierFromState.id,
        name: supplierFromState.name,
        category: supplierFromState.category,
        rating: 0,
        responseTime: '',
        priceRange: '',
        location: '',
      }
    : mockSupplier || null;
    
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [,setFetchError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mockConversation = mockConversations.find((c) => c.supplierId === supplierId);
  const offer = mockOffers.find((o) => o.supplierId === supplierId);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // --- Helpers for conversation rendering ---
  const stripReasoningTags = (text: string) => {
    if (!text) return '';
    // Remove <reasoning>...</reasoning> blocks
    return text.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '').trim();
  };

  // Replace placeholder tokens like [Your Name], [Your Full Name] with defaults
  const replacePlaceholders = (text: string) => {
    if (!text) return '';
    const defaults = {
      'Your Name': 'Alex Morgan',
      'Your Full Name': 'Alex Morgan',
      'Your Title': 'Procurement Specialist',
      'Your Company Name': 'Acme Corp',
      'Phone Number': '+1 (555) 012-3456',
      'Email Address': 'alex.morgan@acmecorp.com',
      'Company Website': 'https://www.acmecorp.com',
    } as Record<string, string>;

    // Replace bracketed placeholders case-insensitively
    let out = text.replace(/\[(Your Full Name|Your Name|Your Title|Your Company Name|Phone Number|Email Address|Company Website)/gi, (match, p1) => {
      // Normalize the key capitalization like in defaults
      const key = (p1 as string)
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return defaults[key] || match;
    });

    // Also handle the common hyphen/pipe joined line
    out = out.replace(/\[Your Name/gi, defaults['Your Name']);
    return out;
  };

  // Minimal Markdown renderer that supports **bold**, *italic*, `code`, links, and preserves line breaks
  const RichText = ({ text, className }: { text: string; className?: string }) => {
    // Escape HTML to avoid injection
    const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const renderInline = (s: string, idxBase = 0): (string | JSX.Element)[] => {
      const parts: (string | JSX.Element)[] = [];
      const rest = s;
      let idx = 0;
      // Process code spans first
      const processCode = (input: string) => {
        const segs: (string | JSX.Element)[] = [];
        let m: RegExpExecArray | null;
        const codeRe = /`([^`]+)`/g;
        let lastIndex = 0;
        while ((m = codeRe.exec(input))) {
          if (m.index > lastIndex) segs.push(escapeHtml(input.slice(lastIndex, m.index)));
          segs.push(
            <code key={`code-${idxBase}-${idx++}`} className="rounded bg-muted px-1 py-0.5 text-xs">
              {escapeHtml(m[1])}
            </code>
          );
          lastIndex = m.index + m[0].length;
        }
        if (lastIndex < input.length) segs.push(escapeHtml(input.slice(lastIndex)));
        return segs;
      };

      // After code spans, handle bold, italic, and links by mapping strings
      const applyStyles = (nodes: (string | JSX.Element)[]) =>
        nodes.flatMap((node) => {
          if (typeof node !== 'string') return [node];
          // Links
          const linkified: (string | JSX.Element)[] = [];
          const linkRe = /(https?:\/\/[^\s)]+)|\b([\w.-]+@[\w.-]+\.[A-Za-z]{2,})\b/g;
          let last = 0;
          let match: RegExpExecArray | null;
          while ((match = linkRe.exec(node))) {
            if (match.index > last) linkified.push(node.slice(last, match.index));
            const url = match[1] || `mailto:${match[2]}`;
            const label = match[0];
            linkified.push(
              <a key={`a-${idxBase}-${idx++}`} href={url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                {label}
              </a>
            );
            last = match.index + match[0].length;
          }
          if (last < node.length) linkified.push(node.slice(last));

          // Bold and italic on each string piece
          return linkified.flatMap((piece) => {
            if (typeof piece !== 'string') return [piece];
            // Bold **text**
            const boldRe = /\*\*([^*]+)\*\*/g;
            const acc: (string | JSX.Element)[] = [];
            let lastB = 0;
            let mb: RegExpExecArray | null;
            while ((mb = boldRe.exec(piece))) {
              if (mb.index > lastB) acc.push(piece.slice(lastB, mb.index));
              acc.push(
                <strong key={`b-${idxBase}-${idx++}`} className="font-semibold">
                  {mb[1]}
                </strong>
              );
              lastB = mb.index + mb[0].length;
            }
            if (lastB < piece.length) acc.push(piece.slice(lastB));

            // Italic *text*
              return acc.flatMap((seg) => {
                if (typeof seg !== 'string') return [seg];
                const itRe = /\*([^*]+)\*/g;
                const res: (string | JSX.Element)[] = [];
                let lastI = 0;
                let mi: RegExpExecArray | null;
                while ((mi = itRe.exec(seg))) {
                    if (mi.index > lastI) res.push(seg.slice(lastI, mi.index));
                    res.push(
                        <em key={`i-${idxBase}-${idx++}`} className="italic">
                            {mi[1]}
                        </em>
                    );
                    lastI = mi.index + mi[0].length;
                }
                if (lastI < seg.length) res.push(seg.slice(lastI));
                return res;
            });
          });
        });

      rest.split(/(\r?\n)/).forEach((chunk, ) => {
        if (chunk === '\n' || chunk === '\r\n') {
          parts.push(<br key={`br-${idxBase}-${idx++}`} />);
        } else if (chunk.length) {
          const codeFirst = processCode(chunk);
          parts.push(...applyStyles(codeFirst));
        }
      });
      return parts;
    };

    return <div className={cn('whitespace-pre-wrap leading-relaxed text-sm break-words', className)}>{renderInline(text)}</div>;
  };

  type NormalizedMessage = {
    id: string;
    role: 'negotiator' | 'supplier' | string;
    text: string;
    timestamp: string | null;
  };

  const normalizeMessages = (items: Message[]): NormalizedMessage[] => {
    return (items || []).map((m, idx) => {
      const id = String(m.message_id || m.id || `${idx}`);
      const role = m.role || 'supplier';
      const rawText = (m.message_text ?? m.content ?? (m as { text?: unknown }).text ?? '') as string | undefined;
      const sanitized = stripReasoningTags(String(rawText));
      const text = replacePlaceholders(sanitized);
      const ts = m.message_timestamp || m.timestamp || m.created_at || null;
      return { id, role, text, timestamp: ts };
    });
  };

  const formatTimestamp = (iso?: string | null) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
      }).format(d);
    } catch {
      return String(iso);
    }
  };

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
          const timeA = new Date(a.message_timestamp || a.timestamp || a.created_at || 0).getTime();
          const timeB = new Date(b.message_timestamp || b.timestamp || b.created_at || 0).getTime();
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

  // Removed debug/fallback JSON fetching to keep the UI clean and focused on conversation

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

          {/* Conversation Messages - Messenger-like, no borders, page scrolls */}
          <div className="p-0">
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
            ) : (
              <div className="pr-1">
                {/* Pretty chat layout with subtle animations */}
                <div className="space-y-4">
                  {normalizeMessages(messages).map((m) => {
                    const isBuyer = m.role?.toLowerCase() === 'negotiator';
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          'flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300',
                          isBuyer ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {!isBuyer && (
                          <div className="h-8 w-8 rounded-full bg-muted border flex items-center justify-center text-muted-foreground">
                            <Bot className="h-4 w-4" />
                          </div>
                        )}
                        <div
                          className={cn(
                            'max-w-[80%] rounded-2xl p-3 shadow-sm transition-all',
                            isBuyer
                              ? 'bg-muted/80 text-foreground rounded-br-sm'
                              : 'bg-muted rounded-bl-sm'
                          )}
                        >
                          <RichText text={m.text} />
                          {m.timestamp && (
                            <div className={cn('mt-2 flex items-center gap-1 text-[10px]', isBuyer ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                              <Clock className="h-3 w-3" />
                              <span>{formatTimestamp(m.timestamp)}</span>
                            </div>
                          )}
                        </div>
                        {isBuyer && (
                          <div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Empty state */}
                  {messages.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-12">No messages yet.</div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

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
