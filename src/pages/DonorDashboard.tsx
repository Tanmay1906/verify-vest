import { useState, useEffect } from 'react';
import { Plus, DollarSign, Users, CheckCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { api } from '@/lib/api';
import { GrantCard } from '@/components/grants/GrantCard';
import { ProposalCard } from '@/components/proposals/ProposalCard';
import { toast } from 'sonner';
import { Grant, GrantStatus } from '@/lib/types';
import { chain } from '@/lib/chain';

const DonorDashboard = () => {
  const { user, grants, setGrants, proposals, setProposals, isWalletConnected } = useApp();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [myGrants, setMyGrants] = useState<Grant[]>([]);
  const [relatedProposals, setRelatedProposals] = useState(proposals.slice(0, 3));
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
        setRelatedProposals(ps.slice(0, 3));
        setMyGrants(g.filter(gr => gr.donorId === (user?.id || '') || gr.donorName === (user?.name || '')));
      } catch (_e) {
        // ignore for now
      }
    };
    load();
  }, [grants, proposals, setGrants, setProposals, user]);

  const handleCreateGrant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsSubmitting(true);
    try {
      // Optional on-chain call if wallet + module address configured
      const moduleAddress = import.meta.env.VITE_MODULE_ADDRESS as string | undefined;
      if (isWalletConnected && moduleAddress) {
        try {
          const { hash } = await chain.createGrant({
            title: formData.get('title') as string,
            amount: Number(formData.get('amount')),
            milestones: Number(formData.get('milestones')),
            metadataUri: '',
          });
          toast.success('On-chain grant created', { description: `Tx: ${hash}` });
        } catch (err: any) {
          toast.error('On-chain grant failed', { description: err?.message || 'See console for details' });
        }
      } else if (!moduleAddress) {
        toast.info('Skipping on-chain call', { description: 'VITE_MODULE_ADDRESS is not configured' });
      }

      const created = await api.createGrant({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        amount: Number(formData.get('amount')),
        category: formData.get('category') as string,
        deadline: formData.get('deadline') as string,
        status: 'open' as GrantStatus,
        donorId: user?.id || 'donor-1',
        donorName: user?.name || 'Anonymous Donor',
        eligibility: ['Open to all qualified applicants'],
        requirements: ['Detailed proposal', 'Budget breakdown'],
        milestones: Number(formData.get('milestones')),
      });
      setGrants([created, ...grants]);
      setMyGrants([created, ...myGrants]);
      setIsCreateDialogOpen(false);
      toast.success('Grant created successfully!', { description: 'Your grant is now live and accepting applications.' });
    } catch (_e) {
      toast.error('Failed to create grant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalFunding = myGrants.reduce((sum, g) => sum + g.amount, 0);
  const totalApplicants = myGrants.reduce((sum, g) => sum + g.applicantsCount, 0);
  const totalDistributed = myGrants.reduce((sum, g) => sum + g.fundsDistributed, 0);
  const activeGrants = myGrants.filter(g => g.status === 'open' || g.status === 'in_progress').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Donor Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your grants and track their impact
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" variant="gradient">
                <Plus className="h-5 w-5 mr-2" />
                Create Grant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Grant</DialogTitle>
                <DialogDescription>
                  Set up a new grant opportunity for changemakers
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateGrant} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Grant Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., STEM Education Initiative"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the grant opportunity, goals, and expected outcomes..."
                    required
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Grant Amount ($) *</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      placeholder="25000"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select name="category" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Environment">Environment</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Entrepreneurship">Entrepreneurship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Application Deadline *</Label>
                    <Input
                      id="deadline"
                      name="deadline"
                      type="date"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="milestones">Number of Milestones *</Label>
                    <Input
                      id="milestones"
                      name="milestones"
                      type="number"
                      placeholder="3"
                      min="1"
                      max="10"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" variant="gradient" className="flex-1" disabled={isSubmitting}>
                    Create Grant
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Funding</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalFunding.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all grants</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Grants</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeGrants}</div>
              <p className="text-xs text-muted-foreground">Currently accepting applications</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applicants</CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalApplicants}</div>
              <p className="text-xs text-muted-foreground">Proposals received</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funds Distributed</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalDistributed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Released to projects</p>
            </CardContent>
          </Card>
        </div>

        {/* My Grants */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">My Grants</h2>
          </div>
          
          {myGrants.length === 0 ? (
            <Card className="bg-gradient-card">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No grants yet</h3>
                <p className="text-muted-foreground mb-4">Create your first grant to get started</p>
                <Button variant="gradient" onClick={() => setIsCreateDialogOpen(true)}>
                  Create Grant
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myGrants.map((grant) => (
                <GrantCard key={grant.id} grant={grant} showActions={false} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Proposals */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Recent Proposals</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} userRole="donor" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;
