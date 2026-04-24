import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <main className="relative flex flex-1 flex-col p-2 pb-4 md:px-6 2xl:px-10 gap-6">
      <div>
        <Skeleton className="h-9 w-[180px] mb-2" />
        <Skeleton className="h-4 w-[300px]" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-col items-start justify-between gap-2 pb-2 space-y-0">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
         <Skeleton className="h-7 w-[150px]" />
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
               <CardHeader>
                  <Skeleton className="h-6 w-[120px] mb-2" />
                  <Skeleton className="h-4 w-[200px]" />
               </CardHeader>
               <CardContent>
                  <div className="space-y-4">
                     {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                     ))}
                  </div>
               </CardContent>
            </Card>
            <Card>
               <CardHeader>
                  <Skeleton className="h-6 w-[120px] mb-2" />
                  <Skeleton className="h-4 w-[200px]" />
               </CardHeader>
               <CardContent>
                  <div className="space-y-4">
                     {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                     ))}
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>
    </main>
  );
}
