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
import { Plus, Pencil, Trash2, Loader2, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetAllApplicationStatuses,
  useCreateOrUpdateApplicationStatus,
  useDeleteApplicationStatus,
} from '../../hooks/useQueries';
import type { ApplicationStatus } from '../../backend';
import { useBlobObjectUrl } from '../../hooks/useBlobObjectUrl';
import PdfAttachmentSection from './PdfAttachmentSection';
import { openPDFInNewTab, downloadPDF } from '../../utils/pdfAttachment';

type FormData = {
  applicationId: string;
  applicantEmail: string;
  applicantName: string;
  visaType: string;
  status: string;
  comments: string;
  pdfFile: File | null;
};

export default function ApplicationStatusManager() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<ApplicationStatus | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApplicationStatus | null>(null);
  const [formData, setFormData] = useState<FormData>({
    applicationId: '',
    applicantEmail: '',
    applicantName: '',
    visaType: '',
    status: '',
    comments: '',
    pdfFile: null,
  });

  const { data: statuses = [], isLoading } = useGetAllApplicationStatuses();
  const createOrUpdate = useCreateOrUpdateApplicationStatus();
  const deleteStatus = useDeleteApplicationStatus();

  // Check if editing status has a valid attachment
  const hasExistingAttachment = editingStatus?.attachment && editingStatus.attachment.bytes && editingStatus.attachment.bytes.length > 0;

  // Create Blob URL for existing attachment preview
  const { url: pdfUrl, error: pdfUrlError } = useBlobObjectUrl(
    hasExistingAttachment ? editingStatus.attachment?.bytes : undefined,
    hasExistingAttachment ? (editingStatus.attachment?.contentType || 'application/pdf') : undefined
  );

  const handleOpenForm = (status?: ApplicationStatus) => {
    if (status) {
      setEditingStatus(status);
      setFormData({
        applicationId: status.applicationId,
        applicantEmail: status.applicantEmail,
        applicantName: status.applicantName || '',
        visaType: status.visaType || '',
        status: status.status,
        comments: status.comments || '',
        pdfFile: null,
      });
    } else {
      setEditingStatus(null);
      setFormData({
        applicationId: '',
        applicantEmail: '',
        applicantName: '',
        visaType: '',
        status: '',
        comments: '',
        pdfFile: null,
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
      applicantName: '',
      visaType: '',
      status: '',
      comments: '',
      pdfFile: null,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setFormData({ ...formData, pdfFile: file });
    }
  };

  const handleRemoveFile = () => {
    setFormData({ ...formData, pdfFile: null });
  };

  const handleViewPDF = () => {
    if (!editingStatus?.attachment?.bytes || editingStatus.attachment.bytes.length === 0) {
      toast.error('No PDF attachment available');
      return;
    }

    openPDFInNewTab(
      editingStatus.attachment.bytes,
      editingStatus.attachment.contentType || 'application/pdf',
      editingStatus.attachment.filename
    );
  };

  const handleDownloadPDF = () => {
    if (!editingStatus?.attachment?.bytes || editingStatus.attachment.bytes.length === 0) {
      toast.error('No PDF attachment available');
      return;
    }

    downloadPDF(
      editingStatus.attachment.bytes,
      editingStatus.attachment.filename || 'attachment.pdf',
      editingStatus.attachment.contentType || 'application/pdf'
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.applicationId.trim() || !formData.applicantEmail.trim()) {
      toast.error('Application ID and email are required');
      return;
    }

    try {
      let attachment = editingStatus?.attachment;

      if (formData.pdfFile) {
        const arrayBuffer = await formData.pdfFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        attachment = {
          filename: formData.pdfFile.name,
          contentType: formData.pdfFile.type,
          bytes,
        };
      }

      const statusData: ApplicationStatus = {
        applicationId: formData.applicationId,
        applicantEmail: formData.applicantEmail,
        applicantName: formData.applicantName,
        visaType: formData.visaType,
        status: formData.status,
        lastUpdated: BigInt(Date.now() * 1_000_000),
        comments: formData.comments || undefined,
        attachment,
      };

      await createOrUpdate.mutateAsync(statusData);
      toast.success(editingStatus ? 'Status updated successfully' : 'Status created successfully');
      handleCloseForm();
    } catch (error) {
      console.error('Error saving status:', error);
      toast.error('Failed to save status');
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
      toast.error('Failed to delete status');
    }
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1_000_000).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Application Status Management</CardTitle>
              <CardDescription>
                Manage visa application statuses for public lookup
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenForm()}>
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
              <p>No application statuses yet</p>
              <p className="text-sm mt-1">Create one to get started</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application ID</TableHead>
                    <TableHead>Applicant Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Visa Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>PDF</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statuses.map((status) => (
                    <TableRow key={`${status.applicationId}-${status.applicantEmail}`}>
                      <TableCell className="font-medium">{status.applicationId}</TableCell>
                      <TableCell>{status.applicantName || '—'}</TableCell>
                      <TableCell>{status.applicantEmail}</TableCell>
                      <TableCell>{status.visaType || '—'}</TableCell>
                      <TableCell>{status.status}</TableCell>
                      <TableCell>{formatDate(status.lastUpdated)}</TableCell>
                      <TableCell>
                        {status.attachment ? (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenForm(status)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
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
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStatus ? 'Edit Application Status' : 'Add Application Status'}
            </DialogTitle>
            <DialogDescription>
              {editingStatus
                ? 'Update the application status details'
                : 'Create a new application status for public lookup'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applicationId">
                  Application ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="applicationId"
                  value={formData.applicationId}
                  onChange={(e) =>
                    setFormData({ ...formData, applicationId: e.target.value })
                  }
                  disabled={!!editingStatus}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="applicantEmail">
                  Applicant Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="applicantEmail"
                  type="email"
                  value={formData.applicantEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, applicantEmail: e.target.value })
                  }
                  disabled={!!editingStatus}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applicantName">Applicant Name</Label>
                <Input
                  id="applicantName"
                  value={formData.applicantName}
                  onChange={(e) =>
                    setFormData({ ...formData, applicantName: e.target.value })
                  }
                  placeholder="e.g., John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visaType">Visa Type</Label>
                <Input
                  id="visaType"
                  value={formData.visaType}
                  onChange={(e) =>
                    setFormData({ ...formData, visaType: e.target.value })
                  }
                  placeholder="e.g., Work Visa"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-destructive">*</span>
              </Label>
              <Input
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                placeholder="e.g., Approved, Pending, Rejected"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                placeholder="Additional information or notes"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdfFile">
                PDF Attachment {editingStatus?.attachment && '(Replace existing)'}
              </Label>
              {formData.pdfFile ? (
                <div className="flex items-center gap-2 p-3 border rounded-md">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm flex-1">{formData.pdfFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
              <Input
                id="pdfFile"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                PDF files only, max 5MB
              </p>
            </div>

            {/* Attached Document Section - Only show when editing and has attachment */}
            {editingStatus && hasExistingAttachment && !formData.pdfFile && (
              <PdfAttachmentSection
                attachment={editingStatus.attachment}
                pdfUrl={pdfUrl || undefined}
                pdfUrlError={pdfUrlError || undefined}
                onViewPDF={handleViewPDF}
                onDownloadPDF={handleDownloadPDF}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={createOrUpdate.isPending}>
                {createOrUpdate.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingStatus ? (
                  'Update Status'
                ) : (
                  'Create Status'
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
              Are you sure you want to delete the status for Application ID{' '}
              <strong>{deleteTarget?.applicationId}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteStatus.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
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
    </div>
  );
}
