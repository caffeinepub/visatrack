import { useGetUpcomingReminders } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UpcomingReminders() {
  const { data: records, isLoading } = useGetUpcomingReminders();

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const isOverdue = (timestamp: bigint) => {
    const now = Date.now() * 1_000_000;
    return timestamp < BigInt(now);
  };

  const getDaysUntil = (timestamp: bigint) => {
    const now = Date.now();
    const target = Number(timestamp) / 1_000_000;
    const diffMs = target - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return null;
  }

  if (!records || records.length === 0) {
    return null;
  }

  // Flatten all reminders with their associated records
  const allReminders = records.flatMap((record) =>
    record.reminders.map((reminder) => ({
      record,
      reminder,
      isOverdue: isOverdue(reminder),
      daysUntil: getDaysUntil(reminder),
    }))
  );

  // Sort by date
  allReminders.sort((a, b) => (a.reminder < b.reminder ? -1 : 1));

  const overdueCount = allReminders.filter((r) => r.isOverdue).length;

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle>Upcoming Reminders</CardTitle>
        </div>
        <CardDescription>
          Reminders for the next 30 days
          {overdueCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {overdueCount} overdue
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {allReminders.map((item, idx) => (
          <Alert
            key={`${item.record.id}-${idx}`}
            variant={item.isOverdue ? 'destructive' : 'default'}
            className="py-3"
          >
            <div className="flex items-start gap-3">
              {item.isOverdue ? (
                <AlertCircle className="h-5 w-5 mt-0.5" />
              ) : (
                <Calendar className="h-5 w-5 mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <AlertDescription className="font-medium text-base">
                  {item.record.visaLabel}
                </AlertDescription>
                <AlertDescription className="text-sm">
                  Reminder: {formatDate(item.reminder)}
                  {item.isOverdue ? (
                    <Badge variant="destructive" className="ml-2">
                      Overdue
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground ml-2">
                      ({item.daysUntil} {item.daysUntil === 1 ? 'day' : 'days'})
                    </span>
                  )}
                </AlertDescription>
                <AlertDescription className="text-xs text-muted-foreground">
                  Expires: {formatDate(item.record.expiryDate)}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
