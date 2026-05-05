export const unstable_instant = true;

function CardSkeleton() {
  return (
    <div className="rounded-[30px] border border-white/75 bg-white/62 p-3">
      <div className="skeleton-pulse skeleton-surface aspect-[1.08/1] rounded-[24px]" />
      <div className="mt-4 space-y-3 px-1">
        <div className="skeleton-pulse skeleton-surface h-5 w-3/4 rounded-full" />
        <div className="skeleton-pulse skeleton-surface h-4 w-1/2 rounded-full" />
        <div className="skeleton-pulse skeleton-surface h-4 w-1/3 rounded-full" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="flex-1 bg-[#f3f5f8] px-4 pb-8 pt-4 md:px-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="skeleton-pulse skeleton-surface mb-6 h-24 rounded-[30px]" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.04fr)_minmax(360px,0.96fr)]">
          <div className="rounded-[34px] border border-white/75 bg-white/58 p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="space-y-3">
                <div className="skeleton-pulse skeleton-surface h-4 w-36 rounded-full" />
                <div className="skeleton-pulse skeleton-surface h-7 w-60 rounded-full" />
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
          <div className="skeleton-pulse skeleton-surface min-h-[560px] rounded-[34px]" />
        </div>
      </div>
    </div>
  );
}
