import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, Target, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';

const GrantDetail = () => {
  const { id } = useParams();
  const [grant, setGrant] = useState<any | null>(null);
  const [relatedProposals, setRelatedProposals] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const [g, ps] = await Promise.all([api.getGrant(id), api.getProposals()]);
        setGrant(g);
        setRelatedProposals(ps.filter(p => p.grantId === id));
      } catch (_e) {
        setGrant(null);
      }
    };
    load();
  }, [id]);

  if (!grant) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Grant Not Found</h2>
            <p className="text-muted-foreground mb-4">The grant you're looking for doesn't exist.</p>
            <Link to="/">
              <Button variant="gradient">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'open': return 'success';
      case 'in_progress': return 'warning';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  const fundingProgress = (grant.fundsDistributed / grant.amount) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container py-8 space-y-8">
        {/* Back Button */}
        <Link to="/">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(grant.status)}>
                  {grant.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge variant="outline">{grant.category}</Badge>
              </div>
              <h1 className="text-4xl font-bold">{grant.title}</h1>
              <p className="text-lg text-muted-foreground">
                By {grant.donorName}
              </p>
            </div>
            <Card className="lg:w-64 bg-gradient-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Grant Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">${grant.amount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ${grant.fundsDistributed.toLocaleString()} distributed
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Deadline: {new Date(grant.deadline).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{grant.applicantsCount} applicants</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>{grant.milestones} milestones</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Created: {new Date(grant.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>About This Grant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{grant.description}</p>
          </CardContent>
        </Card>

        {/* Stats & Info */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Funding Progress */}
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Funding Progress</span>
                <DollarSign className="h-5 w-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Distributed</span>
                  <span className="font-medium">${grant.fundsDistributed.toLocaleString()} / ${grant.amount.toLocaleString()}</span>
                </div>
                <Progress value={fundingProgress} className="h-2" />
              </div>
              <div className="text-sm text-muted-foreground">
                {fundingProgress.toFixed(1)}% of total grant amount
              </div>
            </CardContent>
          </Card>

          {/* Eligibility */}
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle>Eligibility Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {grant.eligibility.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Requirements */}
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Application Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {grant.requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-3 text-sm">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {index + 1}
                  </div>
                  <span className="text-muted-foreground pt-0.5">{req}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Related Proposals */}
        {relatedProposals.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Active Proposals</h2>
            <div className="grid gap-4">
              {relatedProposals.map((proposal) => (
                <Link key={proposal.id} to={`/proposal/${proposal.id}`}>
                  <Card className="hover:shadow-card-hover transition-all bg-gradient-card">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{proposal.title}</h3>
                            <Badge variant={getStatusVariant(proposal.status)}>
                              {proposal.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {proposal.description}
                          </p>
                          <div className="mt-2 text-sm text-muted-foreground">
                            By {proposal.applicantName} • Submitted {new Date(proposal.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">${proposal.requestedAmount.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {proposal.milestones.filter(m => m.status === 'verified').length} / {proposal.milestones.length} milestones
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {grant.status === 'open' && (
          <Card className="bg-gradient-primary text-white">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-2">Ready to Apply?</h3>
              <p className="text-white/90 mb-6">
                Submit your proposal and join other changemakers making an impact
              </p>
              <Link to="/applicant">
                <Button variant="secondary" size="lg">
                  Apply Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GrantDetail;
