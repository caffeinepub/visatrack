import { useGetVisaRecords, useDeleteVisaRecord } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Calendar, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { VisaRecord } from '../../backend';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface VisaRecordListProps {
  onEdit: (record: VisaRecord) => void;
}

export default function VisaRecordList({ onEdit }: VisaRecordListProps) {
  const { data: records, isLoading } = useGetVisaRecords();
  const deleteRecord = useDeleteVisaRecord();

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord.mutateAsync(id);
      toast.success('Visa record deleted successfully');
    } catch (error) {
      toast.error('Failed to delete record');
      console.error('Delete error:', error);
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const isExpiringSoon = (expiryDate: bigint) => {
    const now = Date.now() * 1_000_000;
    const thirtyDaysInNanos = BigInt(30 * 24 * 60 * 60 * 1_000_000_000);
    return expiryDate - BigInt(now) <= thirtyDaysInNanos && expiryDate > BigInt(now);
  };

  const isExpired = (expiryDate: bigint) => {
    const now = Date.now() * 1_000_000;
    return expiryDate < BigInt(now);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">Loading your visa records...</div>
        </CardContent>
      </Card>
    );
  }

  if (!records || records.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No visa records yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first visa record to track important dates and details.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">All Records ({records.length})</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {records.map((record) => (
          <Card key={record.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-xl">{record.visaLabel}</CardTitle>
                  {record.grantReference && (
                    <CardDescription className="mt-1">
                      Grant Ref: {record.grantReference}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(record)}
                    title="Edit record"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" title="Delete record">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Visa Record?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{record.visaLabel}" and all associated reminders. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(record.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Expires: <strong>{formatDate(record.expiryDate)}</strong>
                </span>
                {isExpired(record.expiryDate) && (
                  <Badge variant="destructive" className="ml-auto">
                    Expired
                  </Badge>
                )}
                {!isExpired(record.expiryDate) && isExpiringSoon(record.expiryDate) && (
                  <Badge variant="default" className="ml-auto bg-amber-500 hover:bg-amber-600">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Expiring Soon
                  </Badge>
                )}
              </div>

              {record.conditions && (
                <div className="text-sm">
                  <p className="text-muted-foreground mb-1">Conditions & Notes:</p>
                  <p className="text-foreground whitespace-pre-wrap">{record.conditions}</p>
                </div>
              )}

              {record.reminders.length > 0 && (
                <div className="text-sm">
                  <p className="text-muted-foreground mb-2">Reminders ({record.reminders.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {record.reminders.map((reminder, idx) => (
                      <Badge key={idx} variant="outline">
                        {formatDate(reminder)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
