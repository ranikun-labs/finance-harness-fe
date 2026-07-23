interface PageSkeletonProps {
  title: string;
}

/** 화면 식별용 제목만 렌더하는 골격. 실제 UI는 다음 단계(STEP 4)에서 구현한다. */
export function PageSkeleton({ title }: PageSkeletonProps) {
  return (
    <div className="flex min-h-full flex-col gap-2 p-4 pb-[env(safe-area-inset-bottom)]">
      <h1 className="text-foreground text-lg font-semibold">{title}</h1>
    </div>
  );
}
