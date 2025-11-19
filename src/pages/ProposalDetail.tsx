import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MilestoneTracker } from '@/components/milestones/MilestoneTracker';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { chain } from '@/lib/chain';

const ProposalDetail = () => {
  const { id } = useParams();
  const { user, isWalletConnected } = useApp();
  const [proposal, setProposal] = useState<any | null>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<string>('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const p = await api.getProposal(id);
        setProposal(p);
      } catch (_e) {
        setProposal(null);
      }
    };
    load();
  }, [id]);

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Proposal Not Found</h2>
            <p className="text-muted-foreground mb-4">The proposal you're looking for doesn't exist.</p>
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
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'destructive';
      case 'in_progress': return 'default';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const handleSubmitMilestone = (milestoneId: string) => {
    setSelectedMilestone(milestoneId);
    setIsSubmitDialogOpen(true);
  };

  const handleSubmitEvidence = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsActionLoading(true);
    try {
      const moduleAddress = import.meta.env.VITE_MODULE_ADDRESS as string | undefined;
      if (proposal && isWalletConnected && moduleAddress) {
        try {
          const idx = proposal.milestones.findIndex((m: any) => m.id === selectedMilestone);
          if (idx >= 0) {
            const { hash } = await chain.submitMilestone({
              proposalId: proposal.id,
              milestoneIndex: idx,
              evidenceUriOrHash: String(formData.get('evidence') || ''),
            });
            toast.success('On-chain evidence submitted', { description: `Tx: ${hash}` });
          }
        } catch (err: any) {
          toast.error('On-chain submit failed', { description: err?.message || 'See console for details' });
        }
      }

      const updated = await api.submitMilestone(selectedMilestone, { evidence: formData.get('evidence') as string });
      setProposal({ ...proposal, milestones: proposal.milestones.map(m => (m.id === updated.id ? updated : m)) });
      setIsSubmitDialogOpen(false);
      toast.success('Milestone evidence submitted!', { description: 'Your submission is now awaiting verification.' });
    } catch (_e) {
      toast.error('Failed to submit evidence');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleVerifyMilestone = (milestoneId: string, approved: boolean) => {
    setSelectedMilestone(milestoneId);
    if (!approved) {
      setIsVerifyDialogOpen(true);
    } else {
      performVerification(milestoneId, approved, 'Milestone meets all requirements.');
    }
  };

  const performVerification = async (milestoneId: string, approved: boolean, notes: string) => {
    setIsActionLoading(true);
    try {
      const moduleAddress = import.meta.env.VITE_MODULE_ADDRESS as string | undefined;
      if (proposal && isWalletConnected && moduleAddress) {
        try {
          const idx = proposal.milestones.findIndex((m: any) => m.id === milestoneId);
          if (idx >= 0) {
            const { hash } = await chain.verifyMilestone({
              proposalId: proposal.id,
              milestoneIndex: idx,
              approved,
              notes,
            });
            toast.success('On-chain verification submitted', { description: `Tx: ${hash}` });
          }
        } catch (err: any) {
          toast.error('On-chain verify failed', { description: err?.message || 'See console for details' });
        }
      }
      const updated = await api.verifyMilestone(milestoneId, { verifierNotes: notes, status: approved ? 'verified' : 'rejected' } as any);
      setProposal({ ...proposal, milestones: proposal.milestones.map(m => (m.id === updated.id ? updated : m)) });
      setIsVerifyDialogOpen(false);
      toast.success(approved ? 'Milestone approved!' : 'Milestone rejected', {
        description: approved ? 'Funds will be released to the applicant.' : 'Feedback has been sent to the applicant.',
      });
    } catch (_e) {
      toast.error('Failed to update milestone');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectWithNotes = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    performVerification(selectedMilestone, false, formData.get('notes') as string);
  };

  const completedMilestones = proposal.milestones.filter(m => m.status === 'verified').length;
  const progress = (completedMilestones / proposal.milestones.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container py-8 space-y-8">
        {/* Back Button */}
        <Link to={user ? `/${user.role}` : '/'}>
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Badge variant={getStatusVariant(proposal.status)}>
                {proposal.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <h1 className="text-4xl font-bold">{proposal.title}</h1>
              <p className="text-lg text-muted-foreground">
                Application for: {proposal.grantTitle}
              </p>
            </div>
            <Card className="lg:w-64 bg-gradient-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Requested Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">${proposal.requestedAmount.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>By: {proposal.applicantName}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Submitted: {new Date(proposal.submittedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Progress: {completedMilestones} / {proposal.milestones.length} milestones</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Project Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{proposal.description}</p>
          </CardContent>
        </Card>

        {/* Milestones */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Milestones</h2>
            <div className="text-sm text-muted-foreground">
              {progress.toFixed(0)}% Complete
            </div>
          </div>
          
          <MilestoneTracker 
            milestones={proposal.milestones}
            onSubmit={user?.role === 'applicant' ? handleSubmitMilestone : undefined}
            onVerify={user?.role === 'verifier' ? handleVerifyMilestone : undefined}
            userRole={user?.role}
          />
        </div>
      </div>

      {/* Submit Evidence Dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Milestone Evidence</DialogTitle>
            <DialogDescription>
              Provide evidence of milestone completion for verification
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitEvidence} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="evidence">Evidence Description *</Label>
              <Textarea
                id="evidence"
                name="evidence"
                placeholder="Describe what you've accomplished, attach links to photos, documents, or other proof..."
                required
                rows={6}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" variant="gradient" className="flex-1" disabled={isActionLoading}>
                Submit Evidence
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsSubmitDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Milestone Dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Milestone</DialogTitle>
            <DialogDescription>
              Provide feedback explaining why this milestone doesn't meet requirements
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRejectWithNotes} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Rejection Reason *</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Explain what needs to be improved or what was missing..."
                required
                rows={6}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" variant="destructive" className="flex-1" disabled={isActionLoading}>
                Reject Milestone
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsVerifyDialogOpen(false)}
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

export default ProposalDetail;
