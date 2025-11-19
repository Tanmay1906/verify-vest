import { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ProposalCard } from '@/components/proposals/ProposalCard';
import { SearchAndFilter, FilterOptions } from '@/components/search/SearchAndFilter';
import { api } from '@/lib/api';

const VerifierDashboard = () => {
  const [proposals, setProposals] = useState<any[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const ps = await api.getProposals();
        setProposals(ps);
        setFilteredProposals(ps);
      } catch (_e) {
        setProposals([]);
        setFilteredProposals([]);
      }
    };
    load();
  }, []);

  const pendingReview = proposals.filter(p => 
    p.milestones.some(m => m.status === 'submitted')
  );
  
  const verifiedToday = proposals.filter(p => 
    p.milestones.some(m => 
      m.status === 'verified' && 
      m.verifiedAt && 
      new Date(m.verifiedAt).toDateString() === new Date().toDateString()
    )
  );

  const totalVerified = proposals.reduce((sum, p) => 
    sum + p.milestones.filter(m => m.status === 'verified').length, 0
  );

  const totalRejected = proposals.reduce((sum, p) => 
    sum + p.milestones.filter(m => m.status === 'rejected').length, 0
  );

  const handleSearch = (query: string) => {
    const filtered = proposals.filter(p => 
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase()) ||
      p.grantTitle.toLowerCase().includes(query.toLowerCase()) ||
      p.applicantName.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredProposals(filtered);
  };

  const handleFilter = (filters: FilterOptions) => {
    let filtered = [...proposals];

    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    if (filters.sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    }

    setFilteredProposals(filtered);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Verifier Dashboard</h1>
          <p className="text-muted-foreground">
            Review and verify project milestones
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReview.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting verification</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{verifiedToday.length}</div>
              <p className="text-xs text-muted-foreground">Milestones approved</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Verified</CardTitle>
              <Shield className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVerified}</div>
              <p className="text-xs text-muted-foreground">All-time verifications</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRejected}</div>
              <p className="text-xs text-muted-foreground">Did not meet criteria</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="pending">
              Pending Review
              {pendingReview.length > 0 && (
                <Badge variant="warning" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {pendingReview.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All Proposals</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            {pendingReview.length === 0 ? (
              <Card className="bg-gradient-card">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pending reviews</h3>
                  <p className="text-muted-foreground">All milestones are up to date</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingReview.map((proposal) => (
                  <ProposalCard key={proposal.id} proposal={proposal} userRole="verifier" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-6">
            <SearchAndFilter
              onSearch={handleSearch}
              onFilter={handleFilter}
              placeholder="Search proposals..."
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} userRole="verifier" />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VerifierDashboard;
