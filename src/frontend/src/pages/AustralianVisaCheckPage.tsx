import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, AlertCircle, CheckCircle2, FileText, Download } from 'lucide-react';
import { useCheckApplicationStatus } from '../hooks/useQueries';
import { useBlobObjectUrl } from '../hooks/useBlobObjectUrl';
import type { ApplicationStatus } from '../backend';
import { normalizeApplicationKey } from '../utils/applicationStatusNormalization';

export default function AustralianVisaCheckPage() {
  const [applicationId, setApplicationId] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [result, setResult] = useState<ApplicationStatus | null | undefined>(undefined);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const checkStatus = useCheckApplicationStatus();

  // Create Blob URL for inline PDF preview
  const pdfUrl = useBlobObjectUrl(
    result?.attachment?.bytes,
    result?.attachment?.contentType
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!applicationId.trim() || !applicantEmail.trim()) {
      return;
    }

    // Reset state and show processing immediately
    setSubmissionError(null);
    setResult(undefined);
    setHasSubmitted(true);

    const normalized = normalizeApplicationKey(applicationId, applicantEmail);
    
    console.log('[VisaCheck] Submitting check:', {
      input: { applicationId, applicantEmail },
      normalized,
    });

    try {
      const status = await checkStatus.mutateAsync({
        applicationId,
        applicantEmail,
      });
      
      console.log('[VisaCheck] Response received:', status);
      
      // Ensure we always set a valid result (null for no match, object for found)
      setResult(status ?? null);
    } catch (error) {
      console.error('[VisaCheck] Error checking status:', error);
      setSubmissionError('Unable to check application status. Please try again later.');
      setResult(null);
    }
  };

  const handleReset = () => {
    setApplicationId('');
    setApplicantEmail('');
    setResult(undefined);
    setHasSubmitted(false);
    setSubmissionError(null);
    checkStatus.reset();
  };

  const handleViewPDF = () => {
    if (!result?.attachment) return;
    
    try {
      const blob = new Blob([new Uint8Array(result.attachment.bytes)], { 
        type: result.attachment.contentType 
      });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Clean up the URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error opening PDF:', error);
    }
  };

  const handleDownloadPDF = () => {
    if (!result?.attachment) return;
    
    try {
      const blob = new Blob([new Uint8Array(result.attachment.bytes)], { 
        type: result.attachment.contentType 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.attachment.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const getTodayDate = () => {
    return new Date().toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Determine what to show in results
  const showProcessing = hasSubmitted && result === undefined && !submissionError;
  const showError = hasSubmitted && submissionError !== null;
  const showNoMatch = hasSubmitted && result === null && !submissionError;
  const showFound = hasSubmitted && result !== null && result !== undefined && !submissionError;

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
                      placeholder="e.g., 4906670766"
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
                      placeholder="e.g., jr321134@gmail.com"
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
                  {hasSubmitted && (
                    <Button type="button" variant="outline" onClick={handleReset}>
                      Reset
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Results - Always show card when submitted */}
          {hasSubmitted && (
            <Card>
              <CardHeader>
                <CardTitle>Status Result</CardTitle>
              </CardHeader>
              <CardContent>
                {showProcessing && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                      Processing your request...
                    </AlertDescription>
                  </Alert>
                )}

                {showError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {submissionError}
                    </AlertDescription>
                  </Alert>
                )}

                {showNoMatch && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No status found for that Application ID and email. Please check your details and try again.
                    </AlertDescription>
                  </Alert>
                )}

                {showFound && result && (
                  <div className="space-y-4">
                    <Alert className="border-primary/50 bg-primary/5">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <AlertDescription className="text-base font-medium">
                        Application Found
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Applicant Name</p>
                        <p className="font-medium">{result.applicantName || '—'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Visa Type</p>
                        <p className="font-medium">{result.visaType || '—'}</p>
                      </div>
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
                        <p className="text-sm text-muted-foreground">Approval Date</p>
                        <p className="font-medium">{getTodayDate()}</p>
                      </div>
                    </div>

                    {result.comments && (
                      <div className="space-y-1 pt-2 border-t">
                        <p className="text-sm text-muted-foreground">Additional Comments</p>
                        <p className="text-sm">{result.comments}</p>
                      </div>
                    )}

                    {result.attachment && (
                      <div className="space-y-3 pt-2 border-t">
                        <p className="text-sm text-muted-foreground">Attached Document</p>
                        
                        {/* Inline PDF Preview */}
                        {pdfUrl ? (
                          <div className="space-y-3">
                            <div className="border rounded-lg overflow-hidden bg-muted/30">
                              <object
                                data={pdfUrl}
                                type="application/pdf"
                                className="w-full h-[600px]"
                                aria-label="PDF preview"
                              >
                                <div className="flex flex-col items-center justify-center h-[600px] p-6 text-center space-y-3">
                                  <FileText className="h-12 w-12 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">
                                    Your browser cannot display the PDF inline. Please use the buttons below to view or download the document.
                                  </p>
                                </div>
                              </object>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleViewPDF}
                                className="flex-1 sm:flex-none"
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                View PDF
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadPDF}
                                className="flex-1 sm:flex-none"
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleViewPDF}
                              className="flex-1 sm:flex-none"
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              View PDF
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleDownloadPDF}
                              className="flex-1 sm:flex-none"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
                            </Button>
                          </div>
                        )}
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
