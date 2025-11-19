import { Calendar, DollarSign, Users, Target } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Grant } from '@/lib/types';
import { Link } from 'react-router-dom';

interface GrantCardProps {
  grant: Grant;
  onApply?: (grantId: string) => void;
  showActions?: boolean;
}

export const GrantCard = ({ grant, onApply, showActions = true }: GrantCardProps) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'open': return 'success';
      case 'in_progress': return 'warning';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <Card className="hover:shadow-card-hover transition-all duration-200 hover:-translate-y-1 bg-gradient-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 mb-2">{grant.title}</CardTitle>
            <Badge variant={getStatusVariant(grant.status)} className="mb-2">
              {grant.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <p className="text-sm text-muted-foreground">{grant.donorName}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">${grant.amount.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Grant</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">{grant.description}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs">
              Deadline: {new Date(grant.deadline).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs">{grant.applicantsCount} applicants</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs">{grant.milestones} milestones</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs">${grant.fundsDistributed.toLocaleString()} funded</span>
          </div>
        </div>

        <div className="pt-2">
          <Badge variant="outline" className="text-xs">
            {grant.category}
          </Badge>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="flex gap-2">
          <Link to={`/grant/${grant.id}`} className="flex-1">
            <Button variant="outline" className="w-full">View Details</Button>
          </Link>
          {onApply && grant.status === 'open' && (
            <Button 
              variant="default" 
              className="flex-1"
              onClick={() => onApply(grant.id)}
            >
              Apply Now
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};
