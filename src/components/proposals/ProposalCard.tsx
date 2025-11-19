import { Calendar, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Proposal } from '@/lib/types';
import { Link } from 'react-router-dom';

interface ProposalCardProps {
  proposal: Proposal;
  userRole?: 'donor' | 'applicant' | 'verifier';
}

export const ProposalCard = ({ proposal, userRole }: ProposalCardProps) => {
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

  const completedMilestones = proposal.milestones.filter(m => m.status === 'verified').length;
  const progress = (completedMilestones / proposal.milestones.length) * 100;

  return (
    <Card className="hover:shadow-card-hover transition-all duration-200 bg-gradient-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 mb-2">{proposal.title}</CardTitle>
            <Badge variant={getStatusVariant(proposal.status)} className="mb-2">
              {proposal.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <p className="text-sm text-muted-foreground">{proposal.grantTitle}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">${proposal.requestedAmount.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Requested</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{proposal.description}</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completedMilestones} / {proposal.milestones.length} milestones</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs">
              Submitted: {new Date(proposal.submittedAt).toLocaleDateString()}
            </span>
          </div>
          {userRole !== 'applicant' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">By: {proposal.applicantName}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          {proposal.milestones.some(m => m.status === 'submitted') && (
            <Badge variant="warning" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Needs Review
            </Badge>
          )}
          {completedMilestones > 0 && (
            <Badge variant="success" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              {completedMilestones} Verified
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Link to={`/proposal/${proposal.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            View {userRole === 'verifier' ? 'for Review' : 'Details'}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
