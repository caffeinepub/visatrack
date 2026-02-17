import { useState, useEffect } from 'react';
import { useCreateVisaRecord, useUpdateVisaRecord } from '../../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { VisaRecord } from '../../backend';
import ReminderManager from '../reminders/ReminderManager';

interface VisaRecordFormProps {
  record: VisaRecord | null;
  onClose: () => void;
}

export default function VisaRecordForm({ record, onClose }: VisaRecordFormProps) {
  const [visaLabel, setVisaLabel] = useState('');
  const [grantReference, setGrantReference] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [conditions, setConditions] = useState('');
  const [reminders, setReminders] = useState<bigint[]>([]);

  const createRecord = useCreateVisaRecord();
  const updateRecord = useUpdateVisaRecord();

  const isEditing = !!record;

  useEffect(() => {
    if (record) {
      setVisaLabel(record.visaLabel);
      setGrantReference(record.grantReference || '');
      setExpiryDate(new Date(Number(record.expiryDate) / 1_000_000).toISOString().split('T')[0]);
      setConditions(record.conditions || '');
      setReminders(record.reminders);
    }
  }, [record]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!visaLabel.trim()) {
      toast.error('Please enter a visa label');
      return;
    }

    if (!expiryDate) {
      toast.error('Please select an expiry date');
      return;
    }

    const expiryTimestamp = BigInt(new Date(expiryDate).getTime() * 1_000_000);
    const now = BigInt(Date.now() * 1_000_000);

    const visaRecord: VisaRecord = {
      id: record?.id || crypto.randomUUID(),
      visaLabel: visaLabel.trim(),
      grantReference: grantReference.trim() || undefined,
      expiryDate: expiryTimestamp,
      conditions: conditions.trim() || undefined,
      createdAt: record?.createdAt || now,
      updatedAt: now,
      reminders: reminders,
    };

    try {
      if (isEditing) {
        await updateRecord.mutateAsync({ id: record.id, record: visaRecord });
        toast.success('Visa record updated successfully');
      } else {
        await createRecord.mutateAsync(visaRecord);
        toast.success('Visa record created successfully');
      }
      onClose();
    } catch (error) {
      toast.error(isEditing ? 'Failed to update record' : 'Failed to create record');
      console.error('Form submission error:', error);
    }
  };

  const isPending = createRecord.isPending || updateRecord.isPending;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Visa Record' : 'Add New Visa Record'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your visa information and reminders.'
              : 'Enter your visa details to keep track of important dates.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="visaLabel">
                Visa Label <span className="text-destructive">*</span>
              </Label>
              <Input
                id="visaLabel"
                placeholder="e.g., Student Visa, Work Visa, Tourist Visa"
                value={visaLabel}
                onChange={(e) => setVisaLabel(e.target.value)}
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grantReference">Grant Reference Number (Optional)</Label>
              <Input
                id="grantReference"
                placeholder="e.g., 123456789"
                value={grantReference}
                onChange={(e) => setGrantReference(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">
                Expiry Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conditions">Conditions & Notes (Optional)</Label>
              <Textarea
                id="conditions"
                placeholder="Add any visa conditions, restrictions, or personal notes..."
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                disabled={isPending}
                rows={4}
              />
            </div>

            <ReminderManager
              expiryDate={expiryDate}
              reminders={reminders}
              onRemindersChange={setReminders}
              disabled={isPending}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : isEditing ? 'Update Record' : 'Create Record'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
