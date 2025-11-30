import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { CATEGORIES, ProductCategory } from '@/types/procurement';
import { Negotiation } from '@/lib/api';
import { Clock, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NegotiationSidebarProps {
  activeCategory: ProductCategory;
  onCategoryChange: (category: ProductCategory) => void;
  supplierCounts: Record<string, number>;
  previousNegotiations: Negotiation[];
  loadingNegotiations: boolean;
  onNegotiationSelect: (id: number) => void;
}

export function NegotiationSidebar({ 
  activeCategory, 
  onCategoryChange,
  supplierCounts,
  previousNegotiations,
  loadingNegotiations,
  onNegotiationSelect
}: NegotiationSidebarProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold px-4 py-3">
            Product Categories
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-4">
            <Tabs value={activeCategory} onValueChange={(v) => onCategoryChange(v as ProductCategory)}>
              <TabsList className="grid w-full grid-cols-1 gap-2 bg-transparent p-0">
                {CATEGORIES.map((cat) => {
                  const count = supplierCounts[cat.value] || 0;
                  return count > 0 ? (
                    <TabsTrigger
                      key={cat.value}
                      value={cat.value}
                      className="justify-between data-[state=active]:bg-foreground data-[state=active]:text-background rounded-lg py-3"
                    >
                      <span className="font-medium">{cat.label}</span>
                      <Badge variant="secondary" className="ml-2 rounded-full">
                        {count}
                      </Badge>
                    </TabsTrigger>
                  ) : null;
                })}
              </TabsList>
            </Tabs>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold px-4 py-3">
            Previous Negotiations
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-4">
            <ScrollArea className="h-[400px]">
              {loadingNegotiations ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Loading...
                </div>
              ) : previousNegotiations.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No previous negotiations
                </div>
              ) : (
                <div className="space-y-2">
                  {previousNegotiations.map((negotiation) => (
                    <Button
                      key={negotiation.negotiation_id}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto p-3 flex flex-col items-start gap-2"
                      onClick={() => onNegotiationSelect(negotiation.negotiation_id)}
                    >
                      <div className="flex items-start justify-between w-full gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {truncateText(negotiation.prompt)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatDate(negotiation.created_at)}
                            </span>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs shrink-0",
                            negotiation.status === 'pending' && "border-yellow-500/50 text-yellow-700 dark:text-yellow-400",
                            negotiation.status === 'processing' && "border-blue-500/50 text-blue-700 dark:text-blue-400",
                            negotiation.status === 'completed' && "border-green-500/50 text-green-700 dark:text-green-400"
                          )}
                        >
                          {negotiation.status}
                        </Badge>
                      </div>
                      {negotiation.modes && negotiation.modes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {negotiation.modes.map((mode, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {mode}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        <span>{negotiation.supplier_ids.length} supplier{negotiation.supplier_ids.length !== 1 ? 's' : ''}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
