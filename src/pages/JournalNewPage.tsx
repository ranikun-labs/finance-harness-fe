import { Link, useSearchParams } from 'react-router';

import { PageSkeleton } from '@/components/layout/PageSkeleton';
import { buildAppJournalNewPath } from '@/constants/routes';
import { resolveJournalType } from '@/features/journal-new/model/journalType';
import { useTranslation } from '@/i18n/I18nContext';

/**
 * `type` 쿼리 값('investment'/'study')은 도메인 식별자이며 번역 대상이 아니다 —
 * 표시 문구만 `t()`로 조회한다.
 */
export function JournalNewPage() {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const resolution = resolveJournalType(searchParams);

  if (!resolution.ok) {
    return (
      <section className="flex min-h-full flex-col gap-4 p-4 pb-[env(safe-area-inset-bottom)]">
        <div className="border-border bg-card flex flex-col gap-3 rounded-xl border p-5">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-foreground text-lg font-semibold">
              {t('app.journalNew.invalidType.heading')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('app.journalNew.invalidType.description')}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-center text-sm font-medium"
              to={buildAppJournalNewPath('investment')}
            >
              {t('app.journalNew.invalidType.investmentAction')}
            </Link>
            <Link
              className="border-border text-foreground rounded-md border px-4 py-2 text-center text-sm font-medium"
              to={buildAppJournalNewPath('study')}
            >
              {t('app.journalNew.invalidType.studyAction')}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const title =
    resolution.type === 'study' ? t('app.journalNew.study') : t('app.journalNew.investment');

  return <PageSkeleton title={title} />;
}
