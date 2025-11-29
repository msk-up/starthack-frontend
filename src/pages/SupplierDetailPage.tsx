import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
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
                <p className="text-muted-foreground text-base">{supplier.location}</p>
              </div>
              {conversation && (
                <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
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
          <Card className="p-6 border">
            <h3 className="mb-5 text-lg font-semibold">AI Conversation Summary</h3>
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 border-l-2 border-muted rounded-md">
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Agent</p>
                <p className="text-sm">
                  Requested quote for bulk order with volume discount. Asked about delivery timeline and payment terms.
                </p>
              </div>
              {conversation && (
                <div className="bg-muted/30 p-4 border-l-2 border-foreground rounded-md">
                  <p className="mb-2 text-xs font-medium text-foreground uppercase tracking-wide">Supplier Response</p>
                  <p className="text-sm">{conversation.lastMessage}</p>
                </div>
              )}
            </div>
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
