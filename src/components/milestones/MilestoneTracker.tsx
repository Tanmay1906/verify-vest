import { CheckCircle, Clock, XCircle, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Milestone } from '@/lib/types';

interface MilestoneTrackerProps {
  milestones: Milestone[];
  onSubmit?: (milestoneId: string) => void;
  onVerify?: (milestoneId: string, approved: boolean) => void;
  userRole?: 'donor' | 'applicant' | 'verifier';
}

export const MilestoneTracker = ({ milestones, onSubmit, onVerify, userRole }: MilestoneTrackerProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'submitted': return <Clock className="h-5 w-5 text-warning" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-destructive" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'verified': return 'success';
      case 'submitted': return 'warning';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      {milestones.map((milestone, index) => (
        <Card key={milestone.id} className="bg-gradient-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                {getStatusIcon(milestone.status)}
                {index < milestones.length - 1 && (
                  <div className="w-px h-12 bg-border mt-2" />
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{milestone.title}</h4>
                    <p className="text-sm text-muted-foreground">{milestone.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">${milestone.amount.toLocaleString()}</div>
                    <Badge variant={getStatusVariant(milestone.status)} className="mt-1">
                      {milestone.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div>Due: {new Date(milestone.dueDate).toLocaleDateString()}</div>
                  {milestone.submittedAt && (
                    <div>Submitted: {new Date(milestone.submittedAt).toLocaleDateString()}</div>
                  )}
                  {milestone.verifiedAt && (
                    <div>Verified: {new Date(milestone.verifiedAt).toLocaleDateString()}</div>
                  )}
                </div>

                {milestone.evidence && (
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    <p className="text-muted-foreground">Evidence: {milestone.evidence}</p>
                  </div>
                )}

                {milestone.verifierNotes && (
                  <div className="p-3 bg-success/10 border border-success/20 rounded-lg text-sm">
                    <p className="font-medium mb-1 text-success">Verifier Notes:</p>
                    <p className="text-muted-foreground">{milestone.verifierNotes}</p>
                  </div>
                )}

                {/* Actions based on role and status */}
                <div className="flex gap-2 pt-2">
                  {userRole === 'applicant' && milestone.status === 'pending' && onSubmit && (
                    <Button size="sm" onClick={() => onSubmit(milestone.id)} variant="default">
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Evidence
                    </Button>
                  )}

                  {userRole === 'verifier' && milestone.status === 'submitted' && onVerify && (
                    <>
                      <Button 
                        size="sm" 
                        variant="success"
                        onClick={() => onVerify(milestone.id, true)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => onVerify(milestone.id, false)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
