import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus } from 'lucide-react';
import { useState } from 'react';

interface ReminderManagerProps {
  expiryDate: string;
  reminders: bigint[];
  onRemindersChange: (reminders: bigint[]) => void;
  disabled?: boolean;
}

export default function ReminderManager({
  expiryDate,
  reminders,
  onRemindersChange,
  disabled,
}: ReminderManagerProps) {
  const [customDate, setCustomDate] = useState('');

  const addPresetReminder = (daysBefore: number) => {
    if (!expiryDate) return;

    const expiry = new Date(expiryDate);
    const reminderDate = new Date(expiry);
    reminderDate.setDate(reminderDate.getDate() - daysBefore);

    const reminderTimestamp = BigInt(reminderDate.getTime() * 1_000_000);

    if (!reminders.some((r) => r === reminderTimestamp)) {
      onRemindersChange([...reminders, reminderTimestamp].sort((a, b) => (a < b ? -1 : 1)));
    }
  };

  const addCustomReminder = () => {
    if (!customDate) return;

    const reminderTimestamp = BigInt(new Date(customDate).getTime() * 1_000_000);

    if (!reminders.some((r) => r === reminderTimestamp)) {
      onRemindersChange([...reminders, reminderTimestamp].sort((a, b) => (a < b ? -1 : 1)));
      setCustomDate('');
    }
  };

  const removeReminder = (timestamp: bigint) => {
    onRemindersChange(reminders.filter((r) => r !== timestamp));
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
      <Label className="text-base font-semibold">Reminders</Label>
      <p className="text-sm text-muted-foreground">
        Set reminders to notify you before your visa expires
      </p>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addPresetReminder(30)}
          disabled={disabled || !expiryDate}
        >
          <Plus className="h-3 w-3 mr-1" />
          30 days before
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addPresetReminder(14)}
          disabled={disabled || !expiryDate}
        >
          <Plus className="h-3 w-3 mr-1" />
          14 days before
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addPresetReminder(7)}
          disabled={disabled || !expiryDate}
        >
          <Plus className="h-3 w-3 mr-1" />
          7 days before
        </Button>
      </div>

      {/* Custom Date Input */}
      <div className="flex gap-2">
        <Input
          type="date"
          value={customDate}
          onChange={(e) => setCustomDate(e.target.value)}
          disabled={disabled}
          placeholder="Custom date"
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={addCustomReminder}
          disabled={disabled || !customDate}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Active Reminders */}
      {reminders.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Active Reminders ({reminders.length}):</p>
          <div className="flex flex-wrap gap-2">
            {reminders.map((reminder) => (
              <Badge key={reminder.toString()} variant="secondary" className="pr-1">
                {formatDate(reminder)}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 hover:bg-destructive/20"
                  onClick={() => removeReminder(reminder)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
