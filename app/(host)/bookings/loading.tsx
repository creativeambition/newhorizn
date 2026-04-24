import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="relative w-full p-3 md:p-6 lg:px-10">
      <div className="grid gap-6">
        <div className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-9 w-[180px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Skeleton className="h-10 w-full sm:w-48" />
            <Skeleton className="h-10 w-[140px]" />
          </div>
        </div>
        <div className="flex gap-4 border-b pb-2 mt-4 overflow-x-auto">
           <Skeleton className="h-8 w-[120px] shrink-0" />
           <Skeleton className="h-8 w-[120px] shrink-0" />
           <Skeleton className="h-8 w-[120px] shrink-0" />
           <Skeleton className="h-8 w-[120px] shrink-0" />
        </div>
        <div className="space-y-4 mt-4">
           <Skeleton className="h-12 w-full rounded-t-md" />
           {Array.from({ length: 6 }).map((_, i) => (
             <Skeleton key={i} className="h-20 w-full rounded-none border-b" />
           ))}
        </div>
      </div>
    </main>
  );
}
