"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  MapPin,
  Flag,
  CheckCircle,
  AlertTriangle,
  Shield,
  Eye,
  FileText,
  Users,
  Phone,
  Mail,
  AlertCircle,
  Camera,
  Calendar,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface CommunityReport {
  id: string;
  zipCode: string;
  description: string;
  timestamp: string;
  imageUrl?: string;
  status: "pending" | "reviewed" | "resolved";
}

// Enhanced stats component for committee metrics
function CommitteeStatCard({
  icon: Icon,
  label,
  value,
  description,
  color = "blue",
}: {
  icon: any;
  label: string;
  value: string | number;
  description: string;
  color?: "blue" | "green" | "yellow" | "red";
}) {
  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      icon: "text-blue-600",
      border: "border-l-blue-500",
    },
    green: {
      bg: "bg-green-50",
      icon: "text-green-600",
      border: "border-l-green-500",
    },
    yellow: {
      bg: "bg-yellow-50",
      icon: "text-yellow-600",
      border: "border-l-yellow-500",
    },
    red: {
      bg: "bg-red-50",
      icon: "text-red-600",
      border: "border-l-red-500",
    },
  };

  const colors = colorClasses[color];

  return (
    <Card
      className={`transition-all hover:shadow-md border-l-4 ${colors.border}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 ${colors.bg} rounded-lg`}>
              <Icon className={`h-6 w-6 ${colors.icon}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced status badge component
function StatusBadge({ status }: { status: CommunityReport["status"] }) {
  const getStatusConfig = (status: CommunityReport["status"]) => {
    switch (status) {
      case "pending":
        return {
          icon: Clock,
          text: "Pending Review",
          variant: "secondary" as const,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
        };
      case "reviewed":
        return {
          icon: Eye,
          text: "Under Review",
          variant: "secondary" as const,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
        };
      case "resolved":
        return {
          icon: CheckCircle,
          text: "Resolved",
          variant: "default" as const,
          color: "text-green-600",
          bgColor: "bg-green-50",
        };
      default:
        return {
          icon: AlertTriangle,
          text: "Unknown",
          variant: "secondary" as const,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
        };
    }
  };

  const config = getStatusConfig(status);
  const StatusIcon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}
    >
      <StatusIcon className="h-3 w-3" />
      {config.text}
    </div>
  );
}

export default function Committee() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [currentReport, setCurrentReport] = useState<CommunityReport | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedImageReport, setSelectedImageReport] =
    useState<CommunityReport | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Check if there's a new report in the URL params
    const reportParam = searchParams.get("report");
    if (reportParam) {
      try {
        const reportData = JSON.parse(decodeURIComponent(reportParam));
        const newReport: CommunityReport = {
          id: `report_${Date.now()}`,
          zipCode: reportData.zipCode,
          description: reportData.description || "No description provided",
          timestamp: reportData.timestamp,
          imageUrl: reportData.imageUrl,
          status: "pending",
        };
        setCurrentReport(newReport);
      } catch (error) {
        console.error("Error parsing report data:", error);
      }
    }
  }, [searchParams]);

  const loadExistingReports = useCallback(async () => {
    try {
      // Fetch real community reports from the API
      const response = await fetch("/api/community-reports");

      if (response.ok) {
        const data = await response.json();

        // Convert API response to our local format
        const fetchedReports: CommunityReport[] = data.reports.map(
          (report: any) => ({
            id: report.id.toString(),
            zipCode: report.zip_code,
            description: report.description || "No description provided",
            timestamp: report.submitted_at,
            imageUrl: report.image_url,
            status: report.status as "pending" | "reviewed" | "resolved",
          })
        );

        // If there's a current report from URL params, merge it with fetched reports
        // Make sure not to duplicate it
        setReports((prevReports) => {
          const currentReportExists =
            currentReport &&
            fetchedReports.some((r) => r.id === currentReport.id);

          if (currentReport && !currentReportExists) {
            return [currentReport, ...fetchedReports];
          } else {
            return fetchedReports;
          }
        });
      } else {
        console.warn("Failed to fetch reports:", response.statusText);
        // Fallback: show currentReport if available, otherwise empty state
        if (currentReport) {
          setReports([currentReport]);
        } else {
          setReports([]);
        }
      }
    } catch (error) {
      console.warn("Error loading reports, using fallback data:", error);
      // Fallback: show currentReport if available, otherwise empty state
      if (currentReport) {
        setReports([currentReport]);
      } else {
        setReports([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentReport]);

  // Load existing reports when component mounts or currentReport changes
  useEffect(() => {
    loadExistingReports();
  }, [loadExistingReports]);

  // Handle viewing images from reports
  const handleViewImage = (report: CommunityReport) => {
    if (report.imageUrl) {
      setSelectedImageUrl(report.imageUrl);
      setSelectedImageReport(report);
      setImageModalOpen(true);
      setImageLoading(true);
      setImageError(false);
    }
  };

  // Handle closing the image modal
  const handleCloseImageModal = () => {
    setImageModalOpen(false);
    setSelectedImageUrl(null);
    setSelectedImageReport(null);
    setImageLoading(true);
    setImageError(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 p-6">
        {/* Header skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-[400px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>

        {/* Stats skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-6 w-[60px]" />
                    <Skeleton className="h-3 w-[120px]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-[200px]" />
                <Skeleton className="h-4 w-[300px]" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[80%]" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Calculate some stats
  const pendingReports = reports.filter((r) => r.status === "pending").length;
  const reviewedReports = reports.filter((r) => r.status === "reviewed").length;
  const resolvedReports = reports.filter((r) => r.status === "resolved").length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      {/* Enhanced Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-blue-100 rounded-full">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Community Safety Committee
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Working together to keep our neighborhoods safe and secure through
            collaborative monitoring and response
          </p>
        </div>
      </div>

      {/* Success Message for New Report */}
      {currentReport && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-900">
                  Report Submitted Successfully
                </h4>
                <p className="text-green-700 mt-1">
                  Your report has been forwarded to the community committee for
                  review. You'll receive updates as the committee investigates
                  this issue.
                </p>
              </div>

              <Card className="bg-white border-green-200">
                <CardContent className="p-4">
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span>
                        <strong>Zip Code:</strong> {currentReport.zipCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span>
                        <strong>Submitted:</strong>{" "}
                        {new Date(currentReport.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {currentReport.description && (
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>
                          <strong>Description:</strong>{" "}
                          {currentReport.description}
                        </span>
                      </div>
                    )}
                    {currentReport.imageUrl && (
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 text-green-600" />
                        <span>
                          <strong>Evidence:</strong> Image attached
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewImage(currentReport)}
                          className="ml-2 h-6"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Committee Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <CommitteeStatCard
          icon={Clock}
          label="Pending Review"
          value={pendingReports}
          description="Reports awaiting committee review"
          color="yellow"
        />
        <CommitteeStatCard
          icon={Eye}
          label="Under Review"
          value={reviewedReports}
          description="Currently being investigated"
          color="blue"
        />
        <CommitteeStatCard
          icon={CheckCircle}
          label="Resolved"
          value={resolvedReports}
          description="Successfully addressed issues"
          color="green"
        />
      </div>

      {/* Committee Features */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              24/7 Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">
                  Real-time report processing
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">
                  24-hour review guarantee
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">
                  Community-driven safety
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Coordinated Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600">
                  Professional investigation
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600">
                  Law enforcement coordination
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600">
                  Regular status updates
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Community Reports
          </CardTitle>
          <CardDescription>
            Track the status of reports submitted by community members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {reports.length > 0 ? (
              reports.map((report, index) => (
                <div key={report.id}>
                  <Card className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-4 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="font-mono">
                                #
                                {new Date(
                                  report.timestamp
                                ).toLocaleDateString()}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>Zip Code: {report.zipCode}</span>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {report.description}
                            </p>
                          </div>
                        </div>

                        <div className="ml-6">
                          {report.imageUrl && (
                            <Button
                              variant="outline"
                              onClick={() => handleViewImage(report)}
                              className="flex items-center gap-2"
                            >
                              <Camera className="h-4 w-4" />
                              View Image
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {index < reports.length - 1 && <div className="h-4" />}
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <Flag className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Reports Submitted Yet
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Community reports with images will appear here when members
                  submit them through their device dashboards.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact Information */}
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertTriangle className="h-5 w-5" />
            Emergency Contacts
          </CardTitle>
          <CardDescription className="text-red-700">
            For immediate emergencies, always call 911 first
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-red-100 border-red-300">
              <CardContent className="p-4 text-center">
                <Phone className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <p className="font-bold text-red-900 text-lg">911</p>
                <p className="text-xs text-red-700">Immediate emergencies</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-100 border-blue-300">
              <CardContent className="p-4 text-center">
                <Phone className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="font-bold text-blue-900 text-sm">
                  (555) 123-4567
                </p>
                <p className="text-xs text-blue-700">Non-emergency police</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-100 border-gray-300">
              <CardContent className="p-4 text-center">
                <Mail className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <p className="font-bold text-gray-900 text-xs">
                  committee@mailguard.com
                </p>
                <p className="text-xs text-gray-700">Committee inquiries</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Image Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Community Report Evidence
            </DialogTitle>
            <DialogDescription>
              {selectedImageReport && (
                <span className="text-base">
                  {selectedImageReport.zipCode} •{" "}
                  {new Date(selectedImageReport.timestamp).toLocaleString()}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Enhanced Image Display */}
            {selectedImageUrl && (
              <div className="relative bg-gray-50 rounded-lg p-6">
                {imageLoading && !imageError && (
                  <div className="flex flex-col items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                    <span className="text-gray-600">
                      Loading evidence image...
                    </span>
                  </div>
                )}

                {imageError && (
                  <div className="flex flex-col items-center justify-center text-gray-500 p-12">
                    <div className="bg-gray-100 rounded-full p-4 mb-4">
                      <AlertCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="font-medium">Image could not be loaded</p>
                    <p className="text-sm mt-2 opacity-75">
                      This may be due to access restrictions or the image being
                      moved
                    </p>
                  </div>
                )}

                <div className="flex justify-center">
                  <img
                    src={selectedImageUrl}
                    alt="Community report evidence"
                    className={`max-w-full max-h-[50vh] object-contain rounded-lg border shadow-sm ${
                      imageLoading || imageError ? "hidden" : ""
                    }`}
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageLoading(false);
                      setImageError(true);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Enhanced Report Details */}
            {selectedImageReport && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Report Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Location
                      </label>
                      <p className="text-gray-900">
                        {selectedImageReport.zipCode}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Submitted
                      </label>
                      <p className="text-gray-900">
                        {new Date(
                          selectedImageReport.timestamp
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">
                        {selectedImageReport.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleCloseImageModal}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
