import React, { useState } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { useCheckApplicationStatus } from '../hooks/useQueries';
import { normalizeApplicationKey } from '../utils/applicationStatusNormalization';
import AppLayout from '../components/layout/AppLayout';

/**
 * Public visa status check page with blue-themed UI that uses React Query's
 * useCheckApplicationStatus mutation hook with comprehensive error handling
 */
export default function AustralianVisaCheckPage() {
  const [applicationId, setApplicationId] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');

  const { mutate: checkStatus, data: status, isPending, error } = useCheckApplicationStatus();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [AustralianVisaCheckPage] Search initiated`);
    console.log(`[${timestamp}] [AustralianVisaCheckPage] Raw Application ID: "${applicationId}"`);
    console.log(`[${timestamp}] [AustralianVisaCheckPage] Raw Applicant Email: "${applicantEmail}"`);

    const normalized = normalizeApplicationKey(applicationId, applicantEmail);
    console.log(`[${timestamp}] [AustralianVisaCheckPage] Normalized Application ID: "${normalized.applicationId}"`);
    console.log(`[${timestamp}] [AustralianVisaCheckPage] Normalized Applicant Email: "${normalized.applicantEmail}"`);
    console.log(`[${timestamp}] [AustralianVisaCheckPage] Calling mutation`);

    checkStatus({
      applicationId: normalized.applicationId,
      applicantEmail: normalized.applicantEmail,
    });
  };

  const handleReset = () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [AustralianVisaCheckPage] Reset clicked - clearing all state`);
    setApplicationId('');
    setApplicantEmail('');
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-blue-900 mb-4">
              Australian Visa Status Check
            </h1>
            <p className="text-lg text-blue-700">
              Enter your application details to check your visa status
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-8 border-blue-200 shadow-lg">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-blue-900">Check Your Application</CardTitle>
              <CardDescription>
                Enter your application ID and email address to view your visa status
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="applicationId" className="text-blue-900">
                    Application ID
                  </Label>
                  <Input
                    id="applicationId"
                    type="text"
                    placeholder="Enter your application ID"
                    value={applicationId}
                    onChange={(e) => setApplicationId(e.target.value)}
                    required
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicantEmail" className="text-blue-900">
                    Email Address
                  </Label>
                  <Input
                    id="applicantEmail"
                    type="email"
                    placeholder="Enter your email address"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    required
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isPending ? (
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
                  {status && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error instanceof Error ? error.message : 'An error occurred while checking your application status.'}
              </AlertDescription>
            </Alert>
          )}

          {/* No Results Display */}
          {!isPending && !error && status === null && applicationId && applicantEmail && (
            <Alert className="mb-8 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                No application found with the provided details. Please check your Application ID and Email address.
              </AlertDescription>
            </Alert>
          )}

          {/* Results Display */}
          {status && (
            <Card className="border-blue-200 shadow-lg">
              <CardHeader className="bg-blue-50">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-blue-900 mb-2">
                      Application Status
                    </CardTitle>
                    <CardDescription>
                      Application ID: {status.applicationId}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={status.status.toLowerCase().includes('approved') ? 'default' : 'secondary'}
                    className={
                      status.status.toLowerCase().includes('approved')
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }
                  >
                    {status.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-blue-900">Applicant Name</Label>
                    <p className="text-lg font-medium mt-1">{status.applicantName}</p>
                  </div>
                  <div>
                    <Label className="text-blue-900">Visa Type</Label>
                    <p className="text-lg font-medium mt-1">{status.visaType}</p>
                  </div>
                  <div>
                    <Label className="text-blue-900">Email</Label>
                    <p className="text-lg font-medium mt-1">{status.applicantEmail}</p>
                  </div>
                  <div>
                    <Label className="text-blue-900">Last Updated</Label>
                    <p className="text-lg font-medium mt-1">
                      {new Date(Number(status.lastUpdated) / 1_000_000).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {status.comments && (
                  <div>
                    <Label className="text-blue-900">Comments</Label>
                    <p className="text-base mt-2 text-muted-foreground">{status.comments}</p>
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
