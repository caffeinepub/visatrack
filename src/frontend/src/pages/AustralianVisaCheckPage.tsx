import { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useCheckApplicationStatus } from '../hooks/useQueries';
import { useBlobObjectUrl } from '../hooks/useBlobObjectUrl';
import PdfAttachmentSection from '../components/status/PdfAttachmentSection';
import type { ApplicationStatus } from '../backend';
import { normalizeApplicationKey } from '../utils/applicationStatusNormalization';
import { downloadRawBytes } from '../utils/pdfAttachment';
import { getApplicationStatusResult } from '../utils/getApplicationStatusResult';
import { toast } from 'sonner';
import { parseStatusCheckError, type StatusCheckError } from '../utils/statusCheckError';
import { computeBytesSignature } from '../utils/bytesSignature';

export default function AustralianVisaCheckPage() {
  const [applicationId, setApplicationId] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [searchParams, setSearchParams] = useState<{ applicationId: string; applicantEmail: string } | null>(null);
  const [submissionError, setSubmissionError] = useState<StatusCheckError | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [approvalDate, setApprovalDate] = useState<string>('');

  // Use the query hook with search params
  const checkStatus = useCheckApplicationStatus(
    searchParams?.applicationId || '',
    searchParams?.applicantEmail || '',
    !!searchParams
  );

  // Get the result from the query
  const result = checkStatus.data;

  // Normalize result before using it
  const normalizedResult = result !== undefined ? getApplicationStatusResult(result) : undefined;

  // Only create Blob URL when we have valid attachment data (use normalized result)
  const hasValidAttachment = normalizedResult?.attachment && normalizedResult.attachment.bytes && normalizedResult.attachment.bytes.length > 0;
  const { url: pdfUrl, error: pdfUrlError, signature: pdfSignature } = useBlobObjectUrl(
    hasValidAttachment ? normalizedResult.attachment?.bytes : undefined,
    hasValidAttachment ? (normalizedResult.attachment?.contentType || 'application/pdf') : undefined
  );

  // Developer diagnostics for attachment presence
  useEffect(() => {
    if (normalizedResult && normalizedResult !== null) {
      const attachmentSig = normalizedResult.attachment?.bytes 
        ? computeBytesSignature(normalizedResult.attachment.bytes)
        : 'none';
      
      console.log('[VisaCheck] Result attachment diagnostics:', {
        hasAttachment: !!normalizedResult.attachment,
        contentType: normalizedResult.attachment?.contentType,
        bytesLength: normalizedResult.attachment?.bytes ? normalizedResult.attachment.bytes.length : 0,
        filename: normalizedResult.attachment?.filename,
        pdfUrl: pdfUrl ? 'created' : 'null',
        pdfUrlError,
        pdfSignature,
        attachmentSignature: attachmentSig,
        status: normalizedResult.status,
        isApproved: normalizedResult.status.toLowerCase().includes('approved'),
      });
    }
  }, [normalizedResult, pdfUrl, pdfUrlError, pdfSignature]);

  // Update approval date when result changes and status indicates approval
  useEffect(() => {
    if (normalizedResult && normalizedResult.status.toLowerCase().includes('approved')) {
      const newApprovalDate = new Date().toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      setApprovalDate(newApprovalDate);
      console.log('[VisaCheck] Approval date set:', newApprovalDate);
    }
  }, [normalizedResult]);

  // Handle query errors
  useEffect(() => {
    if (checkStatus.isError && checkStatus.error) {
      console.error('[VisaCheck] Status check error:', checkStatus.error);
      const parsedError = parseStatusCheckError(checkStatus.error);
      setSubmissionError(parsedError);
    }
  }, [checkStatus.isError, checkStatus.error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!applicationId.trim() || !applicantEmail.trim()) {
      return;
    }

    setSubmissionError(null);
    setApprovalDate('');

    const normalized = normalizeApplicationKey(applicationId, applicantEmail);

    console.log('[VisaCheck] Submitting status check:', normalized);

    // Trigger the query by setting search params
    setSearchParams({
      applicationId: normalized.applicationId,
      applicantEmail: normalized.applicantEmail,
    });
  };

  // Log PDF signature when result is available
  useEffect(() => {
    if (result?.attachment?.bytes) {
      const sig = computeBytesSignature(result.attachment.bytes);
      console.log('[VisaCheck] Retrieved PDF signature:', {
        applicationId: result.applicationId,
        signature: sig,
        bytesLength: result.attachment.bytes.length,
        filename: result.attachment.filename,
        status: result.status,
      });
    }
  }, [result]);

  // Handler for viewing PDF in new tab - now attempts even with validation errors
  const handleViewPDF = () => {
    if (!normalizedResult?.attachment) {
      toast.error('No attachment available');
      return;
    }

    // Warn user if validation failed
    if (pdfUrlError) {
      toast.warning('The file may be corrupted or incomplete. Attempting to open anyway...', {
        duration: 4000,
      });
    }

    try {
      // Use non-strict opening (bypass validation)
      // Create new Uint8Array to ensure TypeScript compatibility with Blob constructor
      const blob = new Blob([new Uint8Array(normalizedResult.attachment.bytes)], { 
        type: normalizedResult.attachment.contentType || 'application/pdf' 
      });
      const url = URL.createObjectURL(blob);
      
      console.log('[VisaCheck] Opening PDF in new tab (non-strict)', {
        filename: normalizedResult.attachment.filename,
        bytesLength: normalizedResult.attachment.bytes.length,
        signature: computeBytesSignature(normalizedResult.attachment.bytes),
        hasValidationError: !!pdfUrlError,
      });

      window.open(url, '_blank');
      
      if (!pdfUrlError) {
        toast.success('PDF opened in new tab');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to open PDF';
      console.error('[VisaCheck] View PDF error:', errorMessage);
      toast.error(`Failed to open PDF: ${errorMessage}`);
    }
  };

  // Handler for downloading PDF - now attempts even with validation errors
  const handleDownloadPDF = () => {
    if (!normalizedResult?.attachment) {
      toast.error('No attachment available');
      return;
    }

    // Warn user if validation failed
    if (pdfUrlError) {
      toast.warning('The file may be corrupted or incomplete. Attempting to download anyway...', {
        duration: 4000,
      });
    }

    try {
      // Use non-strict download (bypass validation)
      // Create new Uint8Array to ensure TypeScript compatibility with Blob constructor
      const blob = new Blob([new Uint8Array(normalizedResult.attachment.bytes)], { 
        type: normalizedResult.attachment.contentType || 'application/pdf' 
      });
      const url = URL.createObjectURL(blob);

      let safeFilename = normalizedResult.attachment.filename || 'attachment.pdf';
      if (!safeFilename.toLowerCase().endsWith('.pdf')) {
        safeFilename = `${safeFilename}.pdf`;
      }

      console.log('[VisaCheck] Downloading PDF (non-strict)', {
        filename: safeFilename,
        bytesLength: normalizedResult.attachment.bytes.length,
        signature: computeBytesSignature(normalizedResult.attachment.bytes),
        hasValidationError: !!pdfUrlError,
      });

      const a = document.createElement('a');
      a.href = url;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 10000);

      if (!pdfUrlError) {
        toast.success('PDF download started');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download PDF';
      console.error('[VisaCheck] Download PDF error:', errorMessage);
      toast.error(`Failed to download PDF: ${errorMessage}`);
    }
  };

  // Handler for downloading raw bytes without validation
  const handleDownloadAnyway = () => {
    if (!normalizedResult?.attachment) {
      toast.error('No attachment available');
      return;
    }

    try {
      downloadRawBytes(
        normalizedResult.attachment.bytes,
        normalizedResult.attachment.filename,
        normalizedResult.attachment.contentType || 'application/pdf'
      );
      toast.success('File download started (no validation)');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download file';
      console.error('[VisaCheck] Download anyway error:', errorMessage);
      toast.error(errorMessage);
    }
  };

  const isLoading = checkStatus.isPending || checkStatus.isFetching;
  const showResult = searchParams && !isLoading && normalizedResult !== undefined;
  const isApproved = normalizedResult?.status.toLowerCase().includes('approved');

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50/30">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-900 mb-3">
              Australian Visa Status Check
            </h1>
            <p className="text-blue-700 text-lg">
              Enter your application details to check your visa status
            </p>
          </div>

          {/* Search Form */}
          <Card className="shadow-lg border-blue-200 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-transparent">
              <CardTitle className="text-blue-900">Check Application Status</CardTitle>
              <CardDescription className="text-blue-700">
                Please provide your application ID and email address
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="applicationId" className="text-blue-900 font-medium">
                    Application ID
                  </Label>
                  <Input
                    id="applicationId"
                    type="text"
                    placeholder="e.g., 4906670766"
                    value={applicationId}
                    onChange={(e) => setApplicationId(e.target.value)}
                    required
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicantEmail" className="text-blue-900 font-medium">
                    Applicant Email
                  </Label>
                  <Input
                    id="applicantEmail"
                    type="email"
                    placeholder="e.g., your.email@example.com"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    required
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !applicationId.trim() || !applicantEmail.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-6 text-lg shadow-md hover:shadow-lg transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Checking Status...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-5 w-5" />
                      Check Status
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Error Display */}
          {submissionError && (
            <Card className="mt-6 shadow-lg border-red-300 bg-red-50/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Alert variant="destructive" className="border-red-400 bg-red-100">
                  <AlertCircle className="h-5 w-5 text-red-700" />
                  <AlertDescription className="text-red-900">
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-base mb-1">{submissionError.category} Error</p>
                        <p className="text-sm">{submissionError.message}</p>
                      </div>

                      {submissionError.technicalDetails && (
                        <div className="border-t border-red-300 pt-3">
                          <button
                            type="button"
                            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                            className="flex items-center gap-2 text-sm font-medium text-red-800 hover:text-red-900 transition-colors"
                          >
                            {showTechnicalDetails ? (
                              <>
                                <ChevronUp className="h-4 w-4" />
                                Hide Technical Details
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4" />
                                Show Technical Details
                              </>
                            )}
                          </button>

                          {showTechnicalDetails && (
                            <div className="mt-2 p-3 bg-red-200/50 rounded border border-red-300">
                              <pre className="text-xs text-red-900 whitespace-pre-wrap break-words font-mono">
                                {submissionError.technicalDetails}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Result Display */}
          {showResult && normalizedResult && (
            <Card className="mt-6 shadow-lg border-blue-200 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-transparent">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-blue-900 text-2xl">Application Status</CardTitle>
                    <CardDescription className="text-blue-700 mt-1">
                      Application ID: {normalizedResult.applicationId}
                    </CardDescription>
                  </div>
                  {isApproved && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-300 rounded-full">
                      <CheckCircle2 className="h-5 w-5 text-green-700" />
                      <span className="text-green-800 font-semibold">Approved</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-blue-700 mb-1">Applicant Name</p>
                    <p className="text-base text-blue-900">{normalizedResult.applicantName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700 mb-1">Visa Type</p>
                    <p className="text-base text-blue-900">{normalizedResult.visaType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700 mb-1">Status</p>
                    <p className="text-base text-blue-900 font-semibold">{normalizedResult.status}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700 mb-1">Last Updated</p>
                    <p className="text-base text-blue-900">
                      {new Date(Number(normalizedResult.lastUpdated) / 1_000_000).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {normalizedResult.comments && (
                  <div className="pt-4 border-t border-blue-200">
                    <p className="text-sm font-medium text-blue-700 mb-2">Comments</p>
                    <p className="text-base text-blue-900">{normalizedResult.comments}</p>
                  </div>
                )}

                {/* Approval Section with Today's Date */}
                {isApproved && approvalDate && (
                  <div className="pt-4 border-t border-blue-200">
                    <Alert className="border-green-300 bg-green-50">
                      <CheckCircle2 className="h-5 w-5 text-green-700" />
                      <AlertDescription className="text-green-900">
                        <p className="font-semibold text-base mb-1">Visa Approved</p>
                        <p className="text-sm">
                          Your visa application has been approved as of <span className="font-semibold">{approvalDate}</span>.
                        </p>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* PDF Attachment Section */}
                {normalizedResult.attachment && (
                  <PdfAttachmentSection
                    attachment={normalizedResult.attachment}
                    pdfUrl={pdfUrl || undefined}
                    pdfUrlError={pdfUrlError || undefined}
                    pdfSignature={pdfSignature}
                    onViewPDF={handleViewPDF}
                    onDownloadPDF={handleDownloadPDF}
                    onDownloadAnyway={handleDownloadAnyway}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* No Result Found */}
          {showResult && !normalizedResult && !submissionError && (
            <Card className="mt-6 shadow-lg border-amber-300 bg-amber-50/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Alert className="border-amber-400 bg-amber-100">
                  <AlertCircle className="h-5 w-5 text-amber-700" />
                  <AlertDescription className="text-amber-900">
                    <p className="font-semibold text-base mb-1">No Application Found</p>
                    <p className="text-sm">
                      We couldn't find an application with the provided details. Please check your Application ID and email address and try again.
                    </p>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
