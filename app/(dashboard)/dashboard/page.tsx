'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// import { customerPortalAction } from '@/lib/payments/actions'; // Commented out - Stripe not needed yet
import { useActionState } from 'react';
import { TeamDataWithMembers, User } from '@/lib/db/schema';
import { removeTeamMember, inviteTeamMember } from '@/app/(login)/actions';
import useSWR from 'swr';
import { Suspense } from 'react';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Loader2,
  PlusCircle,
  Users,
  CreditCard,
  Activity,
  TrendingUp,
  Crown,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

type ActionState = {
  error?: string;
  success?: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Overview Cards Component
function OverviewCards() {
  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  
  const memberCount = teamData?.teamMembers?.length || 0;
  const planName = teamData?.planName || 'Free';
  const subscriptionStatus = teamData?.subscriptionStatus;
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Team Members Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{memberCount}</div>
          <p className="text-xs text-muted-foreground">
            {memberCount === 1 ? 'Active member' : 'Active members'}
          </p>
        </CardContent>
      </Card>

      {/* Subscription Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{planName}</div>
          <p className="text-xs text-muted-foreground">
            {subscriptionStatus === 'active'
              ? 'Billed monthly'
              : subscriptionStatus === 'trialing'
              ? 'Trial period'
              : 'Free plan'}
          </p>
        </CardContent>
      </Card>

      {/* Account Status Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Account Status</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {subscriptionStatus === 'active' ? (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
                Active
              </Badge>
            ) : subscriptionStatus === 'trialing' ? (
              <Badge variant="secondary">Trial</Badge>
            ) : (
              <Badge variant="outline">Free</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {user?.role === 'owner' ? 'Team Owner' : 'Team Member'}
          </p>
        </CardContent>
      </Card>

      {/* Growth Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Growth</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{memberCount > 1 ? memberCount - 1 : 0}</div>
          <p className="text-xs text-muted-foreground">
            New members this month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Quick Actions Component
function QuickActions() {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const isOwner = user?.role === 'owner';
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Manage your team and account settings
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Button variant="outline" className="w-full justify-start" disabled>
          <CreditCard className="mr-2 h-4 w-4" />
          Manage Subscription
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start"
          disabled={!isOwner}
          onClick={() => {
            // This would typically open a modal or navigate to invite page
            const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
            if (emailInput) {
              emailInput.focus();
            }
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Invite Team Member
        </Button>
        
        <Button variant="outline" className="w-full justify-start" asChild>
          <a href="/dashboard/security">
            <CheckCircle className="mr-2 h-4 w-4" />
            Security Settings
          </a>
        </Button>
        
        <Button variant="outline" className="w-full justify-start" asChild>
          <a href="/dashboard/activity">
            <Activity className="mr-2 h-4 w-4" />
            View Activity
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

// Team Members Table Component
function TeamMembersTable() {
  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const [removeState, removeAction, isRemovePending] = useActionState<
    ActionState,
    FormData
  >(removeTeamMember, {});

  const getUserDisplayName = (user: Pick<User, 'id' | 'name' | 'email'>) => {
    return user.name || user.email || 'Unknown User';
  };

  if (!teamData?.teamMembers?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage your team members and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No team members yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>Manage your team members and their roles</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamData.teamMembers.map((member, index) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getUserDisplayName(member.user)
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {getUserDisplayName(member.user)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={member.role === 'owner' ? 'default' : 'secondary'}
                    className={member.role === 'owner' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''}
                  >
                    {member.role === 'owner' && <Crown className="mr-1 h-3 w-3" />}
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {index > 0 && member.role !== 'owner' ? (
                    <form action={removeAction} className="inline">
                      <input type="hidden" name="memberId" value={member.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        disabled={isRemovePending}
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                      
                        {isRemovePending ? 'Removing...' : 'Remove'}
                      </Button>
                    </form>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {removeState?.error && (
          <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-destructive text-sm flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" />
              {removeState.error}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Invite Team Member Component
function InviteTeamMember() {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const isOwner = user?.role === 'owner';
  const [inviteState, inviteAction, isInvitePending] = useActionState<
    ActionState,
    FormData
  >(inviteTeamMember, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Team Member</CardTitle>
        <CardDescription>
          Add new members to your team to collaborate together
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={inviteAction} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email address"
                required
                disabled={!isOwner}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Role</Label>
              <RadioGroup
                defaultValue="member"
                name="role"
                className="flex space-x-6 mt-2"
                disabled={!isOwner}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="member" id="member" />
                  <Label htmlFor="member" className="text-sm">Member</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="owner" id="owner" />
                  <Label htmlFor="owner" className="text-sm flex items-center">
                    <Crown className="mr-1 h-3 w-3" />
                    Owner
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          {inviteState?.error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-destructive text-sm flex items-center">
                <AlertCircle className="mr-2 h-4 w-4" />
                {inviteState.error}
              </p>
            </div>
          )}
          
          {inviteState?.success && (
            <div className="p-3 rounded-md bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <p className="text-green-700 dark:text-green-200 text-sm flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                {inviteState.success}
              </p>
            </div>
          )}
          
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isInvitePending || !isOwner}
          >
            {isInvitePending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Invitation...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Send Invitation
              </>
            )}
          </Button>
        </form>
      </CardContent>
      {!isOwner && (
        <CardFooter className="bg-muted/50">
          <p className="text-sm text-muted-foreground flex items-center">
            <AlertCircle className="mr-2 h-4 w-4" />
            You must be a team owner to invite new members.
          </p>
        </CardFooter>
      )}
    </Card>
  );
}

// Skeleton components for loading states
function OverviewSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your team and account settings
          </p>
        </div>
      </div>
      
      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewCards />
      </Suspense>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Suspense fallback={<TableSkeleton />}>
            <TeamMembersTable />
          </Suspense>
        </div>
        
        <div className="space-y-6">
          <QuickActions />
          <Suspense fallback={<Card className="h-[400px]" />}>
            <InviteTeamMember />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
