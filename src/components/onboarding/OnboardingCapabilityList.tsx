import { Card } from '@/components/ui/card';

export interface OnboardingCapabilityItem {
  title: string;
  description: string;
}

interface OnboardingCapabilityListProps {
  items: readonly OnboardingCapabilityItem[];
  tone: 'provided' | 'notProvided';
}

/**
 * 온보딩의 "제공하지 않는 것"과 "제공하는 것"은 같은 목록 의미 구조를 공유한다.
 * 항목 문구와 section heading은 페이지가 소유하고, 이 컴포넌트는 목록 surface와
 * 장식 아이콘의 표현만 책임진다.
 */
export function OnboardingCapabilityList({ items, tone }: OnboardingCapabilityListProps) {
  const isProvided = tone === 'provided';

  return (
    <Card className="overflow-hidden">
      <ul>
        {items.map((item) => (
          <li
            key={item.title}
            className="border-border flex gap-3 border-b px-4 py-3 last:border-b-0"
          >
            <span
              aria-hidden="true"
              className={
                isProvided
                  ? 'bg-primary/10 text-primary flex size-[26px] shrink-0 items-center justify-center rounded-md text-sm font-extrabold'
                  : 'bg-muted text-muted-foreground flex size-[26px] shrink-0 items-center justify-center rounded-md text-sm font-bold'
              }
            >
              {isProvided ? '✓' : '×'}
            </span>
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="text-muted-foreground text-xs leading-5">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
