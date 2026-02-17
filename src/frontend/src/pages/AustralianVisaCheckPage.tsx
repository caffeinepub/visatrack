import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCheckApplicationStatus } from '../hooks/useQueries';
import type { ApplicationStatus } from '../backend';

export default function AustralianVisaCheckPage() {
  const [applicationId, setApplicationId] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [result, setResult] = useState<ApplicationStatus | null | undefined>(undefined);

  const checkStatus = useCheckApplicationStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!applicationId.trim() || !applicantEmail.trim()) {
      return;
    }

    try {
      const status = await checkStatus.mutateAsync({
        applicationId: applicationId.trim(),
        applicantEmail: applicantEmail.trim(),
      });
      setResult(status);
    } catch (error) {
      console.error('Error checking status:', error);
      setResult(null);
    }
  };

  const handleReset = () => {
    setApplicationId('');
    setApplicantEmail('');
    setResult(undefined);
    checkStatus.reset();
  };

  return (
    <AppLayout>
      <div className="container px-4 py-8 md:px-6 md:py-12 max-w-4xl mx-auto">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Australian Visa Status Check</h1>
            <p className="text-muted-foreground">
              Enter your application details to check your visa application status
            </p>
          </div>

          {/* Check Form */}
          <Card>
            <CardHeader>
              <CardTitle>Check Application Status</CardTitle>
              <CardDescription>
                Please enter your Application ID and the email address used for your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="applicationId">Application ID</Label>
                    <Input
                      id="applicationId"
                      placeholder="e.g., VIS2024-12345"
                      value={applicationId}
                      onChange={(e) => setApplicationId(e.target.value)}
                      required
                      disabled={checkStatus.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="applicantEmail">Applicant Email</Label>
                    <Input
                      id="applicantEmail"
                      type="email"
                      placeholder="e.g., applicant@example.com"
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      required
                      disabled={checkStatus.isPending}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={checkStatus.isPending || !applicationId.trim() || !applicantEmail.trim()}
                    className="flex-1"
                  >
                    {checkStatus.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Check Status
                      </>
                    )}
                  </Button>
                  {result !== undefined && (
                    <Button type="button" variant="outline" onClick={handleReset}>
                      Reset
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          {result !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle>Status Result</CardTitle>
              </CardHeader>
              <CardContent>
                {result === null ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No status found for that Application ID and email. Please check your details and try again.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <Alert className="border-primary/50 bg-primary/5">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <AlertDescription className="text-base font-medium">
                        Application Found
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Application ID</p>
                        <p className="font-medium">{result.applicationId}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Applicant Email</p>
                        <p className="font-medium">{result.applicantEmail}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-semibold text-lg text-primary">{result.status}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Last Updated</p>
                        <p className="font-medium">
                          {new Date(Number(result.lastUpdated) / 1_000_000).toLocaleDateString('en-AU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    {result.comments && (
                      <div className="space-y-1 pt-2 border-t">
                        <p className="text-sm text-muted-foreground">Additional Comments</p>
                        <p className="text-sm">{result.comments}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
