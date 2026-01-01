// components/PageLoader.tsx
const PageLoader = () => (
    <div className="flex flex-col gap-4 p-8 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="h-16 bg-muted rounded-md w-full mb-4" />
      {/* Content Skeleton */}
      <div className="h-64 bg-muted rounded-md w-full" />
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
  
  export default PageLoader;