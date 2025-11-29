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
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-title font-light tracking-tight">Compare Offers</h1>
            </div>
            {!winner && remainingOffers.length > 0 && (
              <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
                {remainingOffers.length} Offer{remainingOffers.length !== 1 ? 's' : ''} Remaining
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {winner ? (
          // Winner Screen
          <div className="mx-auto max-w-3xl text-center">
            <Trophy className="mx-auto mb-6 h-16 w-16 text-foreground" />
            <h2 className="mb-4 text-3xl font-title font-light text-foreground">Winner Selected</h2>
            <p className="mb-8 text-base text-muted-foreground">
              This offer has been marked as the winner in your negotiation dashboard
            </p>

            <Card className="mb-10 border-2 p-8">
              <Badge variant="default" className="mb-6 px-4 py-1.5 text-sm font-medium">
                Best Offer
              </Badge>
              <h3 className="mb-4 text-2xl font-semibold">{winner.supplierName}</h3>
              <p className="mb-8 text-4xl font-semibold text-foreground">
                ${winner.price.toLocaleString()}
              </p>

              <div className="space-y-3 text-left">
                <div className="flex justify-between text-sm bg-muted/50 p-4 rounded-md">
                  <span className="text-muted-foreground font-medium">Delivery Time</span>
                  <span className="font-semibold">{winner.deliveryTime}</span>
                </div>
                <div className="flex justify-between text-sm bg-muted/50 p-4 rounded-md">
                  <span className="text-muted-foreground font-medium">Terms</span>
                  <span className="max-w-xs text-right font-semibold">{winner.terms}</span>
                </div>
              </div>

              <div className="mt-6 bg-muted/30 p-5 border rounded-md">
                <p className="text-sm leading-relaxed">{winner.summary}</p>
              </div>
            </Card>

            <Button size="lg" variant="default" onClick={handleFinish} className="px-8">
              Return to Dashboard
            </Button>
          </div>
        ) : currentPair ? (
          // Comparison Screen
          <div>
            <div className="mb-8 text-center">
              <h2 className="mb-3 text-2xl font-title font-light">Choose the Better Offer</h2>
              <p className="text-base text-muted-foreground">
                Select the offer you prefer to continue to the next round
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {currentPair.map((offer, index) => (
                <Card
                  key={offer.id}
                  className={cn(
                    'cursor-pointer p-6 transition-all hover:border-foreground/30 border'
                  )}
                  onClick={() => handleSelect(offer)}
                >
                  <Badge variant="outline" className="mb-4 px-3 py-1 text-sm font-medium">
                    Option {index + 1}
                  </Badge>
                  <h3 className="mb-3 text-xl font-semibold">{offer.supplierName}</h3>
                  <p className="mb-6 text-3xl font-semibold text-foreground">
                    ${offer.price.toLocaleString()}
                  </p>

                  <div className="mb-6 space-y-3">
                    <div className="flex justify-between items-center text-sm bg-muted/50 p-3 rounded-md">
                      <span className="text-muted-foreground font-medium">Delivery Time</span>
                      <span className="font-semibold">{offer.deliveryTime}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm bg-muted/50 p-3 rounded-md">
                      <span className="text-muted-foreground font-medium">Terms</span>
                      <span className="max-w-xs text-right font-semibold">{offer.terms}</span>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 mb-4 border rounded-md">
                    <p className="text-sm leading-relaxed">{offer.summary}</p>
                  </div>

                  <Button className="mt-4 w-full" variant="default" size="lg">
                    Select This Offer
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          // Loading/Error State
          <div className="text-center">
            <p className="text-xl text-muted-foreground mb-6">No offers available for comparison</p>
            <Button className="mt-4" variant="default" size="lg" onClick={() => navigate('/')}>
              Go to Search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
