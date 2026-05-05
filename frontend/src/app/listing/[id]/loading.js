export default function ListingLoading() {
  return (
    <div className="min-h-screen bg-[#f3f5f8] px-4 pb-16 pt-6 md:px-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="skeleton-pulse skeleton-surface h-5 w-40 rounded-full" />
        <div className="mt-5 space-y-3">
          <div className="skeleton-pulse skeleton-surface h-12 w-3/5 rounded-full" />
          <div className="skeleton-pulse skeleton-surface h-5 w-2/5 rounded-full" />
        </div>
        <div className="mt-8 grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="skeleton-pulse skeleton-surface min-h-[440px] rounded-[34px]" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="skeleton-pulse skeleton-surface min-h-[214px] rounded-[28px]" />
            <div className="skeleton-pulse skeleton-surface min-h-[214px] rounded-[28px]" />
            <div className="skeleton-pulse skeleton-surface min-h-[214px] rounded-[28px]" />
            <div className="skeleton-pulse skeleton-surface min-h-[214px] rounded-[28px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
