import { Link } from 'react-router';

import { EmptyState } from '@/components/common/EmptyState';
import { JournalRecordCard } from '@/components/journal/JournalRecordCard';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { APP_ROUTE_PATHS, buildAppAskPath } from '@/constants/routes';
import { useTranslation } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { JOURNAL_ENTRIES } from '@/mocks/journalEntries';

export function HomePage() {
  const { t } = useTranslation();
  const recentEntries = [...JOURNAL_ENTRIES]
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))
    .slice(0, 2);

  return (
    <div className="flex min-h-full min-w-0 flex-col gap-6 px-4 pt-5 pb-6">
      <Link
        to={buildAppAskPath()}
        className="group focus-visible:ring-ring/50 block min-h-11 min-w-0 rounded-3xl outline-none focus-visible:ring-3"
      >
        <Card className="border-primary/20 from-primary/10 via-card to-card group-hover:border-primary/35 flex min-h-[220px] min-w-0 flex-col justify-between gap-6 rounded-3xl bg-gradient-to-br p-6 shadow-md transition-colors">
          <div className="flex min-w-0 flex-col gap-3">
            <p className="text-primary text-xs font-bold tracking-wider uppercase">
              <span aria-hidden="true">✦ </span>
              {t('app.home.hero.eyebrow')}
            </p>
            <h1 className="text-foreground min-w-0 text-3xl leading-tight font-extrabold tracking-tight [overflow-wrap:anywhere]">
              {t('app.home.hero.heading')}
            </h1>
            <p className="text-muted-foreground min-w-0 text-sm leading-6 [overflow-wrap:anywhere]">
              {t('app.home.hero.description')}
            </p>
          </div>

          <span className="text-primary flex min-h-11 min-w-0 items-center justify-between gap-3 text-base font-bold">
            <span className="min-w-0 [overflow-wrap:anywhere]">{t('app.home.hero.action')}</span>
            <span
              aria-hidden="true"
              className="bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-2xl text-xl shadow-sm"
            >
              →
            </span>
          </span>
        </Card>
      </Link>

      <section className="flex min-w-0 flex-col gap-3" aria-labelledby="home-recent-records">
        <h2 id="home-recent-records" className="text-foreground text-lg font-bold tracking-tight">
          {t('app.home.recentRecords.heading')}
        </h2>

        {recentEntries.length > 0 ? (
          <>
            <ul className="flex min-w-0 flex-col gap-3">
              {recentEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="[&_a]:focus-visible:ring-ring/50 min-w-0 [&_a]:rounded-lg [&_a]:outline-none [&_a]:focus-visible:ring-3 [&_p]:[overflow-wrap:anywhere] [&_span]:[overflow-wrap:anywhere]"
                >
                  <JournalRecordCard entry={entry} />
                </li>
              ))}
            </ul>

            <Link
              to={APP_ROUTE_PATHS.journalList}
              className={cn(buttonVariants({ variant: 'outline' }), 'mt-1 min-h-11 w-full')}
            >
              {t('app.home.recentRecords.viewAll')}
            </Link>
          </>
        ) : (
          <Card className="p-2">
            <EmptyState
              icon={<span className="text-2xl">◇</span>}
              title={t('app.home.empty.title')}
              description={t('app.home.empty.description')}
              action={
                <Link
                  to={buildAppAskPath()}
                  className={cn(buttonVariants({ size: 'lg' }), 'mt-2 min-h-11')}
                >
                  {t('app.home.empty.action')}
                </Link>
              }
            />
          </Card>
        )}
      </section>
    </div>
  );
}
