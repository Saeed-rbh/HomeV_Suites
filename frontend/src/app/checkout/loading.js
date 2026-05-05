export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-[#edf2f7] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="skeleton-pulse skeleton-surface h-5 w-40 rounded-full" />
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[34px] border border-white/80 bg-white/72 p-8">
            <div className="space-y-4">
              <div className="skeleton-pulse skeleton-surface h-10 w-2/5 rounded-full" />
              <div className="skeleton-pulse skeleton-surface h-5 w-3/5 rounded-full" />
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="skeleton-pulse skeleton-surface h-20 rounded-[24px]" />
              <div className="skeleton-pulse skeleton-surface h-20 rounded-[24px]" />
            </div>
            <div className="mt-4 skeleton-pulse skeleton-surface h-20 rounded-[24px]" />
            <div className="mt-8 skeleton-pulse skeleton-surface h-64 rounded-[28px]" />
          </div>
          <div className="rounded-[30px] border border-white/80 bg-white/72 p-6">
            <div className="skeleton-pulse skeleton-surface aspect-[1.15/1] rounded-[24px]" />
            <div className="mt-5 space-y-3">
              <div className="skeleton-pulse skeleton-surface h-8 w-3/4 rounded-full" />
              <div className="skeleton-pulse skeleton-surface h-4 w-1/2 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
