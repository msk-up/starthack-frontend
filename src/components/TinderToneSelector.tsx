import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToneOption {
  id: string;
  name: string;
  description: string;
  sampleMessages: string[];
}

interface TinderToneSelectorProps {
  supplierNames: string[];
  onComplete: (selectedTones: string[]) => void;
}

const TONE_OPTIONS: ToneOption[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Formal and business-focused approach',
    sampleMessages: [
      'Dear [Supplier], I am reaching out regarding a potential business opportunity. We are interested in exploring a partnership and would appreciate the opportunity to discuss how we can work together.',
    ],
  },
  {
    id: 'friendly',
    name: 'Friendly',
    description: 'Warm and relationship-building tone',
    sampleMessages: [
      'Hi [Supplier]! We\'ve heard great things about your company and would love to explore a partnership. Looking forward to connecting with you and discussing how we can collaborate.',
    ],
  },
  {
    id: 'direct',
    name: 'Direct',
    description: 'Straight to the point, efficiency-focused',
    sampleMessages: [
      '[Supplier] - We are interested in your services and would like to receive a quote. Please provide your best pricing and availability. Thank you.',
    ],
  },
];

export default function TinderToneSelector({ supplierNames, onComplete }: TinderToneSelectorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTones, setSelectedTones] = useState<string[]>([]);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const currentTone = TONE_OPTIONS[currentIndex];
  const progress = ((currentIndex) / TONE_OPTIONS.length) * 100;

  // Safety check: if currentTone is undefined, return early
  if (!currentTone) {
    return null;
  }

  const handleSwipe = (liked: boolean) => {
    if (!currentTone || swipeDirection || isComplete) return;
    
    setSwipeDirection(liked ? 'right' : 'left');
    
    if (liked) {
      setSelectedTones(prev => [...prev, currentTone.id]);
    }

    setTimeout(() => {
      setSwipeDirection(null);
      if (currentIndex < TONE_OPTIONS.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsComplete(true);
      }
    }, 300);
  };

  const handleFinish = () => {
    const finalTones = selectedTones.length > 0 ? selectedTones : ['professional'];
    onComplete(finalTones);
  };

  if (isComplete) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-foreground mx-auto flex items-center justify-center">
            <Check className="h-8 w-8 text-background" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Fine-tuning Complete</h2>
            <p className="text-muted-foreground">
              {selectedTones.length > 0 
                ? `Selected tones: ${selectedTones.map(t => TONE_OPTIONS.find(o => o.id === t)?.name).join(', ')}`
                : 'Using default professional tone'}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Your specialist agents will now combine these communication styles to craft personalized messages for {supplierNames.length} suppliers.
          </p>
          <Button onClick={handleFinish} className="w-full">
            Start Negotiations
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Select communication tones</span>
            <span>{currentIndex + 1} / {TONE_OPTIONS.length}</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-foreground transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <Card 
          className={cn(
            "p-6 space-y-4 transition-all duration-300 transform",
            swipeDirection === 'left' && "-translate-x-full opacity-0 rotate-[-10deg]",
            swipeDirection === 'right' && "translate-x-full opacity-0 rotate-[10deg]"
          )}
        >
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">{currentTone.name}</h3>
            <p className="text-sm text-muted-foreground">{currentTone.description}</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Sample messages for your suppliers:
            </p>
            {supplierNames.slice(0, 3).map((name, idx) => (
              <div key={idx} className="p-3 bg-muted/50 rounded-lg text-sm">
                <p className="text-xs text-muted-foreground mb-1">{name}</p>
                <p>{currentTone.sampleMessages[0].replace('[Supplier]', name)}</p>
              </div>
            ))}
            {supplierNames.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                +{supplierNames.length - 3} more suppliers
              </p>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-6">
          <Button
            variant="outline"
            size="lg"
            className="w-16 h-16 rounded-full"
            onClick={() => handleSwipe(false)}
          >
            <ThumbsDown className="h-6 w-6" />
          </Button>
          <Button
            variant="default"
            size="lg"
            className="w-16 h-16 rounded-full"
            onClick={() => handleSwipe(true)}
          >
            <ThumbsUp className="h-6 w-6" />
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Swipe right to include this tone, left to skip
        </p>
      </div>
    </div>
  );
}
