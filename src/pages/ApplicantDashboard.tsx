import { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';
import { api } from '@/lib/api';
import { GrantCard } from '@/components/grants/GrantCard';
import { ProposalCard } from '@/components/proposals/ProposalCard';
import { SearchAndFilter, FilterOptions } from '@/components/search/SearchAndFilter';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Grant } from '@/lib/types';
import { chain } from '@/lib/chain';

const ApplicantDashboard = () => {
  const { user, grants, setGrants, proposals, setProposals, isWalletConnected } = useApp();
  const [filteredGrants, setFilteredGrants] = useState<Grant[]>([]);
  const [myProposals, setMyProposals] = useState(proposals.filter(p => p.applicantId === (user?.id || '')));
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [g, ps] = await Promise.all([
          grants.length === 0 ? api.getGrants() : Promise.resolve(grants),
          proposals.length === 0 ? api.getProposals() : Promise.resolve(proposals),
        ]);
        if (grants.length === 0) setGrants(g);
        if (proposals.length === 0) setProposals(ps);
        setFilteredGrants(g);
        setMyProposals(ps.filter(p => p.applicantId === (user?.id || '')));
      } catch (e) {
        // no-op toast to keep UI minimal
      }
    };
    load();
  }, [grants, proposals, setGrants, setProposals, user]);

  const handleSearch = (query: string) => {
    const filtered = grants.filter(g => 
      g.title.toLowerCase().includes(query.toLowerCase()) ||
      g.description.toLowerCase().includes(query.toLowerCase()) ||
      g.category.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredGrants(filtered);
  };

  const handleFilter = (filters: FilterOptions) => {
    let filtered = [...grants];

    if (filters.category && filters.category !== 'All') {
      filtered = filtered.filter(g => g.category === filters.category);
    }

    if (filters.status) {
      filtered = filtered.filter(g => g.status === filters.status);
    }

    if (filters.minAmount) {
      filtered = filtered.filter(g => g.amount >= filters.minAmount!);
    }

    if (filters.maxAmount) {
      filtered = filtered.filter(g => g.amount <= filters.maxAmount!);
    }

    if (filters.sortBy === 'amount') {
      filtered.sort((a, b) => b.amount - a.amount);
    } else if (filters.sortBy === 'deadline') {
      filtered.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    } else {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    setFilteredGrants(filtered);
  };

  const handleApplyClick = (grantId: string) => {
    const grant = grants.find(g => g.id === grantId);
    if (grant) {
      setSelectedGrant(grant);
      setIsApplyDialogOpen(true);
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsSubmitting(true);
    try {
      const moduleAddress = import.meta.env.VITE_MODULE_ADDRESS as string | undefined;
      if (isWalletConnected && moduleAddress && selectedGrant) {
        try {
          const { hash } = await chain.applyProposal({
            grantId: selectedGrant.id,
            requestedAmount: Number(formData.get('amount')),
            metadataUri: '',
          });
          toast.success('On-chain proposal submitted', { description: `Tx: ${hash}` });
        } catch (err: any) {
          toast.error('On-chain proposal failed', { description: err?.message || 'See console for details' });
        }
      } else if (!moduleAddress) {
        toast.info('Skipping on-chain call', { description: 'VITE_MODULE_ADDRESS is not configured' });
      }

      const created = await api.createProposal({
        grantId: selectedGrant!.id,
        applicantId: user?.id || 'applicant-1',
        applicantName: user?.name || 'Applicant',
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        requestedAmount: Number(formData.get('amount')),
      });
      setMyProposals([created, ...myProposals]);
      setIsApplyDialogOpen(false);
      toast.success('Proposal submitted successfully!', { description: 'Your proposal is now under review.' });
    } catch (_e) {
      toast.error('Failed to submit proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingProposals = myProposals.filter(p => p.status === 'pending').length;
  const approvedProposals = myProposals.filter(p => p.status === 'approved' || p.status === 'in_progress').length;
  const totalRequested = myProposals.reduce((sum, p) => sum + p.requestedAmount, 0);
  const totalReceived = myProposals
    .filter(p => p.status === 'approved' || p.status === 'in_progress' || p.status === 'completed')
    .reduce((sum, p) => {
      const completedMilestones = p.milestones.filter(m => m.status === 'verified');
      return sum + completedMilestones.reduce((ms, m) => ms + m.amount, 0);
    }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Applicant Dashboard</h1>
          <p className="text-muted-foreground">
            Find grants and manage your proposals
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myProposals.length}</div>
              <p className="text-xs text-muted-foreground">Submitted applications</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingProposals}</div>
              <p className="text-xs text-muted-foreground">Awaiting decision</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedProposals}</div>
              <p className="text-xs text-muted-foreground">Active projects</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funds Received</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalReceived.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total disbursed</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="browse">Browse Grants</TabsTrigger>
            <TabsTrigger value="proposals">My Proposals</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <SearchAndFilter
              onSearch={handleSearch}
              onFilter={handleFilter}
              placeholder="Search available grants..."
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGrants.filter(g => g.status === 'open').map((grant) => (
                <GrantCard 
                  key={grant.id} 
                  grant={grant}
                  onApply={handleApplyClick}
                />
              ))}
            </div>

            {filteredGrants.filter(g => g.status === 'open').length === 0 && (
              <Card className="bg-gradient-card">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No grants found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filters</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="proposals" className="space-y-6">
            {myProposals.length === 0 ? (
              <Card className="bg-gradient-card">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No proposals yet</h3>
                  <p className="text-muted-foreground mb-4">Browse grants and submit your first proposal</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProposals.map((proposal) => (
                  <ProposalCard key={proposal.id} proposal={proposal} userRole="applicant" />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Apply Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Proposal</DialogTitle>
            <DialogDescription>
              Apply for: {selectedGrant?.title}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitProposal} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Proposal Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Mobile STEM Labs for Rural Schools"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Project Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your project, goals, timeline, and expected outcomes..."
                required
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Requested Amount ($) *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder={selectedGrant?.amount.toString()}
                max={selectedGrant?.amount}
                required
              />
              <p className="text-xs text-muted-foreground">
                Maximum: ${selectedGrant?.amount.toLocaleString()}
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" variant="gradient" className="flex-1" disabled={isSubmitting}>
                Submit Proposal
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsApplyDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicantDashboard;
