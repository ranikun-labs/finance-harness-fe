import { JournalDeleteControl } from '@/features/journal-delete/JournalLifecycleControls';
import { JournalEditor } from '@/features/journal-edit/JournalEditor';
import { Link, useParams } from 'react-router';
import type { ReactNode } from 'react';

import { RecordTagText } from '@/components/common/RecordTagText';
import { Stack } from '@/components/layout/Stack';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { InfoList, InfoRow } from '@/components/ui/info-row';
import { APP_ROUTE_PATHS, buildAppJournalReviewPath } from '@/constants/routes';
import { useJournalReadPort } from '@/features/journal-read/JournalReadPortContext';
import type {
  JournalReadError,
  JournalReadPort,
} from '@/features/journal-read/model/journalReadPort';
import { useJournalDetail } from '@/features/journal-read/model/useJournalDetail';
import type { JournalDetailViewModel } from '@/features/journal-read/model/journalReadViewModel';
import { useTranslation } from '@/i18n/I18nContext';
import { formatJournalOccurredAt } from '@/lib/date';
import { cn } from '@/lib/utils';

/**
 * 읽기 본문 줄 길이 상한. Tailwind 스케일(`max-w-2xl`, 672px)을 쓴다. #46의 720px는 스케일 밖
 * 임의 값이라 가장 가까운 토큰으로 대체했다 — 셸 reading 폭(660)·2-pane 상세 폭 안에서는
 * 이 상한이 넘치는 경우가 거의 없어 폭이 큰 pane에서만 줄 길이를 보호한다.
 */
const READING_MEASURE_CLASS = 'max-w-2xl';

function DetailHeader({ title, backLabel }: { title: string; backLabel: string }) {
  return (
    <header className="relative flex min-h-14 items-center justify-center">
      <Link
        aria-label={backLabel}
        className={cn(
          buttonVariants({ variant: 'text-neutral', size: 'icon' }),
          'type-section-title absolute left-0',
        )}
        to={APP_ROUTE_PATHS.journalList}
      >
        <span aria-hidden="true">←</span>
      </Link>
      <h1 className="type-content-title text-foreground">{title}</h1>
    </header>
  );
}

/** 로딩·없음처럼 행동이 없거나 보조 행동뿐인 상태 면. 복구 가능한 오류는 ErrorState를 쓴다. */
function DetailStatus({
  title,
  description,
  action,
}: {
  title?: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center" role="status">
      {title ? <p className="type-content-title text-foreground">{title}</p> : null}
      <p className="type-supporting text-text-secondary break-keep">{description}</p>
      {action}
    </Card>
  );
}

function DetailError({ error, onRetry }: { error: JournalReadError; onRetry: () => void }) {
  const { t } = useTranslation();
  if (error.code === 'journal_not_found') {
    return (
      <DetailStatus
        description={t('app.journalDetail.notFound.description')}
        action={
          <Link className={buttonVariants({ variant: 'text' })} to={APP_ROUTE_PATHS.journalList}>
            {t('app.journalDetail.notFound.listAction')}
          </Link>
        }
      />
    );
  }

  const copy =
    error.code === 'invalid_request'
      ? {
          title: t('app.journalDetail.invalidRequest.title'),
          description: t('app.journalDetail.invalidRequest.description'),
          retry: t('app.journalDetail.invalidRequest.retry'),
        }
      : error.code === 'invalid_result'
        ? {
            title: t('app.journalDetail.invalidResult.title'),
            description: t('app.journalDetail.invalidResult.description'),
            retry: t('app.journalDetail.invalidResult.retry'),
          }
        : {
            title: t('app.journalDetail.error.title'),
            description: t('app.journalDetail.error.description'),
            retry: t('app.journalDetail.error.retry'),
          };

  return (
    <Card>
      <ErrorState
        title={copy.title}
        description={copy.description}
        // 오류 화면에서는 복구가 유일한 행동이라 진한 버튼 1개(화면당 1개 원칙 유지).
        action={
          <Button type="button" onClick={onRetry}>
            {copy.retry}
          </Button>
        }
      />
    </Card>
  );
}

/** 메타는 배지가 아닌 텍스트 InfoList다. 값 색으로 감정·행동에 의미를 싣지 않는다. */
function JournalMetadata({ detail }: { detail: JournalDetailViewModel }) {
  const { t, locale } = useTranslation();
  return (
    <Card className="px-5 pt-5 pb-2 sm:px-6">
      <InfoList>
        <InfoRow label={t('app.journalDetail.metadata.recordType')}>
          <RecordTagText kind="entryType" value={detail.type} />
        </InfoRow>
        <InfoRow label={t('app.journalDetail.metadata.recordedAt')}>
          <time dateTime={detail.occurredAt}>
            {formatJournalOccurredAt(detail.occurredAt, detail.timeZone, locale)}
          </time>
        </InfoRow>
        <InfoRow label={t('app.journalDetail.metadata.timeZone')}>{detail.timeZone}</InfoRow>
        {detail.type === 'investment' && (
          <>
            <InfoRow label={t('app.journalDetail.metadata.pastAction')}>
              <RecordTagText kind="action" value={detail.action} />
            </InfoRow>
            {detail.emotion !== null && (
              <InfoRow label={t('app.journalDetail.metadata.pastEmotion')}>
                <RecordTagText kind="emotion" value={detail.emotion} />
              </InfoRow>
            )}
          </>
        )}
        {/* ISO 시각은 길어 좁은 폭에서 값이 깨지므로 라벨 위·값 아래로 둔다. */}
        <InfoRow layout="stack" label={t('app.journalDetail.metadata.createdAt')}>
          <time dateTime={detail.createdAt}>{detail.createdAt}</time>
        </InfoRow>
        <InfoRow layout="stack" label={t('app.journalDetail.metadata.updatedAt')}>
          <time dateTime={detail.updatedAt}>{detail.updatedAt}</time>
        </InfoRow>
      </InfoList>
    </Card>
  );
}

/** 사용자가 쓴 본문: reading 16/27, 줄바꿈 보존(#46 의도), 한글은 어절 단위로 줄바꿈하고(break-keep), 긴 무공백 문자열은 끊어 넘침을 막는다. */
function ReadingText({ children }: { children: ReactNode }) {
  return (
    <p
      className={cn(
        'type-reading text-foreground min-w-0 wrap-break-word break-keep whitespace-pre-wrap',
        READING_MEASURE_CLASS,
      )}
    >
      {children}
    </p>
  );
}

function InvestmentDetail({
  detail,
}: {
  detail: Extract<JournalDetailViewModel, { type: 'investment' }>;
}) {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col gap-3" aria-labelledby="journal-detail-investment-reasoning">
      <h2 id="journal-detail-investment-reasoning" className="type-section-title text-foreground">
        {t('app.journalDetail.investment.reasoningHeading')}
      </h2>
      <Card className="p-5 sm:p-6">
        <ReadingText>{detail.reasoning}</ReadingText>
      </Card>
    </section>
  );
}

function StudyDetail({ detail }: { detail: Extract<JournalDetailViewModel, { type: 'study' }> }) {
  const { t } = useTranslation();
  return (
    <>
      <section className="flex flex-col gap-3" aria-labelledby="journal-detail-study-content">
        <h2 id="journal-detail-study-content" className="type-section-title text-foreground">
          {t('app.journalDetail.study.keyContentHeading')}
        </h2>
        <Card className="p-5 sm:p-6">
          <ReadingText>{detail.keyContent}</ReadingText>
        </Card>
      </section>

      <section
        className="flex flex-col gap-3"
        aria-labelledby="journal-detail-study-open-questions"
      >
        <h2 id="journal-detail-study-open-questions" className="type-section-title text-foreground">
          {t('app.journalDetail.study.openQuestionsHeading')}
        </h2>
        {detail.openQuestions.length === 0 ? (
          <p className="type-supporting text-text-secondary">
            {t('app.journalDetail.study.noOpenQuestions')}
          </p>
        ) : (
          <Card className="px-5 py-2 sm:px-6">
            <ol className="divide-border marker:text-text-secondary list-decimal divide-y pl-5">
              {detail.openQuestions.map((question, index) => (
                <li
                  className="type-body text-foreground min-w-0 py-3 pl-2 wrap-anywhere"
                  key={`${index}-${question}`}
                >
                  {question}
                </li>
              ))}
            </ol>
          </Card>
        )}
      </section>
    </>
  );
}

function JournalDetailContent({ detail }: { detail: JournalDetailViewModel }) {
  const { t } = useTranslation();
  const title = detail.type === 'investment' ? detail.assetName : detail.title;

  return (
    <Stack gap="section">
      <h2
        id="journal-detail-title"
        className="type-page-title text-foreground min-w-0 wrap-anywhere"
      >
        {title}
      </h2>

      {detail.type === 'investment' ? (
        <InvestmentDetail detail={detail} />
      ) : (
        <StudyDetail detail={detail} />
      )}

      <JournalMetadata detail={detail} />

      {/* 복기는 읽기가 끝난 뒤의 선택 행동이라 subtle(진한 버튼 0개). 문구는 그대로 유지한다. */}
      <nav aria-label={t('app.journalDetail.headerTitle')}>
        <Link
          className={cn(
            buttonVariants({ variant: 'subtle' }),
            'h-auto min-h-12 py-2 text-center whitespace-normal',
          )}
          to={buildAppJournalReviewPath(detail.journalId, detail.revision)}
        >
          {t('app.journalDetail.navigation.review')}
        </Link>
      </nav>
    </Stack>
  );
}

export interface JournalDetailPageProps {
  readPort?: JournalReadPort;
}

export function JournalDetailPage({ readPort }: JournalDetailPageProps) {
  const { id } = useParams();
  const contextPort = useJournalReadPort();
  const { state, retry } = useJournalDetail(readPort ?? contextPort, id);
  const { t } = useTranslation();
  const headerTitle =
    state.error?.code === 'journal_not_found'
      ? t('app.journalDetail.notFound.heading')
      : t('app.journalDetail.headerTitle');

  return (
    <Stack gap="group" className="min-h-full px-5 pt-4 pb-10 sm:px-6 sm:pt-6">
      <DetailHeader title={headerTitle} backLabel={t('app.journalDetail.backLabel')} />
      {state.status === 'loading' && (
        <DetailStatus
          title={t('app.journalDetail.loading.title')}
          description={t('app.journalDetail.loading.description')}
        />
      )}
      {state.status === 'error' && state.error && (
        <DetailError error={state.error} onRetry={retry} />
      )}
      {state.status === 'success' && state.data && (
        <>
          <JournalDeleteControl
            key={`delete:${state.data.journalId}:${state.data.revision}`}
            detail={state.data}
            onReload={retry}
          />
          <JournalEditor
            key={`${state.data.journalId}:${state.data.revision}`}
            detail={state.data}
            onSaved={retry}
          />
          <div className="pt-4">
            <JournalDetailContent detail={state.data} />
          </div>
        </>
      )}
    </Stack>
  );
}
