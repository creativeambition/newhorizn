"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppContext } from "@/lib/context/app-context";
import { useAuth } from "@/lib/context/auth-context";
import { formatDate } from "@/lib/utils";
import {
  ArrowUpRight,
  BedDouble,
  BookMarked,
  Boxes,
  CalendarDays,
  MessageSquareWarning,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function DashboardSkeleton() {
  return (
    <main className="relative flex flex-1 flex-col p-2 pb-4 md:px-6 2xl:px-10 gap-6">
      <div>
        <Skeleton className="h-9 w-45 mb-2" />
        <Skeleton className="h-4 w-75" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-col items-start justify-between gap-2 pb-2 space-y-0">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-25" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-15 mb-2" />
              <Skeleton className="h-3 w-30" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-7 w-37.5" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-30 mb-2" />
                <Skeleton className="h-4 w-50" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function Dashboard() {
  const { bookings, rooms, isLoading, appConfig } = useAppContext();

  if (isLoading) {
    return <DashboardSkeleton />;
  }
  const { accommodationData } = useAuth();

  type TimeFrame = "daily" | "weekly" | "monthly" | "all";

  const [timeFrame, setTimeFrame] = useState<TimeFrame>("daily");
  const [hideVerificationPrompt, setHideVerificationPrompt] = useState(false);
  const [hideCommissionAlert, setHideCommissionAlert] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("commission-alert-dismissed") === "1",
  );

  const dismissCommissionAlert = () => {
    localStorage.setItem("commission-alert-dismissed", "1");
    setHideCommissionAlert(true);
  };

  const acceptedBookingsCount = useMemo(
    () => bookings.filter((b) => b.status !== "pending").length,
    [bookings],
  );
  const commissionLimitReached =
    appConfig != null && acceptedBookingsCount >= appConfig.freeBookings;

  const totalBeds = useMemo(
    () => rooms.reduce((acc, room) => acc + room.capacity, 0),
    [rooms],
  );

  const availableBeds = useMemo(
    () => rooms.reduce((acc, room) => acc + room.availableBeds, 0),
    [rooms],
  );

  const activeGuests = useMemo(
    () =>
      bookings.filter((booking) => {
        const now = new Date();
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        return checkIn <= now && checkOut >= now;
      }),
    [bookings],
  );

  // Get upcoming check-ins for today
  const todayCheckIns = useMemo(
    () =>
      bookings.filter((booking) => {
        const today = new Date();
        const checkIn = new Date(booking.checkIn);
        return checkIn.toDateString() === today.toDateString();
      }),
    [bookings],
  );

  const todayCheckOuts = useMemo(
    () =>
      bookings.filter((booking) => {
        const today = new Date();
        const checkOut = new Date(booking.checkOut);
        return checkOut.toDateString() === today.toDateString();
      }),
    [bookings],
  );

  // Calculate booking growth
  const lastMonthBookings = useMemo(() => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return bookings.filter(
      (booking) =>
        new Date(booking.createdAt).getMonth() === lastMonth.getMonth(),
    ).length;
  }, [bookings]);

  const currentMonthBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter(
      (booking) => new Date(booking.createdAt).getMonth() === now.getMonth(),
    ).length;
  }, [bookings]);

  const bookingGrowth =
    lastMonthBookings > 0
      ? ((currentMonthBookings - lastMonthBookings) / lastMonthBookings) * 100
      : 0;

  const dailyData = useMemo(() => {
    // Create array of last 30 dates
    const dates = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toLocaleDateString();
    }).reverse();

    // Initialize accumulator with all dates
    const initialAcc = dates.reduce(
      (acc, date) => {
        acc[date] = {
          date,
          students: 0,
          guests: 0,
          revenue: 0,
        };
        return acc;
      },
      {} as Record<string, any>,
    );

    // Aggregate booking data
    const filledData = bookings.reduce((acc, booking) => {
      const date = new Date(booking.checkIn).toLocaleDateString();

      const isHostel = accommodationData?.listingType === "hostel";

      if (acc[date]) {
        if (isHostel && booking.bookingType === "student") {
          acc[date].students += 1;
        } else {
          acc[date].guests += 1;
        }
        acc[date].revenue += booking.paymentAmount;
      }

      return acc;
    }, initialAcc);

    return Object.values(filledData);
  }, [bookings]);

  const weeklyData = useMemo(() => {
    // Get the last 12 weeks
    const getWeekNumber = (date: Date) => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear =
        (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    // Generate array of last 12 weeks
    const weeks = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i * 7);
      const weekNum = getWeekNumber(date);
      return `Week ${weekNum}`;
    }).reverse();

    // Initialize accumulator with all weeks
    const initialAcc = weeks.reduce(
      (acc, week) => {
        acc[week] = {
          week,
          students: 0,
          guests: 0,
          revenue: 0,
        };
        return acc;
      },
      {} as Record<string, any>,
    );

    // Aggregate booking data
    const weeklyStats = bookings.reduce((acc, booking) => {
      const date = new Date(booking.checkIn);
      const weekNum = getWeekNumber(date);
      const weekKey = `Week ${weekNum}`;
      const isHostel = accommodationData?.listingType === "hostel";

      if (acc[weekKey]) {
        if (isHostel && booking.bookingType === "student") {
          acc[weekKey].students += 1;
        } else {
          acc[weekKey].guests += 1;
        }
        acc[weekKey].revenue += booking.paymentAmount;
      }

      return acc;
    }, initialAcc);

    return Object.values(weeklyStats);
  }, [bookings]);

  const monthlyData = useMemo(() => {
    // Generate array of last 12 months
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
    }).reverse();

    // Initialize accumulator with all months
    const initialAcc = months.reduce(
      (acc, month) => {
        acc[month] = {
          month,
          students: 0,
          guests: 0,
          revenue: 0,
        };
        return acc;
      },
      {} as Record<string, any>,
    );

    // Aggregate booking data
    const monthlyStats = bookings.reduce((acc, booking) => {
      const date = new Date(booking.checkIn);
      const monthYear = date.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      const isHostel = accommodationData?.listingType === "hostel";

      if (acc[monthYear]) {
        if (isHostel && booking.bookingType === "student") {
          acc[monthYear].students += 1;
        } else {
          acc[monthYear].guests += 1;
        }
        acc[monthYear].revenue += booking.paymentAmount;
      }

      return acc;
    }, initialAcc);

    return Object.values(monthlyStats);
  }, [bookings]);

  const allTimeData = useMemo(() => {
    const allData = bookings.reduce<Record<string, any>>((acc, booking) => {
      const date = new Date(booking.checkIn).toLocaleDateString();
      const isHostel = accommodationData?.listingType === "hostel";

      if (!acc[date]) {
        acc[date] = {
          date,
          students: 0,
          guests: 0,
          revenue: 0,
        };
      }

      if (isHostel && booking.bookingType === "student") {
        acc[date].students += 1;
      } else {
        acc[date].guests += 1;
      }
      acc[date].revenue += booking.paymentAmount;

      return acc;
    }, {});

    return Object.values(allData).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [bookings]);

  const data = useMemo(() => {
    switch (timeFrame) {
      case "daily":
        return dailyData;
      case "weekly":
        return weeklyData;
      case "monthly":
        return monthlyData;
      case "all":
        return allTimeData;
      default:
        return dailyData;
    }
  }, [timeFrame, dailyData, weeklyData, monthlyData, allTimeData]);

  return (
    <main className="relative flex flex-1 flex-col p-2 pb-4 md:px-6 2xl:px-10 gap-6">
      <div>
        <h1 className="text-xl md:text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of your accommodation operations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-col items-start justify-between gap-2 pb-2 space-y-0">
            <BookMarked className="w-4 h-4 text-muted-foreground" />

            <CardTitle className="text-sm font-medium">
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {acceptedBookingsCount}
              {appConfig && acceptedBookingsCount < appConfig.freeBookings && (
                <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full whitespace-nowrap">
                  {acceptedBookingsCount} / {appConfig.freeBookings} Free
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {bookingGrowth > 0
                ? `+${bookingGrowth.toFixed(0)}%`
                : `${bookingGrowth.toFixed(0)}%`}{" "}
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col items-start justify-between gap-2 pb-2 space-y-0">
            <BedDouble className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">
              Available Beds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableBeds}</div>
            <p className="text-xs text-muted-foreground">
              Out of {totalBeds} total beds
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col items-start gap-2 justify-between pb-2 space-y-0">
            <Users className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Active Guests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGuests.length}</div>
            <p className="text-xs text-muted-foreground">
              {todayCheckIns.length} check-ins today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col items-start justify-between gap-2 pb-2 space-y-0">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">
              Upcoming Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCheckIns.length}</div>
            <p className="text-xs text-muted-foreground">For today</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Today's Activity
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Check-ins</CardTitle>
              <CardDescription>Guests expected to arrive today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 text-sm font-medium">
                  <div>Name</div>
                  <div>Room</div>
                  <div>Check-in Time</div>
                </div>
                {todayCheckIns.length > 0 ? (
                  todayCheckIns.map((booking) => (
                    <div
                      key={booking.id}
                      className="grid grid-cols-3 items-center gap-4 text-sm"
                    >
                      <div>{booking.guestName}</div>
                      <div>{booking.roomName}</div>
                      <div>{formatDate(booking.checkIn)}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No check-ins scheduled for today
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today's Check-outs</CardTitle>
              <CardDescription>Guests expected to depart today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 text-sm font-medium">
                  <div>Name</div>
                  <div>Room</div>
                  <div>Check-out Time</div>
                </div>
                {todayCheckOuts.length > 0 ? (
                  todayCheckOuts.map((booking) => (
                    <div
                      key={booking.id}
                      className="grid grid-cols-3 items-center gap-4 text-sm"
                    >
                      <div>{booking.guestName}</div>
                      <div>{booking.roomName}</div>
                      <div>{formatDate(booking.checkOut)}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No check-outs scheduled for today
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Semester Analytics */}
      <div className="flex justify-between flex-wrap gap-4">
        <div>
          <CardTitle>Booking Analytics</CardTitle>
          <CardDescription>
            Overview of bookings and revenue trends
          </CardDescription>
        </div>

        <Tabs
          value={timeFrame}
          onValueChange={(v) => setTimeFrame(v as TimeFrame)}
        >
          <TabsList className="grid w-full max-w-100 grid-cols-4">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="all">All time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex items-center justify-center flex-1 bg-linear-to-br from-primary/20 to-success/20 p-0.5 rounded-lg border border-primary/10">
        <Card className="w-full">
          <CardContent>
            {data.length > 1 ? (
              <div className="flex-1 h-100 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient
                        id="colorStudents"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-primary)"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-primary)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorGuests"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-secondary)"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-secondary)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-success)"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-success)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted/50"
                      vertical={false}
                    />
                    <XAxis
                      dataKey={
                        timeFrame === "daily"
                          ? "date"
                          : timeFrame === "weekly"
                            ? "week"
                            : timeFrame === "monthly"
                              ? "month"
                              : "date"
                      }
                      className="text-xs"
                      axisLine={false}
                      tickLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      yAxisId="left"
                      className="text-xs"
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "Bookings",
                        angle: -90,
                        position: "insideLeft",
                        className: "text-xs text-muted-foreground",
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      className="text-xs"
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "Revenue",
                        angle: 90,
                        position: "insideRight",
                        className: "text-xs text-muted-foreground",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "var(--color-border)",
                        borderRadius: "var(--radius)",
                        boxShadow: "var(--shadow)",
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    {accommodationData?.listingType === "hostel" && (
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="students"
                        name="Students"
                        stroke="var(--color-primary)"
                        fill="url(#colorStudents)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    )}
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="guests"
                      name={
                        accommodationData?.listingType === "hostel"
                          ? "Regular Guests"
                          : "Total Bookings"
                      }
                      stroke="var(--color-foreground)"
                      fill="url(#colorGuests)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="var(--color-success)"
                      fill="url(#colorRevenue)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 h-100 w-full flex items-center justify-center rounded-md p-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Boxes className="h-8 w-8 text-muted-foreground animate-pulse" />
                  <h3 className="font-medium">Not Enough Data Available</h3>
                  <p className="text-sm text-muted-foreground">
                    Not enough booking data to generate analytics. Start adding
                    bookings to see trends.
                  </p>
                  <Link className="text-sm mt-3" href={"bookings"}>
                    <Button variant={"link"}>
                      Go to bookings
                      <ArrowUpRight />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {commissionLimitReached && !hideCommissionAlert && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 z-50 w-[calc(100%-2rem)] max-w-sm rounded-lg border bg-background p-4 shadow-lg flex flex-col gap-3 animate-in slide-in-from-bottom-5">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-70 hover:opacity-100"
            onClick={dismissCommissionAlert}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
          <div className="flex gap-3">
            <div className="text-yellow-500 shrink-0">
              <MessageSquareWarning className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-medium text-sm">
                Free booking limit reached
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You've used all {appConfig!.freeBookings} free bookings. A{" "}
                {appConfig!.commissionRate * 100}% platform fee now applies to
                each new booking.
              </p>
            </div>
          </div>
        </div>
      )}

      {accommodationData &&
        accommodationData.isVerified !== true &&
        !hideVerificationPrompt && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 z-50 w-[calc(100%-2rem)] max-w-sm rounded-lg border bg-background p-4 shadow-lg flex flex-col gap-3 animate-in slide-in-from-bottom-5">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-70 hover:opacity-100"
              onClick={() => setHideVerificationPrompt(true)}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
            <div className="flex gap-3">
              <div className="text-success shrink-0">
                <MessageSquareWarning className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-medium text-sm">
                  Action required: Verify your listing
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your accommodation currently won't appear on the Explore page.
                  Get verified for free to start reaching more students.
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-1">
              <Link href="/support">
                <Button size="sm" variant="default" className="text-xs h-8">
                  Get Verified
                </Button>
              </Link>
            </div>
          </div>
        )}
    </main>
  );
}
