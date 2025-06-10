"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import {
  Clock,
  MapPin,
  Flag,
  CheckCircle,
  AlertTriangle,
  Shield,
  Eye,
  FileText,
  ArrowLeft,
  Home,
  Mail,
  Users,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

interface CommunityReport {
  id: string;
  clerk_id: string;
  zip_code: string;
  description: string;
  image_url?: string;
  status: "pending" | "reviewed" | "resolved";
  submitted_at: string;
  reviewed_at?: string;
  resolved_at?: string;
  reviewer_notes?: string;
  is_own_report?: boolean;
}

interface CommunityReportsResponse {
  reports: CommunityReport[];
  statistics: {
    total_reports: number;
    pending_count: number;
    reviewed_count: number;
    resolved_count: number;
  };
}

export default function CommitteePage() {
  const { user } = useUser();
  const router = useRouter();
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [statistics, setStatistics] = useState({
    total_reports: 0,
    pending_count: 0,
    reviewed_count: 0,
    resolved_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedImageReport, setSelectedImageReport] =
    useState<CommunityReport | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "pending" | "reviewed" | "resolved"
  >("all");

  const loadCommunityReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        limit: "50",
      });

      if (filter !== "all") {
        params.append("status", filter);
      }

      const response = await fetch(
        `/api/community-reports?${params.toString()}`
      );

      if (response.ok) {
        const data: CommunityReportsResponse = await response.json();
        setReports(data.reports || []);
        setStatistics(
          data.statistics || {
            total_reports: 0,
            pending_count: 0,
            reviewed_count: 0,
            resolved_count: 0,
          }
        );
      } else {
        console.warn("Failed to fetch reports:", response.statusText);
        setReports([]);
      }
    } catch (error) {
      console.error("Error loading community reports:", error);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadCommunityReports();
  }, [loadCommunityReports]);

  const getStatusIcon = (status: CommunityReport["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "reviewed":
        return <Eye className="h-4 w-4 text-blue-600" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: CommunityReport["status"]) => {
    const baseClasses =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case "pending":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "reviewed":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case "resolved":
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const handleViewImage = (report: CommunityReport) => {
    if (report.image_url) {
      setSelectedImageUrl(report.image_url);
      setSelectedImageReport(report);
      setImageModalOpen(true);
      setImageLoading(true);
      setImageError(false);
    }
  };

  const handleCloseImageModal = () => {
    setImageModalOpen(false);
    setSelectedImageUrl(null);
    setSelectedImageReport(null);
    setImageLoading(true);
    setImageError(false);
  };

  const goBackToDashboard = () => {
    router.push("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-sm">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                  Mail Guard
                </h1>
              </Link>
              <Button variant="outline" onClick={goBackToDashboard}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">
                Loading committee dashboard...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-sm">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                Mail Guard
              </h1>
            </Link>
            <Button variant="outline" onClick={goBackToDashboard}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="flex items-center">
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Committee
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Community Safety Committee
                  </h1>
                </div>
                <p className="text-gray-600">
                  Community reports and safety coordination dashboard
                </p>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {statistics.total_reports}
                    </p>
                    <p className="text-sm text-gray-600">Total Reports</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {statistics.pending_count}
                    </p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {statistics.reviewed_count}
                    </p>
                    <p className="text-sm text-gray-600">Reviewed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {statistics.resolved_count}
                    </p>
                    <p className="text-sm text-gray-600">Resolved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Reports</CardTitle>
              <CardDescription>
                Filter community reports by status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "all", label: "All Reports", icon: FileText },
                  { key: "pending", label: "Pending", icon: Clock },
                  { key: "reviewed", label: "Reviewed", icon: Eye },
                  { key: "resolved", label: "Resolved", icon: CheckCircle },
                ].map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    variant={filter === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(key as typeof filter)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <Card>
            <CardHeader>
              <CardTitle>Community Reports</CardTitle>
              <CardDescription>
                {filter === "all"
                  ? "View all community reports"
                  : `Showing ${filter} reports`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.length > 0 ? (
                  reports.map((report, index) => (
                    <div key={report.id}>
                      <div className="flex items-start justify-between p-4 hover:bg-gray-50 rounded-lg border">
                        <div className="flex items-start gap-4">
                          {getStatusIcon(report.status)}
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900">
                                Report #{report.id}
                              </span>
                              <span className={getStatusBadge(report.status)}>
                                {report.status}
                              </span>
                              {report.is_own_report && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Your Report
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Zip: {report.zip_code}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(
                                  report.submitted_at
                                ).toLocaleDateString()}
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 max-w-2xl">
                              {report.description || "No description provided"}
                            </p>
                            {report.reviewer_notes && (
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <p className="text-sm font-medium text-blue-900">
                                  Committee Notes:
                                </p>
                                <p className="text-sm text-blue-700 mt-1">
                                  {report.reviewer_notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {report.image_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewImage(report)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Image
                            </Button>
                          )}
                        </div>
                      </div>
                      {index < reports.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Flag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No reports found
                    </h3>
                    <p className="text-gray-600">
                      {filter === "all"
                        ? "No community reports have been submitted yet"
                        : `No ${filter} reports at this time`}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Committee Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <CardTitle>Community Safety Information</CardTitle>
              </div>
              <CardDescription>
                Working together to keep our neighborhoods safe and secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Eye className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                  <h4 className="font-semibold text-blue-900 mb-2">
                    24/7 Monitoring
                  </h4>
                  <p className="text-sm text-blue-700">
                    Reports reviewed within 24 hours
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 mx-auto mb-3 text-green-600" />
                  <h4 className="font-semibold text-green-900 mb-2">
                    Action Taken
                  </h4>
                  <p className="text-sm text-green-700">
                    Coordinated response to incidents
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact Information</CardTitle>
              <CardDescription>
                For immediate emergencies, always call 911 first
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-lg font-bold text-red-900">Emergency: 911</p>
                <p className="text-sm text-red-700">
                  For immediate danger or crimes in progress
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-lg font-bold text-blue-900">
                  Non-Emergency Police: (555) 123-4567
                </p>
                <p className="text-sm text-blue-700">
                  For non-urgent police matters
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-lg font-bold text-gray-900">
                  Community Committee: committee@mailguard.com
                </p>
                <p className="text-sm text-gray-700">
                  For questions about your report
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Image Viewing Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Community Report Evidence</DialogTitle>
            <DialogDescription>
              {selectedImageReport && (
                <>
                  Zip code {selectedImageReport.zip_code} -{" "}
                  {new Date(selectedImageReport.submitted_at).toLocaleString()}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Display */}
            {selectedImageUrl && (
              <div className="flex justify-center">
                {imageLoading && !imageError && (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <span className="ml-2 text-gray-600">Loading image...</span>
                  </div>
                )}

                {imageError && (
                  <div className="text-center text-gray-500 p-8">
                    <p>Image could not be loaded</p>
                    <p className="text-xs mt-2">
                      This may be due to access restrictions or the image being
                      moved.
                    </p>
                  </div>
                )}

                <img
                  src={selectedImageUrl}
                  alt="Community report evidence"
                  className={`max-w-full max-h-[60vh] object-contain rounded-lg border ${
                    imageLoading || imageError ? "hidden" : ""
                  }`}
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageLoading(false);
                    setImageError(true);
                  }}
                />
              </div>
            )}

            {/* Report Details */}
            {selectedImageReport && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold text-gray-900">Report Details</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <p className="text-gray-600 mt-1">
                      Zip Code: {selectedImageReport.zip_code}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Description:
                    </span>
                    <p className="text-gray-600 mt-1">
                      {selectedImageReport.description ||
                        "No description provided"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span
                      className={`ml-2 ${getStatusBadge(
                        selectedImageReport.status
                      )}`}
                    >
                      {selectedImageReport.status}
                    </span>
                  </div>
                  {selectedImageReport.reviewer_notes && (
                    <div>
                      <span className="font-medium text-gray-700">
                        Committee Notes:
                      </span>
                      <p className="text-gray-600 mt-1">
                        {selectedImageReport.reviewer_notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t">
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
