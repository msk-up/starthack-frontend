import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { CATEGORIES, ProductCategory } from '@/types/procurement';

interface NegotiationSidebarProps {
  activeCategory: ProductCategory;
  onCategoryChange: (category: ProductCategory) => void;
  supplierCounts: Record<string, number>;
}

export function NegotiationSidebar({ 
  activeCategory, 
  onCategoryChange,
  supplierCounts 
}: NegotiationSidebarProps) {
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
      </SidebarContent>
    </Sidebar>
  );
}
