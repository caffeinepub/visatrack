import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Plus, Trash2, Edit, Save, X, AlertCircle } from 'lucide-react';
import {
  useGetAllApplicationStatuses,
  useCreateOrUpdateApplicationStatus,
  useDeleteApplicationStatus,
} from '../../hooks/useQueries';
import type { ApplicationStatus } from '../../backend';
import { normalizeApplicationKey } from '../../utils/applicationStatusNormalization';

/**
 * Authenticated component for managing application status entries with proper email/ID normalization
 */
export default function ApplicationStatusManager() {
  const queryClient = useQueryClient();
  const { data: statuses = [], isLoading } = useGetAllApplicationStatuses();
  const createOrUpdateMutation = useCreateOrUpdateApplicationStatus();
  const deleteMutation = useDeleteApplicationStatus();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    applicationId: '',
    applicantEmail: '',
    applicantName: '',
    visaType: '',
    status: '',
    comments: '',
  });

  const handleEdit = (status: ApplicationStatus) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [ApplicationStatusManager] Edit initiated for:`, status.applicationId);
    
    setEditingId(`${status.applicationId}-${status.applicantEmail}`);
    setFormData({
      applicationId: status.applicationId,
      applicantEmail: status.applicantEmail,
      applicantName: status.applicantName,
      visaType: status.visaType,
      status: status.status,
      comments: status.comments || '',
    });
    setIsCreating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [ApplicationStatusManager] Submit initiated`);
    console.log(`[${timestamp}] [ApplicationStatusManager] Raw form data:`, {
      applicationId: `"${formData.applicationId}"`,
      applicantEmail: `"${formData.applicantEmail}"`,
    });

    // Normalize the identifiers before submission
    const normalized = normalizeApplicationKey(formData.applicationId, formData.applicantEmail);
    console.log(`[${timestamp}] [ApplicationStatusManager] Normalized identifiers:`, {
      applicationId: `"${normalized.applicationId}"`,
      applicantEmail: `"${normalized.applicantEmail}"`,
    });

    const statusData: ApplicationStatus = {
      applicationId: normalized.applicationId,
      applicantEmail: normalized.applicantEmail,
      applicantName: formData.applicantName,
      visaType: formData.visaType,
      status: formData.status,
      lastUpdated: BigInt(Date.now() * 1_000_000),
      comments: formData.comments || undefined,
    };

    console.log(`[${timestamp}] [ApplicationStatusManager] Final status data:`, {
      applicationId: statusData.applicationId,
      applicantEmail: statusData.applicantEmail,
    });

    try {
      await createOrUpdateMutation.mutateAsync(statusData);
      console.log(`[${timestamp}] [ApplicationStatusManager] Status saved successfully`);

      // Verify the saved data
      queryClient.invalidateQueries({ queryKey: ['applicationStatuses'] });
      
      handleCancel();
    } catch (error) {
      console.error(`[${timestamp}] [ApplicationStatusManager] Error saving status:`, error);
      alert('Failed to save application status');
    }
  };

  const handleDelete = async (applicationId: string, applicantEmail: string) => {
    if (!confirm('Are you sure you want to delete this application status?')) {
      return;
    }

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [ApplicationStatusManager] Delete initiated:`, {
      applicationId,
      applicantEmail,
    });

    try {
      await deleteMutation.mutateAsync({ applicationId, applicantEmail });
      console.log(`[${timestamp}] [ApplicationStatusManager] Status deleted successfully`);
    } catch (error) {
      console.error(`[${timestamp}] [ApplicationStatusManager] Error deleting status:`, error);
      alert('Failed to delete application status');
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      applicationId: '',
      applicantEmail: '',
      applicantName: '',
      visaType: '',
      status: '',
      comments: '',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Application Status' : 'Create Application Status'}</CardTitle>
            <CardDescription>
              {editingId ? 'Update the application status details' : 'Add a new application status entry'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="applicationId">Application ID</Label>
                  <Input
                    id="applicationId"
                    value={formData.applicationId}
                    onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
                    required
                    disabled={!!editingId}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicantEmail">Applicant Email</Label>
                  <Input
                    id="applicantEmail"
                    type="email"
                    value={formData.applicantEmail}
                    onChange={(e) => setFormData({ ...formData, applicantEmail: e.target.value })}
                    required
                    disabled={!!editingId}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicantName">Applicant Name</Label>
                  <Input
                    id="applicantName"
                    value={formData.applicantName}
                    onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visaType">Visa Type</Label>
                  <Input
                    id="visaType"
                    value={formData.visaType}
                    onChange={(e) => setFormData({ ...formData, visaType: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Under Review">Under Review</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createOrUpdateMutation.isPending}>
                  {createOrUpdateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Create Button */}
      {!isCreating && !editingId && (
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Application Status
        </Button>
      )}

      {/* Status List */}
      <div className="space-y-4">
        {statuses.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No application statuses found. Create one to get started.
            </AlertDescription>
          </Alert>
        ) : (
          statuses.map((status) => (
            <Card key={`${status.applicationId}-${status.applicantEmail}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{status.applicantName}</CardTitle>
                    <CardDescription>
                      {status.applicationId} • {status.applicantEmail}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(status)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(status.applicationId, status.applicantEmail)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Visa Type</Label>
                    <p className="text-sm">{status.visaType}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <p className="text-sm font-medium">{status.status}</p>
                  </div>
                </div>

                {status.comments && (
                  <div>
                    <Label>Comments</Label>
                    <p className="text-sm text-muted-foreground">{status.comments}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
