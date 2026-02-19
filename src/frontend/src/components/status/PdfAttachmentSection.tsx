import React, { useEffect, useState } from 'react';
import { Download, FileText, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { useBlobObjectUrl } from '../../hooks/useBlobObjectUrl';
import { downloadPdf, isPdfValid } from '../../utils/pdfAttachment';

interface PdfAttachmentSectionProps {
  filename: string;
  bytes: Uint8Array;
}

/**
 * Dedicated component for displaying PDF attachment section with comprehensive
 * diagnostic logging and enhanced error handling
 */
export function PdfAttachmentSection({ filename, bytes }: PdfAttachmentSectionProps) {
  const [iframeError, setIframeError] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const objectUrl = useBlobObjectUrl(bytes, 'application/pdf');

  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [PdfAttachmentSection] Component mounted/updated`);
    console.log(`[${timestamp}] [PdfAttachmentSection] Filename: ${filename}`);
    console.log(`[${timestamp}] [PdfAttachmentSection] Bytes length: ${bytes?.length || 0}`);
    console.log(`[${timestamp}] [PdfAttachmentSection] Object URL: ${objectUrl || 'null'}`);

    // Validate PDF structure
    if (bytes && bytes.length > 0) {
      const isValid = isPdfValid(bytes);
      if (!isValid) {
        const errorMsg = 'The PDF file appears to be corrupted or incomplete. Please try downloading it instead.';
        console.error(`[${timestamp}] [PdfAttachmentSection] ${errorMsg}`);
        setValidationError(errorMsg);
      } else {
        setValidationError(null);
      }
    }
  }, [filename, bytes, objectUrl]);

  const handleDownload = () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [PdfAttachmentSection] Download button clicked`);
    
    try {
      downloadPdf(bytes, filename);
      console.log(`[${timestamp}] [PdfAttachmentSection] Download initiated successfully`);
    } catch (error) {
      console.error(`[${timestamp}] [PdfAttachmentSection] Download error:`, error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handleIframeLoad = () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [PdfAttachmentSection] Iframe loaded successfully`);
    setIframeError(false);
  };

  const handleIframeError = () => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [PdfAttachmentSection] Iframe failed to load PDF`);
    setIframeError(true);
  };

  // Show error if validation failed or no object URL
  const showError = validationError || !objectUrl || iframeError;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <span className="font-medium">Attached Document</span>
        </div>
        <Button
          onClick={handleDownload}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {showError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {validationError || 
             'Unable to display the PDF in your browser. Please use the download button above to view the document.'}
          </AlertDescription>
        </Alert>
      )}

      {!validationError && objectUrl && (
        <div className="border rounded-lg overflow-hidden bg-muted/30">
          <iframe
            src={objectUrl}
            className="w-full h-[600px]"
            title={filename}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </div>
      )}

      {showError && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            PDF preview unavailable. Please download the file to view it.
          </p>
        </div>
      )}
    </div>
  );
}
