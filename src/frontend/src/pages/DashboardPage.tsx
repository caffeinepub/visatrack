import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import VisaRecordList from '../components/visa/VisaRecordList';
import VisaRecordForm from '../components/visa/VisaRecordForm';
import UpcomingReminders from '../components/reminders/UpcomingReminders';
import ApplicationStatusManager from '../components/status/ApplicationStatusManager';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import type { VisaRecord } from '../backend';

export default function DashboardPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<VisaRecord | null>(null);

  const handleEdit = (record: VisaRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRecord(null);
  };

  return (
    <AppLayout>
      <div className="container px-4 py-8 md:px-6 md:py-12 max-w-7xl mx-auto">
        <Tabs defaultValue="records" className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Manage your visa records and application statuses
              </p>
            </div>
            <TabsList>
              <TabsTrigger value="records">My Visa Records</TabsTrigger>
              <TabsTrigger value="statuses">Status Management</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="records" className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">My Visa Records</h2>
              <Button onClick={() => setIsFormOpen(true)} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Add Visa Record
              </Button>
            </div>

            {/* Upcoming Reminders */}
            <UpcomingReminders />

            {/* Visa Records List */}
            <VisaRecordList onEdit={handleEdit} />

            {/* Form Dialog */}
            {isFormOpen && (
              <VisaRecordForm
                record={editingRecord}
                onClose={handleCloseForm}
              />
            )}
          </TabsContent>

          <TabsContent value="statuses" className="space-y-8">
            <ApplicationStatusManager />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
