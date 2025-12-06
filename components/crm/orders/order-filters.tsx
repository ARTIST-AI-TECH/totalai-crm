import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OrderFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts: {
    all: number;
    new: number;
    in_progress: number;
    completed: number;
  };
}

/**
 * Order Filters Component
 *
 * Tab navigation for filtering work orders by status.
 * Shows counts for each status.
 */
export function OrderFilters({ activeFilter, onFilterChange, counts }: OrderFiltersProps) {
  const filters = [
    { value: 'all', label: `All (${counts.all})` },
    { value: 'new', label: `New (${counts.new})` },
    { value: 'in_progress', label: `In Progress (${counts.in_progress})` },
    { value: 'completed', label: `Completed (${counts.completed})` },
  ];

  return (
    <Tabs value={activeFilter} onValueChange={onFilterChange}>
      <TabsList>
        {filters.map((filter) => (
          <TabsTrigger key={filter.value} value={filter.value}>
            {filter.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
