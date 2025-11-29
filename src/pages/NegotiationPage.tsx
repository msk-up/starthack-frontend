import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, MessageSquare, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { mockSuppliers, mockConversations, mockOffers, getOffersByCategory } from '@/lib/mockData';
import { CATEGORIES, ProductCategory, Offer } from '@/types/procurement';
import { cn } from '@/lib/utils';

export default function NegotiationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const selectedSupplierIds = searchParams.getAll('supplier');
  
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('computers');
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [potentialOffers, setPotentialOffers] = useState<string[]>(['o1', 'o2', 'o3']);

  const selectedSuppliers = mockSuppliers.filter((s) => selectedSupplierIds.includes(s.id));
  const categorizedSuppliers = selectedSuppliers.filter((s) => s.category === activeCategory);
  const categoryOffers = getOffersByCategory(activeCategory);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'offer_received':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'negotiating':
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case 'waiting':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

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

  const addToPotential = (offerId: string) => {
    if (!potentialOffers.includes(offerId)) {
      setPotentialOffers([...potentialOffers, offerId]);
    }
  };

  const handleCompare = () => {
    const offerIds = categoryOffers.filter((o) => potentialOffers.includes(o.id)).map((o) => o.id);
    if (offerIds.length >= 2) {
      const params = new URLSearchParams();
      offerIds.forEach(id => params.append('offer', id));
      navigate(`/compare?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold">Negotiation Dashboard</h1>
              </div>
            </div>
            <Badge variant="secondary">{selectedSuppliers.length} Active Suppliers</Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto flex gap-6 p-6">
        {/* Left Panel - Suppliers by Category */}
        <div className="w-80 shrink-0">
          <Card className="glass sticky top-24 p-4">
            <h3 className="mb-4 font-semibold">Product Categories</h3>
            <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as ProductCategory)}>
              <TabsList className="grid w-full grid-cols-1 gap-2">
                {CATEGORIES.map((cat) => {
                  const count = selectedSuppliers.filter((s) => s.category === cat.value).length;
                  return count > 0 ? (
                    <TabsTrigger
                      key={cat.value}
                      value={cat.value}
                      className="justify-between"
                    >
                      {cat.label}
                      <Badge variant="secondary" className="ml-2">
                        {count}
                      </Badge>
                    </TabsTrigger>
                  ) : null;
                })}
              </TabsList>
            </Tabs>

            <div className="mt-6 space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {CATEGORIES.find((c) => c.value === activeCategory)?.label} Suppliers
              </h4>
              <ScrollArea className="h-[400px]">
                {categorizedSuppliers.map((supplier) => {
                  const conv = mockConversations.find((c) => c.supplierId === supplier.id);
                  return (
                    <button
                      key={supplier.id}
                      onClick={() => setSelectedSupplier(supplier.id)}
                      className={cn(
                        'mb-2 w-full rounded-lg border p-3 text-left transition-all hover:border-primary',
                        selectedSupplier === supplier.id ? 'border-primary bg-primary/5' : 'border-border'
                      )}
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <p className="font-medium">{supplier.name}</p>
                        {conv && getStatusIcon(conv.status)}
                      </div>
                      {conv && (
                        <>
                          <p className="mb-2 text-xs text-muted-foreground">{getStatusLabel(conv.status)}</p>
                          <Progress value={conv.progress} className="h-1" />
                        </>
                      )}
                    </button>
                  );
                })}
              </ScrollArea>
            </div>
          </Card>
        </div>

        {/* Right Panel - Conversation & Offers */}
        <div className="flex-1">
          {selectedSupplier ? (
            <SupplierDetail
              supplierId={selectedSupplier}
              onAddToPotential={addToPotential}
              isPotential={categoryOffers.some(
                (o) => o.supplierId === selectedSupplier && potentialOffers.includes(o.id)
              )}
            />
          ) : (
            <Card className="glass flex h-96 items-center justify-center p-12 text-center">
              <div>
                <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-semibold">Select a Supplier</h3>
                <p className="text-muted-foreground">
                  Choose a supplier from the left panel to view their conversation and offers
                </p>
              </div>
            </Card>
          )}

          {/* Compare Button */}
          {categoryOffers.some((o) => potentialOffers.includes(o.id)) && (
            <div className="mt-6 flex justify-end">
              <Button size="lg" onClick={handleCompare} className="gap-2">
                Compare Offers
                <Badge variant="secondary" className="ml-2">
                  {categoryOffers.filter((o) => potentialOffers.includes(o.id)).length}
                </Badge>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SupplierDetail({
  supplierId,
  onAddToPotential,
  isPotential,
}: {
  supplierId: string;
  onAddToPotential: (offerId: string) => void;
  isPotential: boolean;
}) {
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

  if (!supplier) return null;

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card className="glass p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="mb-1 text-2xl font-semibold">{supplier.name}</h2>
            <p className="text-muted-foreground">{supplier.location}</p>
          </div>
          {conversation && (
            <Badge variant="secondary" className="gap-1">
              {getStatusLabel(conversation.status)}
            </Badge>
          )}
        </div>

        {conversation && (
          <>
            <div className="mb-2">
              <Progress value={conversation.progress} className="h-2" />
            </div>
            <p className="text-sm text-muted-foreground">
              Last update: {conversation.timestamp.toLocaleTimeString()}
            </p>
          </>
        )}
      </Card>

      {/* Conversation Summary */}
      <Card className="glass p-6">
        <h3 className="mb-4 font-semibold">AI Conversation Summary</h3>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="mb-1 text-xs font-medium text-muted-foreground">AI Agent</p>
            <p className="text-sm">
              Requested quote for bulk order with volume discount. Asked about delivery timeline and payment terms.
            </p>
          </div>
          {conversation && (
            <div className="rounded-lg bg-primary/5 p-4">
              <p className="mb-1 text-xs font-medium text-primary">Supplier Response</p>
              <p className="text-sm">{conversation.lastMessage}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Offer Details */}
      {offer && (
        <Card className={cn('glass p-6', offer.isWinner && 'border-success ring-2 ring-success/20')}>
          <div className="mb-4 flex items-start justify-between">
            <h3 className="font-semibold">Offer Details</h3>
            {offer.isWinner && (
              <Badge variant="default" className="bg-success">
                Winner
              </Badge>
            )}
          </div>

          <div className="mb-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price</span>
              <span className="text-xl font-bold text-primary">
                ${offer.price.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery Time</span>
              <span className="font-medium">{offer.deliveryTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Terms</span>
              <span className="max-w-xs text-right font-medium">{offer.terms}</span>
            </div>
          </div>

          <div className="mb-4 rounded-lg bg-muted/30 p-4">
            <p className="text-sm">{offer.summary}</p>
          </div>

          {!offer.isWinner && !isPotential && (
            <Button onClick={() => onAddToPotential(offer.id)} className="w-full" variant="outline">
              Add to Potential Offers
            </Button>
          )}
          {isPotential && !offer.isWinner && (
            <Badge variant="secondary" className="w-full justify-center py-2">
              Added to Potential Offers
            </Badge>
          )}
        </Card>
      )}
    </div>
  );
}
