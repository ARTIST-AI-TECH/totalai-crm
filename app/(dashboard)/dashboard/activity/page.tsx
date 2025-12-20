import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  Mail,
  CheckCircle,
  Shield,
  Eye,
  Clock,
  Filter,
  FileText,
  Briefcase,
  UserCheck,
  CheckCheck,
  XCircle,
  Webhook,
  Database,
  type LucideIcon,
} from 'lucide-react';
import { ActivityType } from '@/lib/db/schema';
import { getActivityLogs } from '@/lib/db/queries';

const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,

  // Work Order Events
  [ActivityType.WORK_ORDER_RECEIVED]: FileText,
  [ActivityType.WORK_ORDER_SCRAPED]: Database,
  [ActivityType.WORK_ORDER_JOB_CREATED]: Briefcase,
  [ActivityType.WORK_ORDER_ASSIGNED]: UserCheck,
  [ActivityType.WORK_ORDER_COMPLETED]: CheckCheck,
  [ActivityType.WORK_ORDER_ERROR]: XCircle,

  // Webhook Events
  [ActivityType.WEBHOOK_RECEIVED]: Webhook,
  [ActivityType.WEBHOOK_PROCESSED]: CheckCircle,
  [ActivityType.WEBHOOK_ERROR]: AlertCircle,
};

const actionColors: Record<ActivityType, string> = {
  [ActivityType.SIGN_UP]: 'bg-green-100 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  [ActivityType.SIGN_IN]: 'bg-blue-100 text-blue-600 border-blue-200',
  [ActivityType.SIGN_OUT]: 'bg-muted text-muted-foreground border-border',
  [ActivityType.UPDATE_PASSWORD]: 'bg-yellow-100 text-yellow-600 border-yellow-200',
  [ActivityType.DELETE_ACCOUNT]: 'bg-destructive/10 text-destructive border-destructive/20',
  [ActivityType.UPDATE_ACCOUNT]: 'bg-purple-100 text-purple-600 border-purple-200',
  [ActivityType.CREATE_TEAM]: 'bg-green-100 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  [ActivityType.REMOVE_TEAM_MEMBER]: 'bg-destructive/10 text-destructive border-destructive/20',
  [ActivityType.INVITE_TEAM_MEMBER]: 'bg-blue-100 text-blue-600 border-blue-200',
  [ActivityType.ACCEPT_INVITATION]: 'bg-green-100 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',

  // Work Order Events
  [ActivityType.WORK_ORDER_RECEIVED]: 'bg-blue-100 text-blue-600 border-blue-200',
  [ActivityType.WORK_ORDER_SCRAPED]: 'bg-purple-100 text-purple-600 border-purple-200',
  [ActivityType.WORK_ORDER_JOB_CREATED]: 'bg-green-100 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  [ActivityType.WORK_ORDER_ASSIGNED]: 'bg-blue-100 text-blue-600 border-blue-200',
  [ActivityType.WORK_ORDER_COMPLETED]: 'bg-green-100 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  [ActivityType.WORK_ORDER_ERROR]: 'bg-destructive/10 text-destructive border-destructive/20',

  // Webhook Events
  [ActivityType.WEBHOOK_RECEIVED]: 'bg-blue-100 text-blue-600 border-blue-200',
  [ActivityType.WEBHOOK_PROCESSED]: 'bg-green-100 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  [ActivityType.WEBHOOK_ERROR]: 'bg-destructive/10 text-destructive border-destructive/20',
};

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function formatAction(action: ActivityType): string {
  switch (action) {
    case ActivityType.SIGN_UP:
      return 'Account created';
    case ActivityType.SIGN_IN:
      return 'Signed in';
    case ActivityType.SIGN_OUT:
      return 'Signed out';
    case ActivityType.UPDATE_PASSWORD:
      return 'Password updated';
    case ActivityType.DELETE_ACCOUNT:
      return 'Account deleted';
    case ActivityType.UPDATE_ACCOUNT:
      return 'Account updated';
    case ActivityType.CREATE_TEAM:
      return 'Team created';
    case ActivityType.REMOVE_TEAM_MEMBER:
      return 'Member removed';
    case ActivityType.INVITE_TEAM_MEMBER:
      return 'Member invited';
    case ActivityType.ACCEPT_INVITATION:
      return 'Invitation accepted';
    default:
      return 'Unknown action';
  }
}

function getActionCategory(action: ActivityType): string {
  switch (action) {
    case ActivityType.SIGN_UP:
    case ActivityType.SIGN_IN:
    case ActivityType.SIGN_OUT:
      return 'Authentication';
    case ActivityType.UPDATE_PASSWORD:
    case ActivityType.DELETE_ACCOUNT:
    case ActivityType.UPDATE_ACCOUNT:
      return 'Account';
    case ActivityType.CREATE_TEAM:
    case ActivityType.REMOVE_TEAM_MEMBER:
    case ActivityType.INVITE_TEAM_MEMBER:
    case ActivityType.ACCEPT_INVITATION:
      return 'Team';
    default:
      return 'System';
  }
}

export default async function ActivityPage() {
  const logs = await getActivityLogs();
  
  // Group activities by date
  const groupedLogs = logs.reduce((groups, log) => {
    const date = new Date(log.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {} as Record<string, typeof logs>);

  const activityStats = {
    total: logs.length,
    today: logs.filter(log => {
      const today = new Date().toDateString();
      return new Date(log.timestamp).toDateString() === today;
    }).length,
    thisWeek: logs.filter(log => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(log.timestamp) > weekAgo;
    }).length,
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">
            Track all account and team activities
          </p>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityStats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityStats.today}</div>
            <p className="text-xs text-muted-foreground">Activities today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activityStats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            A detailed log of all account and team activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedLogs).map(([date, dayLogs]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    <Separator className="flex-1" />
                    <Badge variant="outline" className="text-xs">
                      {dayLogs.length} {dayLogs.length === 1 ? 'activity' : 'activities'}
                    </Badge>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dayLogs.map((log) => {
                        const Icon = iconMap[log.action as ActivityType] || Settings;
                        const formattedAction = formatAction(log.action as ActivityType);
                        const category = getActionCategory(log.action as ActivityType);
                        const colorClass = actionColors[log.action as ActivityType] || 'bg-muted text-muted-foreground border-border';

                        return (
                          <TableRow key={log.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className={`rounded-full p-2 ${colorClass.split(' ')[0]} border`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span className="font-medium">{formattedAction}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {getRelativeTime(new Date(log.timestamp))}
                            </TableCell>
                            <TableCell className="text-muted-foreground font-mono text-sm">
                              {log.ipAddress || '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="bg-primary/10 rounded-full p-4 mb-4">
                <AlertCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No activity yet
              </h3>
              <p className="text-muted-foreground max-w-sm">
                When you perform actions like signing in, updating your account, or managing team members, they'll appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
