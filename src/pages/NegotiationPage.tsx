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
      <header className="glass sticky top-0 z-50 border-b backdrop-blur-2xl">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="glass" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-primary to-secondary p-2 shadow-lg glow-primary">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Negotiation Dashboard</h1>
              </div>
            </div>
            <Badge className="px-4 py-2 text-sm font-semibold rounded-full bg-primary/10 text-primary border-primary/20">{selectedSuppliers.length} Active Suppliers</Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto flex gap-6 p-6">
        {/* Left Panel - Suppliers by Category */}
        <div className="w-80 shrink-0 space-y-6">
          {/* Product Categories Section */}
          <Card className="glass sticky top-24 p-6 rounded-2xl shadow-2xl min-h-[280px]">
            <h3 className="mb-6 text-lg font-bold">Product Categories</h3>
            <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as ProductCategory)}>
              <TabsList className="grid w-full grid-cols-1 gap-3 bg-transparent p-0">
                {CATEGORIES.map((cat) => {
                  const count = selectedSuppliers.filter((s) => s.category === cat.value).length;
                  return count > 0 ? (
                    <TabsTrigger
                      key={cat.value}
                      value={cat.value}
                      className="justify-between data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-lg rounded-xl py-3"
                    >
                      <span className="font-semibold">{cat.label}</span>
                      <Badge className="ml-2 bg-primary/20 text-primary border-0 rounded-full">
                        {count}
                      </Badge>
                    </TabsTrigger>
                  ) : null;
                })}
              </TabsList>
            </Tabs>
          </Card>

          {/* Suppliers List Section */}
          <Card className="glass p-6 rounded-2xl shadow-2xl">
            <h4 className="mb-4 text-sm font-bold text-muted-foreground uppercase tracking-wide">
              {CATEGORIES.find((c) => c.value === activeCategory)?.label} Suppliers
            </h4>
            <ScrollArea className="h-[450px]">
              <div className="space-y-3 pr-4">
                {categorizedSuppliers.map((supplier) => {
                  const conv = mockConversations.find((c) => c.supplierId === supplier.id);
                  return (
                    <button
                      key={supplier.id}
                      onClick={() => setSelectedSupplier(supplier.id)}
                      className={cn(
                        'w-full rounded-xl border-2 p-4 text-left transition-all hover:scale-[1.02]',
                        selectedSupplier === supplier.id 
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                          : 'border-border glass hover:border-primary/40'
                      )}
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <p className="font-bold text-base">{supplier.name}</p>
                        {conv && getStatusIcon(conv.status)}
                      </div>
                      {conv && (
                        <>
                          <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{getStatusLabel(conv.status)}</p>
                          <Progress value={conv.progress} className="h-2" />
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
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
            <div className="mt-8 flex justify-end">
              <Button size="lg" variant="gradientAccent" onClick={handleCompare} className="gap-3 shadow-2xl text-base px-12">
                Compare Offers
                <Badge className="ml-2 bg-white/20 text-white border-0 rounded-full px-3 py-1">
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
        <Card className={cn('glass p-8 rounded-2xl shadow-2xl', offer.isWinner && 'border-success border-2 ring-4 ring-success/20 shadow-success/20')}>
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
              <span className="text-4xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
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

          {!offer.isWinner && !isPotential && (
            <Button onClick={() => onAddToPotential(offer.id)} className="w-full" variant="glassPrimary" size="lg">
              Add to Potential Offers
            </Button>
          )}
          {isPotential && !offer.isWinner && (
            <Badge className="w-full justify-center py-3 bg-success/10 text-success border-success/20 rounded-xl text-base">
              Added to Potential Offers
            </Badge>
          )}
        </Card>
      )}
    </div>
  );
}
