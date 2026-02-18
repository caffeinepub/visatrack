import { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, AlertCircle, CheckCircle2, WifiOff } from 'lucide-react';
import { useCheckApplicationStatus } from '../hooks/useQueries';
import { useActorReadiness } from '../hooks/useActorReadiness';
import { useBlobObjectUrl } from '../hooks/useBlobObjectUrl';
import PdfAttachmentSection from '../components/status/PdfAttachmentSection';
import type { ApplicationStatus } from '../backend';
import { normalizeApplicationKey } from '../utils/applicationStatusNormalization';
import { openPDFInNewTab, downloadPDF } from '../utils/pdfAttachment';

export default function AustralianVisaCheckPage() {
  const [applicationId, setApplicationId] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [result, setResult] = useState<ApplicationStatus | null | undefined>(undefined);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isConnectionError, setIsConnectionError] = useState(false);

  const checkStatus = useCheckApplicationStatus();
  const { isInitializing, isReady, hasError: actorInitError } = useActorReadiness();

  // Only create Blob URL when we have valid attachment data
  const hasValidAttachment = result?.attachment && result.attachment.bytes && result.attachment.bytes.length > 0;
  const { url: pdfUrl, error: pdfUrlError } = useBlobObjectUrl(
    hasValidAttachment ? result.attachment?.bytes : undefined,
    hasValidAttachment ? (result.attachment?.contentType || 'application/pdf') : undefined
  );

  // Developer diagnostics for attachment presence
  useEffect(() => {
    if (result && result !== null) {
      console.log('[VisaCheck] Result attachment diagnostics:', {
        hasAttachment: !!result.attachment,
        contentType: result.attachment?.contentType,
        bytesLength: result.attachment?.bytes ? result.attachment.bytes.length : 0,
        filename: result.attachment?.filename,
        pdfUrl: pdfUrl ? 'created' : 'null',
        pdfUrlError,
      });
    }
  }, [result, pdfUrl, pdfUrlError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!applicationId.trim() || !applicantEmail.trim()) {
      return;
    }

    // Check if actor is ready
    if (!isReady) {
      console.warn('[VisaCheck] Submit blocked: actor not ready', {
        isInitializing,
        isReady,
        actorInitError,
      });
      setSubmissionError('Connection is still initializing. Please wait a moment and try again.');
      setIsConnectionError(true);
      return;
    }

    // Reset state and show processing immediately
    setSubmissionError(null);
    setIsConnectionError(false);
    setResult(undefined);
    setHasSubmitted(true);

    const normalized = normalizeApplicationKey(applicationId, applicantEmail);
    
    console.log('[VisaCheck] Submitting check:', {
      input: { applicationId, applicantEmail },
      normalized,
      actorReady: isReady,
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
      console.error('[VisaCheck] Error checking status:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : undefined,
      });

      // Distinguish connection/setup errors from other errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Connection not ready') || errorMessage.includes('Actor not available')) {
        setSubmissionError('Connection issue detected. Please refresh the page and try again.');
        setIsConnectionError(true);
      } else {
        setSubmissionError('Unable to check application status. Please try again later.');
        setIsConnectionError(false);
      }
      setResult(null);
    }
  };

  const handleReset = () => {
    setApplicationId('');
    setApplicantEmail('');
    setResult(undefined);
    setHasSubmitted(false);
    setSubmissionError(null);
    setIsConnectionError(false);
    checkStatus.reset();
  };

  const handleViewPDF = () => {
    if (!result?.attachment?.bytes || result.attachment.bytes.length === 0) {
      console.error('[VisaCheck] Cannot view PDF: no bytes available');
      return;
    }
    
    openPDFInNewTab(
      result.attachment.bytes,
      result.attachment.contentType || 'application/pdf',
      result.attachment.filename
    );
  };

  const handleDownloadPDF = () => {
    if (!result?.attachment?.bytes || result.attachment.bytes.length === 0) {
      console.error('[VisaCheck] Cannot download PDF: no bytes available');
      return;
    }
    
    downloadPDF(
      result.attachment.bytes,
      result.attachment.filename || 'attachment.pdf',
      result.attachment.contentType || 'application/pdf'
    );
  };

  const getTodayDate = () => {
    return new Date().toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Determine what to show in results
  const showInitializing = isInitializing && hasSubmitted && result === undefined && !submissionError;
  const showProcessing = !isInitializing && hasSubmitted && result === undefined && !submissionError && checkStatus.isPending;
  const showConnectionError = hasSubmitted && isConnectionError && submissionError !== null;
  const showError = hasSubmitted && !isConnectionError && submissionError !== null;
  const showNoMatch = hasSubmitted && result === null && !submissionError;
  const showFound = hasSubmitted && result !== null && result !== undefined && !submissionError;

  // Disable submit if actor is not ready or form is invalid
  const isSubmitDisabled = !isReady || checkStatus.isPending || !applicationId.trim() || !applicantEmail.trim();

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
                      disabled={!isReady || checkStatus.isPending}
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
                      disabled={!isReady || checkStatus.isPending}
                    />
                  </div>
                </div>

                {/* Show initializing message if actor is not ready */}
                {isInitializing && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                      Connecting to service...
                    </AlertDescription>
                  </Alert>
                )}

                {/* Show actor initialization error */}
                {actorInitError && !isInitializing && (
                  <Alert variant="destructive">
                    <WifiOff className="h-4 w-4" />
                    <AlertDescription>
                      Unable to connect to the service. Please refresh the page and try again.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className="flex-1"
                  >
                    {checkStatus.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : isInitializing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
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
                {showInitializing && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                      Connecting to service...
                    </AlertDescription>
                  </Alert>
                )}

                {showProcessing && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                      Processing your request...
                    </AlertDescription>
                  </Alert>
                )}

                {showConnectionError && (
                  <Alert variant="destructive">
                    <WifiOff className="h-4 w-4" />
                    <AlertDescription>
                      {submissionError}
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

                    {/* Always render attachment section - it will show "no document" message if needed */}
                    <PdfAttachmentSection
                      attachment={result.attachment}
                      pdfUrl={pdfUrl ?? undefined}
                      pdfUrlError={pdfUrlError ?? undefined}
                      onViewPDF={handleViewPDF}
                      onDownloadPDF={handleDownloadPDF}
                    />
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
