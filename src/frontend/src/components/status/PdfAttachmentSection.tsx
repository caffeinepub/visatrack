import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Download, Eye } from 'lucide-react';

interface PdfAttachmentSectionProps {
  attachment?: {
    bytes: Uint8Array;
    filename: string;
    contentType: string;
  } | null;
  pdfUrl?: string;
  pdfUrlError?: string;
  onViewPDF: () => void;
  onDownloadPDF: () => void;
}

export default function PdfAttachmentSection({
  attachment,
  pdfUrl,
  pdfUrlError,
  onViewPDF,
  onDownloadPDF,
}: PdfAttachmentSectionProps) {
  // Check if we have valid attachment bytes
  const hasValidBytes = attachment && attachment.bytes && attachment.bytes.length > 0;
  
  // No attachment at all
  if (!hasValidBytes) {
    return (
      <div className="space-y-3 pt-4 border-t border-emerald-200/50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-emerald-900">Attached Document</h3>
        </div>
        <Alert className="border-emerald-200 bg-emerald-50/50">
          <AlertCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">
            No attached document available for this application.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Has attachment - show preview and actions
  return (
    <div className="space-y-3 pt-4 border-t border-emerald-200/50">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-emerald-900">Attached Document</h3>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onViewPDF}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-900"
          >
            <Eye className="h-4 w-4 mr-1" />
            View PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDownloadPDF}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-900"
          >
            <Download className="h-4 w-4 mr-1" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* PDF Preview or Error */}
      {pdfUrlError ? (
        <Alert variant="destructive" className="border-amber-300 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-700" />
          <AlertDescription className="text-amber-800">
            Unable to preview PDF: {pdfUrlError}. You can still view or download the document using the buttons above.
          </AlertDescription>
        </Alert>
      ) : pdfUrl ? (
        <div className="border border-emerald-200 rounded-lg overflow-hidden bg-white shadow-sm">
          <object
            data={pdfUrl}
            type="application/pdf"
            className="w-full h-[400px]"
            aria-label="PDF preview"
          >
            <div className="flex items-center justify-center h-[400px] bg-emerald-50/30">
              <Alert className="max-w-md border-emerald-200 bg-emerald-50/50">
                <AlertCircle className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-800">
                  Your browser cannot display the PDF inline. Please use the "View PDF" or "Download PDF" buttons above.
                </AlertDescription>
              </Alert>
            </div>
          </object>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[200px] border border-emerald-200 rounded-lg bg-emerald-50/30">
          <p className="text-sm text-emerald-700">Loading preview...</p>
        </div>
      )}

      <p className="text-xs text-emerald-700">
        <strong>Filename:</strong> {attachment.filename}
      </p>
    </div>
  );
}
