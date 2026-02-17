import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetAllApplicationStatuses,
  useCreateOrUpdateApplicationStatus,
  useDeleteApplicationStatus,
} from '../../hooks/useQueries';
import type { ApplicationStatus } from '../../backend';

type FormData = {
  applicationId: string;
  applicantEmail: string;
  status: string;
  comments: string;
};

export default function ApplicationStatusManager() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<ApplicationStatus | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApplicationStatus | null>(null);
  const [formData, setFormData] = useState<FormData>({
    applicationId: '',
    applicantEmail: '',
    status: '',
    comments: '',
  });

  const { data: statuses = [], isLoading } = useGetAllApplicationStatuses();
  const createOrUpdate = useCreateOrUpdateApplicationStatus();
  const deleteStatus = useDeleteApplicationStatus();

  const handleOpenForm = (status?: ApplicationStatus) => {
    if (status) {
      setEditingStatus(status);
      setFormData({
        applicationId: status.applicationId,
        applicantEmail: status.applicantEmail,
        status: status.status,
        comments: status.comments || '',
      });
    } else {
      setEditingStatus(null);
      setFormData({
        applicationId: '',
        applicantEmail: '',
        status: '',
        comments: '',
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingStatus(null);
    setFormData({
      applicationId: '',
      applicantEmail: '',
      status: '',
      comments: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.applicationId.trim() || !formData.applicantEmail.trim() || !formData.status.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const statusData: ApplicationStatus = {
        applicationId: formData.applicationId.trim(),
        applicantEmail: formData.applicantEmail.trim(),
        status: formData.status.trim(),
        comments: formData.comments.trim() || undefined,
        lastUpdated: BigInt(Date.now() * 1_000_000),
      };

      await createOrUpdate.mutateAsync(statusData);
      toast.success(editingStatus ? 'Status updated successfully' : 'Status created successfully');
      handleCloseForm();
    } catch (error) {
      console.error('Error saving status:', error);
      toast.error('Failed to save status. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteStatus.mutateAsync({
        applicationId: deleteTarget.applicationId,
        applicantEmail: deleteTarget.applicantEmail,
      });
      toast.success('Status deleted successfully');
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting status:', error);
      toast.error('Failed to delete status. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Application Status Management</CardTitle>
            <CardDescription>
              Create and manage custom visa application statuses for the check system
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenForm()} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Status
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : statuses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No application statuses yet.</p>
            <p className="text-sm mt-1">Create your first status to get started.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statuses.map((status) => (
                  <TableRow key={`${status.applicationId}-${status.applicantEmail}`}>
                    <TableCell className="font-medium">{status.applicationId}</TableCell>
                    <TableCell>{status.applicantEmail}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                        {status.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(Number(status.lastUpdated) / 1_000_000).toLocaleDateString('en-AU')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenForm(status)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(status)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingStatus ? 'Edit Status' : 'Add New Status'}</DialogTitle>
              <DialogDescription>
                {editingStatus
                  ? 'Update the status information for this application'
                  : 'Create a new application status entry'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="applicationId">Application ID *</Label>
                <Input
                  id="applicationId"
                  placeholder="e.g., VIS2024-12345"
                  value={formData.applicationId}
                  onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
                  disabled={!!editingStatus || createOrUpdate.isPending}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="applicantEmail">Applicant Email *</Label>
                <Input
                  id="applicantEmail"
                  type="email"
                  placeholder="e.g., applicant@example.com"
                  value={formData.applicantEmail}
                  onChange={(e) => setFormData({ ...formData, applicantEmail: e.target.value })}
                  disabled={!!editingStatus || createOrUpdate.isPending}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Input
                  id="status"
                  placeholder="e.g., In Progress, Approved, Under Review"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={createOrUpdate.isPending}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comments">Additional Comments</Label>
                <Textarea
                  id="comments"
                  placeholder="Optional notes or additional information"
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  disabled={createOrUpdate.isPending}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseForm} disabled={createOrUpdate.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={createOrUpdate.isPending}>
                {createOrUpdate.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the status for application{' '}
              <span className="font-semibold">{deleteTarget?.applicationId}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteStatus.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteStatus.isPending}>
              {deleteStatus.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
