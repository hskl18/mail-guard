import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Shield,
  ArrowLeft,
  School,
  Building,
  Package,
  Users,
  Clock,
  CheckCircle,
  DollarSign,
  Lock,
  ThermometerSnowflake,
  Percent,
  UserPlus,
  BarChart,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function MarketPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container mx-auto px-4 lg:px-6 h-16 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <Mail className="h-6 w-6 mr-2 text-primary" />
          <span className="font-bold">Mail Guard</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/"
          >
            Home
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/about"
          >
            About
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4 text-primary"
            href="/market"
          >
            Market
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/sign-in"
          >
            Sign In
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/sign-up"
          >
            Sign Up
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Badge variant="outline" className="px-3 py-1 text-sm">
                Market Analysis
              </Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter">
                Campus Delivery Solutions
              </h1>
              <p className="text-gray-500 md:text-xl max-w-[800px]">
                Exploring the market for secure smart locker systems in college
                campuses
              </p>
            </div>
          </div>
        </section>

        {/* Executive Summary */}
        <section className="w-full py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Executive Summary</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 mb-4">
                  California universities are grappling with package theft and
                  last-mile delivery challenges as student online orders (from
                  textbooks to takeout) surge. Traditional mailrooms and
                  front-desk delivery often lead to stolen or misplaced parcels,
                  long pickup lines, and limited pickup hours.
                </p>
                <p className="text-gray-600 mb-4">
                  In response, a range of smart delivery locker solutions has
                  emerged to secure mail, packages, and even food deliveries for
                  students. These solutions provide 24/7 self-service pickup in
                  secure lockers, notifying students by email/app when a package
                  or meal is ready.
                </p>
                <p className="text-gray-600 mb-4">
                  This significantly improves convenience and reduces theft –
                  for example, UCLA's dorms installed Amazon Hub lockers that
                  allow secure package pickup 24 hours a day (Amazon even
                  covered the installation cost). Overall, smart locker
                  deployments have proven to streamline campus deliveries, with
                  one California university seeing a 60% faster pickup process
                  and the ability to handle 250 packages per day after
                  installing smart lockers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Competitive Landscape */}
        <section className="w-full py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Competitive Landscape</h2>
              <p className="text-gray-600 mb-8">
                The market includes both tech giants and specialized startups
                offering secure locker hardware plus software platforms to
                automate delivery and pickup. Major players like Amazon Hub,
                Luxer One, Parcel Pending (Quadient), and Package Concierge have
                established products, while university-driven initiatives and
                newer startups also contribute solutions.
              </p>

              <div className="overflow-x-auto">
                <Table>
                  <TableCaption>
                    Comparison of Smart Locker Delivery Solutions for University
                    Campuses
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Company</TableHead>
                      <TableHead>Solutions & Deployment</TableHead>
                      <TableHead>Key Differentiators</TableHead>
                      <TableHead>Campus Adoption</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">
                        Amazon Hub Locker
                      </TableCell>
                      <TableCell>
                        Modular self-service parcel lockers (indoor/outdoor).
                        42-compartment base units with touchscreen interface.
                        Requires space, power, and network.
                      </TableCell>
                      <TableCell>
                        Amazon ecosystem integration. Accepts all carriers'
                        deliveries in apartment/campus installations. Automated
                        email/SMS pickup codes.
                      </TableCell>
                      <TableCell>
                        Widely deployed near or on campuses (e.g. UCLA dorms,
                        USC Village). Popular for student Amazon orders.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Luxer One (Assa Abloy)
                      </TableCell>
                      <TableCell>
                        Smart package lockers with varied compartment sizes;
                        optional Luxer Fridge units for perishable groceries.
                        Integrations with campus ID systems.
                      </TableCell>
                      <TableCell>
                        24/7 surveillance with cloud-connected cameras. "Flex
                        Locker" add-ons for peak periods. Students can use
                        campus cards or phone NFC.
                      </TableCell>
                      <TableCell>
                        Leading campus provider with installations at numerous
                        universities. A top California university saw 60% faster
                        pickups.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Parcel Pending (Quadient)
                      </TableCell>
                      <TableCell>
                        Comprehensive smart locker systems with standard,
                        oversize, and refrigerated lockers. Package room
                        solutions and off-site pickup network.
                      </TableCell>
                      <TableCell>
                        Campus Hub™ multi-use lockers for packages, bookstore
                        orders, library loans, and food pantry pickups. Full
                        chain-of-custody tracking.
                      </TableCell>
                      <TableCell>
                        Market leader in higher-ed with lockers at 300+ U.S.
                        colleges. Clients include University of Florida,
                        University of Alabama, and many California campuses.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Package Concierge (Gibraltar/Quadient)
                      </TableCell>
                      <TableCell>
                        Smart package locker kiosks for indoor/outdoor use.
                        Rugged steel locker modules with touchscreen and
                        barcode/QR scanner.
                      </TableCell>
                      <TableCell>
                        Early mover in US market (launched 2013). Mobile app for
                        recipients. Automatic user enrollment for students.
                        External "oversize package" bins.
                      </TableCell>
                      <TableCell>
                        Used in many off-campus student apartments and
                        universities like Pepperdine. After Quadient's
                        acquisition, serves over 1.5 million students
                        nationwide.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Fengchao Hive Box ("FCBOX")
                      </TableCell>
                      <TableCell>
                        Nationwide smart locker network in China, deployed at
                        universities and transit hubs. Outdoor locker cabinets
                        with modular compartments.
                      </TableCell>
                      <TableCell>
                        World's largest parcel locker network (330,000+
                        stations). Integration with e-commerce platforms and
                        courier services. Uses overtime fee model to improve
                        turnover.
                      </TableCell>
                      <TableCell>
                        Ubiquitous at Chinese universities and cities, but not
                        yet present in California. Included as a benchmark for
                        carrier-agnostic, widely accessible networks.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </section>

        {/* Opportunities Section */}
        <section className="w-full py-12 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-8 text-center">
                Key Opportunities for Mail Guard
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <BarChart className="h-5 w-5 mr-2 text-primary" />
                      Rising Package Volume
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Campuses are overwhelmed with packages (up to 4,000 per
                      day during peak times). Mail Guard can emphasize
                      efficiency gains, handling large package influxes with
                      minimal staff involvement.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <Lock className="h-5 w-5 mr-2 text-primary" />
                      Enhanced Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Mail Guard can differentiate by offering tamper alarms,
                      robust construction, and real-time alerts. A
                      chain-of-custody guarantee and campus police notification
                      for suspicious activities adds value.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <DollarSign className="h-5 w-5 mr-2 text-primary" />
                      Affordability & Scalability
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Many solutions require significant upfront investment
                      ($10k-$20k per unit). Mail Guard can offer a more
                      affordable, scalable model with low upfront costs and
                      modular units that can be added gradually.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <Clock className="h-5 w-5 mr-2 text-primary" />
                      Flexible Capacity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Design flexible or portable locker systems like pop-up
                      locker banks or mobile locker trailers deployable during
                      move-in week. This agility appeals to campuses avoiding
                      over-investment in permanent infrastructure.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <ThermometerSnowflake className="h-5 w-5 mr-2 text-primary" />
                      Food & Perishable Deliveries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Incorporate temperature-controlled lockers for meal
                      deliveries on campus. Partner with campus dining or food
                      delivery apps so drivers can drop off meals in
                      heated/cooled lockers, becoming a first-mover in campus
                      food security.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <Users className="h-5 w-5 mr-2 text-primary" />
                      Student-to-Student Exchanges
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Facilitate peer-to-peer package exchanges for items
                      students sell or lend. Allow students to temporarily
                      secure items in lockers for other students to pick up,
                      expanding utility beyond mailroom use.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Mail Guard Solution */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 items-center max-w-5xl mx-auto">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">
                  The Mail Guard Advantage
                </h2>
                <p className="opacity-90">
                  Our smart delivery hub solution offers a comprehensive
                  approach to campus package security and management, addressing
                  key market gaps with innovative features.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>
                      Modular design that scales affordably for any campus size
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>
                      Temperature-controlled compartments for food deliveries
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>
                      Advanced security with tamper detection and real-time
                      monitoring
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>
                      Seamless integration with campus ID systems and mobile
                      apps
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>
                      Flexible deployment options including temporary expansion
                      units
                    </span>
                  </li>
                </ul>
                <div className="pt-4">
                  <Link href="/sign-up">
                    <Button
                      variant="secondary"
                      className="bg-white text-primary hover:bg-gray-100"
                    >
                      Request Campus Demo
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative h-[300px] md:h-[400px] rounded-lg overflow-hidden bg-gray-800/20">
                <div className="absolute inset-0 flex items-center justify-center text-white/20 text-center p-6">
                  <img
                    alt="Delivery Hub"
                    className="w-full max-w-lg rounded-xl shadow-xl object-cover object-center"
                    src="case.png"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="w-full py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold mb-4">
                Ready to transform campus deliveries?
              </h2>
              <p className="text-gray-500 mb-6">
                Contact us to discuss how Mail Guard can help your institution
                create a secure, efficient delivery experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/sign-up">
                  <Button size="lg">Schedule Consultation</Button>
                </Link>
                <Link href="/about">
                  <Button variant="outline" size="lg">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500">
              © 2025 Mail Guard Delivery Hub. All rights reserved.
            </p>
            <nav className="flex gap-4 sm:gap-6">
              <Link
                className="text-xs hover:underline underline-offset-4"
                href="#"
              >
                Terms of Service
              </Link>
              <Link
                className="text-xs hover:underline underline-offset-4"
                href="#"
              >
                Privacy
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
