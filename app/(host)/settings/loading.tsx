import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <main className="w-full p-3 md:p-6 lg:px-10">
      <div className="w-full space-y-6">
        <div>
          <Skeleton className="h-9 w-[150px] mb-2" />
          <Skeleton className="h-4 w-[350px]" />
        </div>

        {/* Media Section Skeleton */}
        <Card>
          <CardHeader className="border-b p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-[200px]" />
                <Skeleton className="h-3 w-[250px]" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-6">
            <div className="flex gap-6 overflow-x-auto py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-44 shrink-0 rounded-xl" />
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-[150px]" />
                <Skeleton className="h-3 w-[250px]" />
              </div>
              <Skeleton className="h-9 w-[140px]" />
            </div>
          </CardContent>
        </Card>

        {/* Pricing Section Skeleton */}
        <Card>
          <CardHeader className="border-b p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-[180px]" />
                  <Skeleton className="h-3 w-[220px]" />
                </div>
              </div>
              <Skeleton className="h-9 w-32" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                     <Skeleton className="h-4 w-[100px]" />
                     <Skeleton className="h-10 w-full" />
                  </div>
               ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
