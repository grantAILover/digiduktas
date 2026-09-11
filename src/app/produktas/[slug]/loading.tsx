export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="h-4 w-32 animate-pulse rounded bg-line" />
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="aspect-[4/3] animate-pulse rounded-xl bg-line" />
        <div className="flex flex-col gap-4">
          <div className="h-5 w-20 animate-pulse rounded bg-line" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-line" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-line" />
          <div className="mt-4 h-9 w-28 animate-pulse rounded bg-line" />
          <div className="mt-2 h-11 w-40 animate-pulse rounded-lg bg-line" />
        </div>
      </div>
    </div>
  );
}
