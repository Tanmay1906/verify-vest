import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GrantCard } from '@/components/grants/GrantCard';
import { Button } from '@/components/ui/button';

const Grants = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['grants'], queryFn: () => api.getGrants() });

  if (isLoading) return <div className="p-8">Loading grants...</div>;
  if (isError) return (
    <div className="p-8">
      <div className="mb-4">Failed to load grants: {(error as any)?.message}</div>
      <Button onClick={() => refetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container">
        <h1 className="text-3xl font-semibold mb-6">Open Grants</h1>
        {data && data.length === 0 && (
          <div className="text-muted-foreground">No grants available.</div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.map((g) => (
            <GrantCard key={g.id} grant={g} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Grants;
