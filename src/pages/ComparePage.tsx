import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, TrendingUp, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockOffers } from '@/lib/mockData';
import { Offer } from '@/types/procurement';
import { cn } from '@/lib/utils';

export default function ComparePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const offerIds = searchParams.getAll('offer');
  
  const [remainingOffers, setRemainingOffers] = useState<Offer[]>(
    mockOffers.filter((o) => offerIds.includes(o.id))
  );
  const [currentPair, setCurrentPair] = useState<[Offer, Offer] | null>(
    remainingOffers.length >= 2 ? [remainingOffers[0], remainingOffers[1]] : null
  );
  const [winner, setWinner] = useState<Offer | null>(null);

  const handleSelect = (selected: Offer) => {
    if (!currentPair) return;

    const newRemaining = remainingOffers.filter(
      (o) => o.id !== currentPair[0].id && o.id !== currentPair[1].id
    );
    newRemaining.push(selected);

    if (newRemaining.length === 1) {
      // We have a winner!
      setWinner(newRemaining[0]);
      setCurrentPair(null);
    } else {
      // Set up next comparison
      setRemainingOffers(newRemaining);
      setCurrentPair([newRemaining[0], newRemaining[1]]);
    }
  };

  const handleFinish = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold">Compare Offers</h1>
              </div>
            </div>
            {!winner && remainingOffers.length > 0 && (
              <Badge variant="secondary">
                {remainingOffers.length} Offer{remainingOffers.length !== 1 ? 's' : ''} Remaining
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {winner ? (
          // Winner Screen
          <div className="mx-auto max-w-2xl text-center">
            <Trophy className="mx-auto mb-6 h-16 w-16 text-success" />
            <h2 className="mb-4 text-3xl font-bold">Winner Selected!</h2>
            <p className="mb-8 text-muted-foreground">
              This offer has been marked as the winner in your negotiation dashboard
            </p>

            <Card className="glass mb-8 border-success p-8 ring-2 ring-success/20">
              <Badge variant="default" className="mb-4 bg-success">
                Best Offer
              </Badge>
              <h3 className="mb-2 text-2xl font-semibold">{winner.supplierName}</h3>
              <p className="mb-6 text-3xl font-bold text-primary">
                ${winner.price.toLocaleString()}
              </p>

              <div className="space-y-3 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Time</span>
                  <span className="font-medium">{winner.deliveryTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Terms</span>
                  <span className="max-w-xs text-right font-medium">{winner.terms}</span>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-muted/30 p-4">
                <p className="text-sm">{winner.summary}</p>
              </div>
            </Card>

            <Button size="lg" onClick={handleFinish}>
              Return to Dashboard
            </Button>
          </div>
        ) : currentPair ? (
          // Comparison Screen
          <div>
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-semibold">Choose the Better Offer</h2>
              <p className="text-muted-foreground">
                Select the offer you prefer to continue to the next round
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {currentPair.map((offer, index) => (
                <Card
                  key={offer.id}
                  className={cn(
                    'glass glass-hover cursor-pointer p-8 transition-all hover:scale-[1.02]',
                    'hover:border-primary'
                  )}
                  onClick={() => handleSelect(offer)}
                >
                  <Badge variant="secondary" className="mb-4">
                    Option {index + 1}
                  </Badge>
                  <h3 className="mb-2 text-xl font-semibold">{offer.supplierName}</h3>
                  <p className="mb-6 text-3xl font-bold text-primary">
                    ${offer.price.toLocaleString()}
                  </p>

                  <div className="mb-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Time</span>
                      <span className="font-medium">{offer.deliveryTime}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Terms</span>
                      <span className="max-w-xs text-right font-medium">{offer.terms}</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/30 p-4">
                    <p className="text-sm">{offer.summary}</p>
                  </div>

                  <Button className="mt-6 w-full" variant="outline">
                    Select This Offer
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          // Loading/Error State
          <div className="text-center">
            <p className="text-muted-foreground">No offers available for comparison</p>
            <Button className="mt-4" onClick={() => navigate('/')}>
              Go to Search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
