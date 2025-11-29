import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isProcessing: boolean;
}

export default function PromptInput({ onSubmit, isProcessing }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    if (prompt.trim() && !isProcessing) {
      onSubmit(prompt);
      setPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <Card className="glass p-6 rounded-2xl shadow-2xl mb-8">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-gradient-to-br from-primary to-secondary p-3 shadow-lg">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-2">Negotiation Prompt</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Describe what you'd like to negotiate with suppliers
          </p>
          <div className="flex gap-3">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Request best pricing for bulk order of 100 units with 30-day payment terms..."
              className="min-h-[100px] resize-none glass border-2 focus:border-primary transition-all"
              disabled={isProcessing}
            />
            <Button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isProcessing}
              className="shrink-0"
              variant="gradientAccent"
              size="lg"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Cmd/Ctrl + Enter to send
          </p>
        </div>
      </div>
    </Card>
  );
}
