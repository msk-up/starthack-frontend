import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, MessageSquare, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockSuppliers, mockConversations, mockOffers } from '@/lib/mockData';
import { cn } from '@/lib/utils';

export default function SupplierDetailPage() {
  const navigate = useNavigate();
  const { supplierId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const category = searchParams.get('category');

  const supplier = mockSuppliers.find((s) => s.id === supplierId);
  const conversation = mockConversations.find((c) => c.supplierId === supplierId);
  const offer = mockOffers.find((o) => o.supplierId === supplierId);

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
        <Card className="glass p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Supplier Not Found</h2>
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
      <header className="glass sticky top-0 z-50 border-b backdrop-blur-2xl">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-semibold tracking-tight">Supplier Details</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 max-w-5xl">
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="glass p-8 rounded-2xl shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="mb-2 text-3xl font-bold">{supplier.name}</h2>
                <p className="text-muted-foreground text-lg">{supplier.location}</p>
              </div>
              {conversation && (
                <Badge className="gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary border-primary/20 font-semibold">
                  {getStatusLabel(conversation.status)}
                </Badge>
              )}
            </div>

            {conversation && (
              <>
                <div className="mb-3">
                  <Progress value={conversation.progress} className="h-3" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  Last update: {conversation.timestamp.toLocaleTimeString()}
                </p>
              </>
            )}
          </Card>

          {/* Conversation Summary */}
          <Card className="glass p-8 rounded-2xl shadow-2xl">
            <h3 className="mb-6 text-xl font-bold">AI Conversation Summary</h3>
            <div className="space-y-5">
              <div className="rounded-2xl bg-muted/50 p-6 border-l-4 border-muted">
                <p className="mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">AI Agent</p>
                <p className="text-base">
                  Requested quote for bulk order with volume discount. Asked about delivery timeline and payment terms.
                </p>
              </div>
              {conversation && (
                <div className="rounded-2xl bg-primary/5 p-6 border-l-4 border-primary">
                  <p className="mb-2 text-xs font-bold text-primary uppercase tracking-wide">Supplier Response</p>
                  <p className="text-base">{conversation.lastMessage}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Offer Details */}
          {offer && (
            <Card className={cn(
              'glass p-8 rounded-2xl shadow-2xl',
              offer.isWinner && 'border-success border-2 ring-4 ring-success/20 shadow-success/20'
            )}>
              <div className="mb-6 flex items-start justify-between">
                <h3 className="text-xl font-bold">Offer Details</h3>
                {offer.isWinner && (
                  <Badge className="bg-gradient-to-r from-success to-success/80 text-white border-0 px-4 py-2 shadow-lg rounded-xl text-base">
                    Winner
                  </Badge>
                )}
              </div>

              <div className="mb-8 space-y-4">
                <div className="flex justify-between items-baseline rounded-2xl bg-primary/5 p-6">
                  <span className="text-muted-foreground font-semibold text-lg">Price</span>
                  <span className="text-4xl font-black text-foreground">
                    ${offer.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-base rounded-xl bg-muted/30 p-4">
                  <span className="text-muted-foreground font-semibold">Delivery Time</span>
                  <span className="font-bold">{offer.deliveryTime}</span>
                </div>
                <div className="flex justify-between items-center text-base rounded-xl bg-muted/30 p-4">
                  <span className="text-muted-foreground font-semibold">Terms</span>
                  <span className="max-w-xs text-right font-bold">{offer.terms}</span>
                </div>
              </div>

              <div className="mb-6 rounded-2xl bg-muted/40 p-6 border border-muted">
                <p className="text-base leading-relaxed">{offer.summary}</p>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={() => navigate('/compare')} 
                  className="flex-1" 
                  variant="default" 
                  size="lg"
                >
                  Add to Comparison
                </Button>
                <Button 
                  onClick={() => navigate(-1)} 
                  variant="outline" 
                  size="lg"
                >
                  Back to Dashboard
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
