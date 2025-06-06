import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
  Mail,
  Shield,
  Bell,
  ArrowRight,
  Check,
  Info,
  CreditCard,
  HelpCircle,
  Star,
  Building,
  Home,
  School,
  Briefcase,
  Package,
  Camera,
  Users,
  Clock,
  Battery,
  BellRing,
  Wifi,
  Settings,
  Server,
  ArrowLeft,
  AlertTriangle,
  DollarSign,
  ThermometerSnowflake,
  Zap,
  CheckCircle,
  Lock,
  Percent,
  UserPlus,
  BarChart,
  Snowflake,
  Monitor,
  MapPin,
  GraduationCap,
  UtensilsCrossed,
  Timer,
  TrendingUp,
  Eye,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DeliveryHubPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <Link className="flex items-center" href="/">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-sm">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">
                Mail Guard
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors relative group"
              href="/"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
            </Link>
            <Link
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors relative"
              href="/delivery-hub"
            >
              Delivery Hub
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600"></span>
            </Link>

            {/* Authentication-based navigation */}
            <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-200">
              <SignedOut>
                <Link
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  href="/sign-in"
                >
                  Sign In
                </Link>
                <Link href="/sign-up">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium shadow-sm"
                  >
                    Get Started
                  </Button>
                </Link>
              </SignedOut>

              <SignedIn>
                <Link
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  href="/dashboard"
                >
                  Dashboard
                </Link>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                    },
                  }}
                />
              </SignedIn>
            </div>
          </nav>

          {/* Mobile menu */}
          <div className="md:hidden">
            <SignedOut>
              <Link href="/sign-up">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm"
                >
                  Sign Up
                </Button>
              </Link>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center space-x-3">
                <Link
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                  href="/dashboard"
                >
                  Dashboard
                </Link>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                    },
                  }}
                />
              </div>
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section - Campus Focus */}
        <section className="w-full py-16 md:py-24 lg:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50"></div>
          <div className="container mx-auto px-4 md:px-6 relative">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="flex flex-col justify-center space-y-8 text-center lg:text-left">
                <div className="space-y-4">
                  <Badge variant="outline" className="w-fit mx-auto lg:mx-0">
                    🎓 California Campus Solutions
                  </Badge>
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Campus Delivery Hub
                  </h1>
                  <p className="mx-auto lg:mx-0 max-w-[600px] text-gray-600 text-lg md:text-xl leading-relaxed">
                    Secure 24/7 self-service parcel and meal delivery stations
                    designed specifically for California college campuses. End
                    package theft and missed deliveries with smart locker
                    technology.
                  </p>
                </div>

                <div className="flex items-center space-x-6 justify-center lg:justify-start text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Timer className="h-4 w-4 text-green-600" />
                    <span>8 Hour Free Storage</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Snowflake className="h-4 w-4 text-blue-600" />
                    <span>Refrigerated Meal Lockers</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur-2xl opacity-20 scale-105"></div>
                  <img
                    alt="Campus Delivery Hub"
                    className="relative w-full max-w-lg rounded-2xl shadow-2xl object-cover border border-gray-200"
                    src="case.png"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Service Overview */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">
                Campus-Focused Solutions
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-4">
                Designed for California Campuses
              </h2>
              <p className="mx-auto text-gray-600 text-lg md:text-xl max-w-3xl leading-relaxed">
                Address package theft, missed deliveries, and food security
                concerns with our comprehensive campus delivery solution
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="group">
                <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                      <Timer className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Free 8-Hour Storage
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      All deliveries (packages or meals) can be retrieved at no
                      cost within 8 hours, perfect for student class schedules.
                    </p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                      <Snowflake className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Refrigerated Meal Lockers
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Separate refrigerated compartments for DoorDash, Uber
                      Eats, and other meal deliveries to maintain food quality.
                    </p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                      <MapPin className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Address-of-Record Service
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Students can use their Hub locker number as a permanent
                      mailing address for seamless package delivery.
                    </p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                      <Monitor className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Campus Alert Screens
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      32″ LCD displays show campus alerts, vendor ads, and
                      important announcements for the student community.
                    </p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-red-100 rounded-xl group-hover:bg-red-200 transition-colors">
                      <Eye className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      24/7 Security Monitoring
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Outdoor cameras and interior door sensors provide complete
                      security with instant photo notifications.
                    </p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition-colors">
                      <DollarSign className="h-8 w-8 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Low-Cost Extended Storage
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Nominal fees apply after free periods, with size-based
                      pricing and reasonable caps for extended storage.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Campus Partnerships */}
        <section className="w-full py-16 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                🤝 Strategic Partnerships
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-4">
                Campus & Delivery Partnerships
              </h2>
              <p className="mx-auto text-gray-600 text-lg md:text-xl max-w-3xl leading-relaxed">
                Zero upfront cost installation with revenue sharing and seamless
                integration with existing campus systems
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <div className="group">
                <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                      <GraduationCap className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      College Campuses
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Primary focus on California universities with high student
                      populations and package theft concerns.
                    </p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                      <Package className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Major Couriers
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      USPS, UPS, FedEx, and Amazon Logistics partnerships with
                      pre-approved QR/NFC access for deliveries.
                    </p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                      <UtensilsCrossed className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Food Delivery
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      DoorDash, Uber Eats, Grubhub partnerships with special
                      refrigerated "Food Locker" agreements.
                    </p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                      <Settings className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Campus Apps
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Integration with existing campus housing portals and
                      student service dashboards for seamless experience.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Structure */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">
                💰 Transparent Pricing
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-4">
                Student-Friendly Pricing Structure
              </h2>
              <p className="mx-auto text-gray-600 text-lg md:text-xl max-w-3xl leading-relaxed">
                Affordable rates designed for student budgets with free storage
                periods and reasonable extended fees
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-center">
                    Storage Fees & Time Tiers
                  </CardTitle>
                  <CardDescription className="text-center">
                    All packages and meals include a free storage period, with
                    low-cost extensions available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">
                            Service Tier / Locker Size
                          </TableHead>
                          <TableHead className="text-center">
                            Free Period
                          </TableHead>
                          <TableHead className="text-center">
                            Tier 1 (8–24 hrs)
                          </TableHead>
                          <TableHead className="text-center">
                            Tier 2 (24–48 hrs)
                          </TableHead>
                          <TableHead className="text-center">
                            Tier 3 (48–72 hrs)
                          </TableHead>
                          <TableHead className="text-center">
                            Tier 4 (&gt; 72 hrs)
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">
                            Parcel Small (≤ 12″×12″×16″)
                          </TableCell>
                          <TableCell className="text-center font-medium text-green-600">
                            0–8 hrs: Free
                          </TableCell>
                          <TableCell className="text-center">$0.75</TableCell>
                          <TableCell className="text-center">
                            +$0.75 (total $1.50)
                          </TableCell>
                          <TableCell className="text-center">
                            +$0.75 (total $2.25)
                          </TableCell>
                          <TableCell className="text-center">
                            +$1.00/day ($10 cap)
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Parcel Medium (≤ 18″×18″×18″)
                          </TableCell>
                          <TableCell className="text-center font-medium text-green-600">
                            0–8 hrs: Free
                          </TableCell>
                          <TableCell className="text-center">$1.00</TableCell>
                          <TableCell className="text-center">
                            +$1.00 (total $2.00)
                          </TableCell>
                          <TableCell className="text-center">
                            +$1.00 (total $3.00)
                          </TableCell>
                          <TableCell className="text-center">
                            +$1.50/day ($10 cap)
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Parcel Large (≤ 24″×24″×24″)
                          </TableCell>
                          <TableCell className="text-center font-medium text-green-600">
                            0–8 hrs: Free
                          </TableCell>
                          <TableCell className="text-center">$1.50</TableCell>
                          <TableCell className="text-center">
                            +$1.50 (total $3.00)
                          </TableCell>
                          <TableCell className="text-center">
                            +$1.50 (total $4.50)
                          </TableCell>
                          <TableCell className="text-center">
                            +$2.00/day ($10 cap)
                          </TableCell>
                        </TableRow>
                        <TableRow className="bg-blue-50">
                          <TableCell className="font-medium">
                            Meal Locker (Refrigerated)
                          </TableCell>
                          <TableCell className="text-center font-medium text-green-600">
                            0–4 hrs: Free
                          </TableCell>
                          <TableCell className="text-center">
                            $2.00 (4–12 hrs)
                          </TableCell>
                          <TableCell className="text-center">
                            +$2.00 (total $4.00)
                          </TableCell>
                          <TableCell className="text-center">
                            +$2.00 (total $6.00)
                          </TableCell>
                          <TableCell className="text-center">
                            +$3.00/day ($15 cap)
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span>Student Subscription</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          $20
                        </div>
                        <div className="text-gray-600">per year</div>
                      </div>
                      <ul className="space-y-2">
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">
                            Reserved Medium locker access
                          </span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">
                            Up to 48 hrs free storage per package
                          </span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">
                            50% discount on Tier 1 fees
                          </span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">
                            One free meal locker per semester
                          </span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <span>Overstay Policy</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">
                            7+ days unclaimed:
                          </span>
                          <span className="text-sm font-bold text-orange-600">
                            $15 penalty
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">
                            14+ days unclaimed:
                          </span>
                          <span className="text-sm text-gray-600">
                            Donated to campus charity
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                        Items unclaimed after 14 days will be donated to campus
                        thrift shops or returned to sender. Recipients remain
                        liable for all accrued fees.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Revenue Streams */}
        <section className="w-full py-16 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                📊 Revenue Model
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-4">
                Multiple Revenue Streams
              </h2>
              <p className="mx-auto text-gray-600 text-lg md:text-xl max-w-3xl leading-relaxed">
                Diversified income from storage fees, partnerships, advertising,
                and premium services
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span>Storage & Late Fees</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      2,000-student campus example:
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>200 packages/day</span>
                        <span>30% overstay</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Daily revenue:</span>
                        <span className="text-green-600">~$100</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span>Term revenue:</span>
                        <span className="text-green-600">$20,000</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UtensilsCrossed className="h-5 w-5 text-orange-600" />
                    <span>Meal Locker Premium</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      Campus food delivery:
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>75 meals/day</span>
                        <span>$2 avg fee</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Daily revenue:</span>
                        <span className="text-green-600">~$150</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span>Term revenue:</span>
                        <span className="text-green-600">$30,000</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Monitor className="h-5 w-5 text-purple-600" />
                    <span>Hub Screen Advertising</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      Campus & local business ads:
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Campus clubs:</span>
                        <span>$50/month</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Local businesses:</span>
                        <span>$200/month</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span>Revenue share:</span>
                        <span className="text-green-600">60% / 40%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-green-600" />
                    <span>Courier Integration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      Delivery partner credits:
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>$0.50 per package</span>
                        <span>200/day</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Daily revenue:</span>
                        <span className="text-green-600">~$100</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span>Term revenue:</span>
                        <span className="text-green-600">$20,000</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    <span>Student Subscriptions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      Premium address-of-record service:
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>2,000 subscriptions</span>
                        <span>$20/year</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>20% adoption rate</span>
                        <span>$10/term</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span>Term revenue:</span>
                        <span className="text-green-600">$20,000</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-red-600" />
                    <span>Total Projections</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      10,000-student campus, first year:
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Term Revenue:</span>
                        <span className="text-green-600">$41,500</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Operating Costs (45%):</span>
                        <span className="text-red-600">$18,675</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-lg">
                        <span>Net Profit:</span>
                        <span className="text-green-600">$22,825</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Deployment Locations */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">
                📍 Deployment Locations
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-4">
                Where Mail Guard Can Be Deployed
              </h2>
              <p className="mx-auto text-gray-600 text-lg md:text-xl max-w-3xl leading-relaxed">
                Our smart delivery hub system is designed for versatile
                deployment across various environments, with campus
                installations being our primary focus and expertise.
              </p>
            </div>

            {/* Primary Target: Campus Environments */}
            <div className="mb-16">
              <div className="text-center mb-12">
                <Badge variant="secondary" className="mb-4">
                  🎯 Primary Target Markets
                </Badge>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Campus & Educational Environments
                </h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Optimized for high-density student populations with unique
                  delivery challenges
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div className="group">
                  <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                        <GraduationCap className="h-8 w-8 text-blue-600" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">
                        Universities & Colleges
                      </h4>
                      <ul className="text-gray-600 leading-relaxed space-y-2 text-sm">
                        <li>• Student dormitories & residence halls</li>
                        <li>• Academic building clusters</li>
                        <li>• Student union buildings</li>
                        <li>• Graduate student housing</li>
                      </ul>
                      <div className="pt-2 text-xs text-green-600 font-medium">
                        ✓ Primary focus with proven ROI
                      </div>
                    </div>
                  </div>
                </div>
                <div className="group">
                  <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                        <School className="h-8 w-8 text-green-600" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">
                        Community Colleges
                      </h4>
                      <ul className="text-gray-600 leading-relaxed space-y-2 text-sm">
                        <li>• Commuter student parking areas</li>
                        <li>• Main campus entrances</li>
                        <li>• Student services buildings</li>
                        <li>• Evening program locations</li>
                      </ul>
                      <div className="pt-2 text-xs text-blue-600 font-medium">
                        ⭐ High potential market
                      </div>
                    </div>
                  </div>
                </div>
                <div className="group">
                  <div className="relative overflow-hidden rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                        <Users className="h-8 w-8 text-purple-600" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">
                        Student Housing
                      </h4>
                      <ul className="text-gray-600 leading-relaxed space-y-2 text-sm">
                        <li>• Off-campus apartment complexes</li>
                        <li>• Greek life houses</li>
                        <li>• Graduate housing facilities</li>
                        <li>• Co-op student housing</li>
                      </ul>
                      <div className="pt-2 text-xs text-purple-600 font-medium">
                        🏠 Expanding market segment
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Markets */}
            <div className="mb-16">
              <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4">
                  🌟 Secondary Markets
                </Badge>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  High-Density Residential & Commercial
                </h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Adaptable solutions for other high-volume delivery
                  environments
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                <div className="group">
                  <div className="relative overflow-hidden rounded-xl border bg-gray-50 p-6 shadow-sm hover:shadow-md transition-all duration-300 h-full">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                        <Building className="h-6 w-6 text-orange-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Apartment Complexes
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        High-rise buildings with package theft concerns
                      </p>
                    </div>
                  </div>
                </div>
                <div className="group">
                  <div className="relative overflow-hidden rounded-xl border bg-gray-50 p-6 shadow-sm hover:shadow-md transition-all duration-300 h-full">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Briefcase className="h-6 w-6 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Office Buildings
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Corporate campuses and business parks
                      </p>
                    </div>
                  </div>
                </div>
                <div className="group">
                  <div className="relative overflow-hidden rounded-xl border bg-gray-50 p-6 shadow-sm hover:shadow-md transition-all duration-300 h-full">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <Home className="h-6 w-6 text-green-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Planned Communities
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        HOA-managed neighborhoods with central delivery points
                      </p>
                    </div>
                  </div>
                </div>
                <div className="group">
                  <div className="relative overflow-hidden rounded-xl border bg-gray-50 p-6 shadow-sm hover:shadow-md transition-all duration-300 h-full">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                        <Users className="h-6 w-6 text-indigo-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Senior Living
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Independent living facilities and retirement communities
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Installation Requirements */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 lg:p-12">
              <div className="text-center mb-12">
                <Badge variant="secondary" className="mb-4">
                  🔧 Installation Requirements
                </Badge>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Deployment Specifications
                </h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Technical requirements and site preparation for successful
                  Mail Guard deployment
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Zap className="h-5 w-5 text-red-600" />
                    </div>
                    <h4 className="text-lg font-semibold">
                      Power & Connectivity
                    </h4>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• 220V electrical connection</li>
                    <li>• High-speed internet (100+ Mbps)</li>
                    <li>• Backup power capability</li>
                    <li>• Cellular data backup option</li>
                  </ul>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold">
                      Space Requirements
                    </h4>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• 8' x 6' footprint minimum</li>
                    <li>• Weather-protected location</li>
                    <li>• ADA-compliant access</li>
                    <li>• Vehicle loading zone nearby</li>
                  </ul>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Shield className="h-5 w-5 text-green-600" />
                    </div>
                    <h4 className="text-lg font-semibold">Security & Access</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• 24/7 camera monitoring</li>
                    <li>• Well-lit installation area</li>
                    <li>• Controlled access environment</li>
                    <li>• Emergency contact protocols</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 text-center">
                <div className="inline-flex items-center space-x-2 px-6 py-3 bg-white border border-blue-200 rounded-full text-sm text-blue-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">
                    Free site assessment and installation consultation included
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Competitive Advantages */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">
                🏆 Competitive Edge
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-4">
                Why Mail Guard Leads
              </h2>
              <p className="mx-auto text-gray-600 text-lg md:text-xl max-w-3xl leading-relaxed">
                Unique advantages that set us apart in the campus delivery
                market
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    <span>Campus Safety Focus</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    California campus areas often face theft and security
                    concerns. Our monitored, refrigerated, and tamper-proof Hubs
                    greatly reduce stolen packages and missing meal
                    deliveries—critical in high-crime neighborhoods.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Snowflake className="h-5 w-5 text-blue-600" />
                    <span>Meal-Locker Integration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    Differentiated rates for packages vs. meals with flexible
                    peak lunch/dinner scheduling blocks ensure high throughput.
                    Meal delivery apps partner directly for Hub routing.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-purple-600" />
                    <span>Campus App Integration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    Unique to campus environment: "Hub Status" widget in student
                    portal, and push notifications via the university's official
                    app or housing management system.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    <span>Student-Adapted Grace Period</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    8-hour free period recognizes that students may be in class
                    or labs. This timeframe is usually enough to pick up
                    packages between lectures and activities.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="w-full py-16 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6">
                🚀 Get Started
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-6">
                Ready to Transform Campus Deliveries?
              </h2>
              <p className="text-gray-600 text-lg md:text-xl leading-relaxed mb-8 max-w-3xl mx-auto">
                Join the pilot program and see how Mail Guard can reduce package
                theft, improve student satisfaction, and generate revenue for
                your campus.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-base px-8 py-3"
                  >
                    Start Campus Pilot
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto text-base px-8 py-3"
                  >
                    Contact Sales Team
                  </Button>
                </Link>
              </div>
              <div className="mt-8 text-sm text-gray-500">
                Zero upfront costs • Revenue sharing model • 24/7 support
                included
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Enhanced Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 md:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-sm">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-xl">Mail Guard</span>
              </Link>
              <p className="text-gray-600 leading-relaxed max-w-md">
                Campus delivery hub solutions designed specifically for
                California colleges and universities. Secure, affordable,
                student-focused.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Solutions</h4>
              <nav className="space-y-2">
                <Link
                  href="/delivery-hub"
                  className="block text-gray-600 hover:text-primary transition-colors"
                >
                  Campus Hubs
                </Link>
                <Link
                  href="/dashboard"
                  className="block text-gray-600 hover:text-primary transition-colors"
                >
                  Pilot Program
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
              <nav className="space-y-2">
                <Link
                  href="#"
                  className="block text-gray-600 hover:text-primary transition-colors"
                >
                  Campus Partnerships
                </Link>
                <Link
                  href="#"
                  className="block text-gray-600 hover:text-primary transition-colors"
                >
                  Technical Support
                </Link>
              </nav>
            </div>
          </div>
          <div className="border-t pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500">
                © 2025 Mail Guard Campus Solutions. All rights reserved.
              </p>
              <nav className="flex gap-6">
                <Link
                  href="#"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  href="#"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
