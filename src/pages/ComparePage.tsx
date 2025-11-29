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
      <header className="glass sticky top-0 z-50 border-b backdrop-blur-2xl">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="glass" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-primary to-secondary p-2 shadow-lg glow-primary">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Compare Offers</h1>
              </div>
            </div>
            {!winner && remainingOffers.length > 0 && (
              <Badge className="px-4 py-2 text-sm font-semibold rounded-full bg-primary/10 text-primary border-primary/20">
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
            <div className="animate-float mb-8">
              <Trophy className="mx-auto mb-6 h-24 w-24 text-success drop-shadow-2xl" />
            </div>
            <h2 className="mb-4 text-5xl font-black bg-gradient-to-r from-success to-accent bg-clip-text text-transparent">Winner Selected!</h2>
            <p className="mb-12 text-xl text-muted-foreground">
              This offer has been marked as the winner in your negotiation dashboard
            </p>

            <Card className="glass mb-10 border-success border-2 p-10 ring-4 ring-success/30 shadow-2xl shadow-success/20 rounded-3xl">
              <Badge className="mb-6 bg-gradient-to-r from-success to-success/80 text-white border-0 px-6 py-2 shadow-lg rounded-xl text-base">
                Best Offer
              </Badge>
              <h3 className="mb-4 text-3xl font-bold">{winner.supplierName}</h3>
              <p className="mb-8 text-5xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ${winner.price.toLocaleString()}
              </p>

              <div className="space-y-4 text-left">
                <div className="flex justify-between text-base rounded-xl bg-muted/30 p-4">
                  <span className="text-muted-foreground font-semibold">Delivery Time</span>
                  <span className="font-bold">{winner.deliveryTime}</span>
                </div>
                <div className="flex justify-between text-base rounded-xl bg-muted/30 p-4">
                  <span className="text-muted-foreground font-semibold">Terms</span>
                  <span className="max-w-xs text-right font-bold">{winner.terms}</span>
                </div>
              </div>

              <div className="mt-8 rounded-2xl bg-muted/40 p-6 border border-muted">
                <p className="text-base leading-relaxed">{winner.summary}</p>
              </div>
            </Card>

            <Button size="lg" variant="gradient" onClick={handleFinish} className="px-12 text-base shadow-2xl">
              Return to Dashboard
            </Button>
          </div>
        ) : currentPair ? (
          // Comparison Screen
          <div>
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold">Choose the Better Offer</h2>
              <p className="text-xl text-muted-foreground">
                Select the offer you prefer to continue to the next round
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {currentPair.map((offer, index) => (
                <Card
                  key={offer.id}
                  className={cn(
                    'glass glass-hover cursor-pointer p-10 transition-all hover:scale-[1.03] rounded-3xl shadow-2xl',
                    'hover:border-primary/60'
                  )}
                  onClick={() => handleSelect(offer)}
                >
                  <Badge className="mb-6 px-4 py-2 rounded-xl bg-secondary/10 text-secondary border-secondary/20 font-bold text-base">
                    Option {index + 1}
                  </Badge>
                  <h3 className="mb-3 text-2xl font-bold">{offer.supplierName}</h3>
                  <p className="mb-8 text-4xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    ${offer.price.toLocaleString()}
                  </p>

                  <div className="mb-8 space-y-4">
                    <div className="flex justify-between items-center text-base rounded-xl bg-muted/30 p-4">
                      <span className="text-muted-foreground font-semibold">Delivery Time</span>
                      <span className="font-bold">{offer.deliveryTime}</span>
                    </div>
                    <div className="flex justify-between items-center text-base rounded-xl bg-muted/30 p-4">
                      <span className="text-muted-foreground font-semibold">Terms</span>
                      <span className="max-w-xs text-right font-bold">{offer.terms}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-muted/40 p-6 mb-6 border border-muted">
                    <p className="text-base leading-relaxed">{offer.summary}</p>
                  </div>

                  <Button className="mt-4 w-full" variant="glassPrimary" size="lg">
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
            <Button className="mt-4" variant="gradient" size="lg" onClick={() => navigate('/')}>
              Go to Search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
