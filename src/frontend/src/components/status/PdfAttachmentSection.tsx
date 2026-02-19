import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Download, Eye, Loader2, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PdfAttachmentSectionProps {
  attachment?: {
    bytes: Uint8Array;
    filename: string;
    contentType: string;
  } | null;
  pdfUrl?: string;
  pdfUrlError?: string;
  pdfSignature?: string;
  onViewPDF: () => void;
  onDownloadPDF: () => void;
  onDownloadAnyway?: () => void;
}

export default function PdfAttachmentSection({
  attachment,
  pdfUrl,
  pdfUrlError,
  pdfSignature,
  onViewPDF,
  onDownloadPDF,
  onDownloadAnyway,
}: PdfAttachmentSectionProps) {
  const [previewLoadError, setPreviewLoadError] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);

  // DIAGNOSTIC: Log component mount
  useEffect(() => {
    console.log('🔍 [PdfAttachmentSection] COMPONENT MOUNTED');
  }, []);

  // DIAGNOSTIC: Log attachment and URL state for debugging
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`🔍 [PdfAttachmentSection] ${timestamp} State update:`, {
      hasAttachment: !!attachment,
      attachmentType: attachment ? typeof attachment : 'undefined',
      bytesType: attachment?.bytes ? (attachment.bytes instanceof Uint8Array ? 'Uint8Array' : Array.isArray(attachment.bytes) ? 'Array' : typeof attachment.bytes) : 'undefined',
      bytesLength: attachment?.bytes?.length || 0,
      filename: attachment?.filename,
      contentType: attachment?.contentType,
      pdfUrl: pdfUrl ? `present (${pdfUrl.substring(0, 50)}...)` : 'null',
      pdfUrlError,
      pdfSignature,
      previewLoadError,
      isPreviewLoading,
    });

    // DIAGNOSTIC: Log first and last bytes if available
    if (attachment?.bytes && attachment.bytes.length > 0) {
      const bytes = attachment.bytes instanceof Uint8Array ? attachment.bytes : new Uint8Array(attachment.bytes);
      console.log(`🔍 [PdfAttachmentSection] ${timestamp} PDF Bytes Analysis:`, {
        firstTenBytes: Array.from(bytes.slice(0, 10)),
        lastTenBytes: Array.from(bytes.slice(-10)),
        headerString: String.fromCharCode(...Array.from(bytes.slice(0, 5))),
        hasPDFHeader: bytes[0] === 37 && bytes[1] === 80 && bytes[2] === 68 && bytes[3] === 70 && bytes[4] === 45,
      });
    }
  }, [attachment, pdfUrl, pdfUrlError, pdfSignature, previewLoadError, isPreviewLoading]);

  // DIAGNOSTIC: Reset preview state when pdfSignature changes
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`🔍 [PdfAttachmentSection] ${timestamp} pdfSignature changed, resetting preview state:`, {
      newSignature: pdfSignature,
      previousLoadError: previewLoadError,
      previousLoading: isPreviewLoading,
    });
    setPreviewLoadError(false);
    setIsPreviewLoading(true);
  }, [pdfSignature]);

  if (!attachment) {
    console.log('🔍 [PdfAttachmentSection] No attachment provided, rendering nothing');
    return null;
  }

  const hasValidationError = !!pdfUrlError;
  const canShowPreview = pdfUrl && !hasValidationError;

  console.log('🔍 [PdfAttachmentSection] Render decision:', {
    hasValidationError,
    canShowPreview,
    willRenderIframe: canShowPreview && !previewLoadError,
  });

  const handleIframeLoad = () => {
    const timestamp = new Date().toISOString();
    console.log(`✅ [PdfAttachmentSection] ${timestamp} Iframe loaded successfully:`, {
      signature: pdfSignature,
      url: pdfUrl?.substring(0, 50),
    });
    setIsPreviewLoading(false);
    setPreviewLoadError(false);
  };

  const handleIframeError = (e: any) => {
    const timestamp = new Date().toISOString();
    console.error(`❌ [PdfAttachmentSection] ${timestamp} Iframe failed to load:`, {
      signature: pdfSignature,
      url: pdfUrl?.substring(0, 50),
      error: e,
      errorType: e?.type,
      errorMessage: e?.message,
    });
    setIsPreviewLoading(false);
    setPreviewLoadError(true);
  };

  const handleViewClick = () => {
    const timestamp = new Date().toISOString();
    console.log(`🔍 [PdfAttachmentSection] ${timestamp} View button clicked:`, {
      hasAttachment: !!attachment,
      bytesLength: attachment?.bytes?.length,
      filename: attachment?.filename,
    });
    onViewPDF();
  };

  const handleDownloadClick = () => {
    const timestamp = new Date().toISOString();
    console.log(`🔍 [PdfAttachmentSection] ${timestamp} Download button clicked:`, {
      hasAttachment: !!attachment,
      bytesLength: attachment?.bytes?.length,
      filename: attachment?.filename,
    });
    onDownloadPDF();
  };

  return (
    <div className="pt-4 border-t border-blue-200 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700 mb-1">Attachment</p>
          <p className="text-sm text-blue-600">{attachment.filename}</p>
          <p className="text-xs text-blue-500 mt-1">
            Size: {attachment.bytes.length.toLocaleString()} bytes
            {pdfSignature && pdfSignature !== 'empty' && (
              <span className="ml-2">• Signature: {pdfSignature}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleViewClick}
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button
            onClick={handleDownloadClick}
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Validation Error Alert - Preview blocked but actions available */}
      {hasValidationError && (
        <Alert className="border-amber-400 bg-amber-50">
          <AlertTriangle className="h-5 w-5 text-amber-700" />
          <AlertDescription className="text-amber-900">
            <p className="font-semibold text-sm mb-1">Preview Not Available</p>
            <p className="text-sm mb-2">
              {pdfUrlError}
            </p>
            <p className="text-sm">
              The file may be corrupted or incomplete. You can still try to view or download it using the buttons above, but the action may fail.
            </p>
            {onDownloadAnyway && (
              <Button
                onClick={onDownloadAnyway}
                variant="outline"
                size="sm"
                className="mt-3 border-amber-400 text-amber-800 hover:bg-amber-100"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Raw File Anyway
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* PDF Preview - only shown when validation passes */}
      {canShowPreview && (
        <div className="relative w-full bg-gray-50 rounded-lg border border-blue-200 overflow-hidden">
          {isPreviewLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-blue-700">Loading preview...</p>
              </div>
            </div>
          )}

          {previewLoadError ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900 mb-1">Preview Failed to Load</p>
              <p className="text-sm text-gray-600 mb-4">
                The PDF preview could not be displayed. You can still download the file using the button above.
              </p>
            </div>
          ) : (
            <iframe
              key={pdfSignature || 'pdf-preview'}
              src={pdfUrl}
              className="w-full h-[600px] border-0"
              title="PDF Preview"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          )}
        </div>
      )}
    </div>
  );
}
