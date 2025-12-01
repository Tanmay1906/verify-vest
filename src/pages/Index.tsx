import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Globe, Target, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useApp } from '@/contexts/AppContext';
import { UserRole } from '@/lib/types';

import { toast } from 'sonner';
const Index = () => {
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const { user, setUser, isWalletConnected, connectWallet, disconnectWallet, walletAddress, setToken } = useApp();
  const navigate = useNavigate();

  const selectRole = async (role: UserRole) => {
    if (!isWalletConnected || !walletAddress) {
      toast.error('Connect your wallet first');
      return;
    }

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    try {
      const payload = { address: walletAddress, role };
      const lres = await fetch(`${API_BASE}/api/auth/wallet-login-simple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!lres.ok) {
        const txt = await lres.text();
        let msg = txt;
        try {
          const parsed = JSON.parse(txt);
          if (parsed?.message) msg = parsed.message;
        } catch (e) {
          // ignore parse error
        }
        throw new Error(msg);
      }

      const ljson = await lres.json();
      if (ljson.token) {
        localStorage.setItem('token', ljson.token);
        setToken(ljson.token);
      }
      setUser(ljson.user);
      setIsRoleDialogOpen(false);
      navigate(`/${ljson.user.role}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Login failed', { description: msg });
    }
  };

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container py-20">
          <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary mb-4">
              <span className="text-3xl font-bold text-white">μG</span>
            </div>
            
            <h1 className="text-5xl font-bold tracking-tight">
              Welcome back, {user.name}!
            </h1>
            
            <p className="text-xl text-muted-foreground">
              You're signed in as a <span className="font-semibold text-primary">{user.role}</span>
            </p>

            <div className="flex gap-4 justify-center pt-4">
              <Link to={`/${user.role}`}>
                <Button size="lg" variant="gradient" className="text-lg">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-accent/5 py-20 lg:py-32">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary shadow-glow mb-4 animate-glow-pulse">
              <span className="text-3xl font-bold text-white">μG</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight">
              On-Chain Micro-Grants
              <span className="block text-transparent bg-clip-text bg-gradient-primary mt-2">
                Powered by Aptos
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transparent, verifiable, and efficient micro-scholarships and grants. 
              Connect donors with changemakers through blockchain-verified milestones.
            </p>

            <div className="flex flex-wrap gap-4 justify-center pt-4">
              {!isWalletConnected ? (
                <Button size="lg" variant="gradient" onClick={connectWallet} className="text-lg">
                  Connect Wallet
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button size="lg" variant="outline" onClick={disconnectWallet} className="text-lg">
                  Disconnect ({walletAddress?.slice(0, 6)}...)
                </Button>
              )}
              <Button size="lg" variant="gradient" onClick={() => setIsRoleDialogOpen(true)} className="text-lg">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Link to="/grants">
                <Button size="lg" variant="outline" className="text-lg">
                  Browse Grants
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">$2.5M+</div>
                <div className="text-sm text-muted-foreground">Total Grants</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">1,200+</div>
                <div className="text-sm text-muted-foreground">Projects Funded</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why Micro-Grant Platform?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built on Aptos blockchain for transparency, security, and efficiency
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Transparent & Secure',
                description: 'All transactions and milestones verified on-chain with immutable records.',
              },
              {
                icon: Zap,
                title: 'Fast Disbursement',
                description: 'Automated smart contracts release funds instantly when milestones are verified.',
              },
              {
                icon: Globe,
                title: 'Global Access',
                description: 'Connect donors and applicants worldwide with no geographic barriers.',
              },
              {
                icon: Target,
                title: 'Milestone-Based',
                description: 'Funds released incrementally based on verified progress and achievements.',
              },
              {
                icon: Users,
                title: 'Verified Reviews',
                description: 'Independent verifiers ensure project milestones meet requirements.',
              },
              {
                icon: TrendingUp,
                title: 'Impact Tracking',
                description: 'Real-time dashboard showing project progress and fund utilization.',
              },
            ].map((feature, index) => (
              <Card key={index} className="hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 bg-gradient-card">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple, transparent process from grant creation to fund disbursement
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {[
              {
                step: '01',
                title: 'Donors Create Grants',
                description: 'Set up grants with clear goals, milestones, and funding amounts',
                roles: 'For Donors',
              },
              {
                step: '02',
                title: 'Applicants Submit Proposals',
                description: 'Browse grants and submit detailed proposals with milestone plans',
                roles: 'For Applicants',
              },
              {
                step: '03',
                title: 'Verifiers Review Milestones',
                description: 'Independent verifiers check progress and approve milestone completion',
                roles: 'For Verifiers',
              },
              {
                step: '04',
                title: 'Smart Contracts Release Funds',
                description: 'Automated on-chain disbursement when milestones are verified',
                roles: 'Automated',
              },
            ].map((item) => (
              <Card key={item.step} className="bg-gradient-card hover:shadow-card-hover transition-all">
                <CardContent className="p-8">
                  <div className="flex gap-6 items-start">
                    <div className="text-5xl font-bold text-primary/20">{item.step}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold">{item.title}</h3>
                        <span className="text-sm text-primary font-medium">{item.roles}</span>
                      </div>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold text-white">
              Ready to Make an Impact?
            </h2>
            <p className="text-xl text-white/90">
              Join our community of donors, changemakers, and verifiers building a better future
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => setIsRoleDialogOpen(true)}
              className="text-lg"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Role Selection Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Choose Your Role</DialogTitle>
            <DialogDescription>
              Select how you'd like to participate in the micro-grant platform
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <Card 
              className="cursor-pointer hover:shadow-elegant transition-all hover:scale-105 bg-gradient-card"
              onClick={() => selectRole('donor')}
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Donor</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create grants, fund projects, and track impact
                </CardDescription>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-elegant transition-all hover:scale-105 bg-gradient-card"
              onClick={() => selectRole('applicant')}
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                  <Target className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Applicant</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Find grants, submit proposals, and receive funding
                </CardDescription>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-elegant transition-all hover:scale-105 bg-gradient-card"
              onClick={() => selectRole('verifier')}
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-2">
                  <Shield className="h-6 w-6 text-success" />
                </div>
                <CardTitle>Verifier</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Review milestones and verify project progress
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            {isWalletConnected ? 'Wallet connected. Continue by choosing a role.' : 'Connect your wallet to proceed with role selection.'}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
