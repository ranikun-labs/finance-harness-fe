import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { AppRouter } from '@/app/AppRouter';
import '@/styles/globals.css';

// Test-only fixture: 비운영 참조 인증을 켜고 서버 응답 전체를 이 페이지 안의 fetch 대역으로 대신한다
// (수정·삭제·복원 UI는 이 인증 플래그 뒤에서만 나온다). 프로덕션 번들에 포함되지 않는다.
// 호출 기록은 `window.__lifecycleCalls`로 e2e가 읽는다. 실제 백엔드가 아니다.
const ID = '550e8400-e29b-41d4-a716-446655440000';
const calls: { method: string; path: string; body?: unknown }[] = [];
(window as unknown as { __lifecycleCalls: typeof calls }).__lifecycleCalls = calls;

const record = {
  journalId: ID,
  type: 'investment',
  revision: 3,
  occurredAt: '2026-08-12T14:30:15.123',
  timeZone: 'Asia/Seoul',
  createdAt: '2026-08-12T05:31:02.123Z',
  updatedAt: '2026-08-12T05:31:02.123Z',
  assetName: '반도체 기업 A',
  action: 'interest',
  reasoning: '수급 흐름을 확인한 뒤 지켜보기로 했다.',
  emotion: '확신',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function fakeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = new URL(typeof input === 'string' ? input : input.toString(), window.location.origin);
  const method = init?.method ?? 'GET';
  const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
  calls.push({ method, path: url.pathname, body });
  if (url.pathname === '/api/v1/auth/finance-reference/login') {
    return json({
      data: {
        accessToken: 'fixture-token',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 300_000).toISOString(),
      },
    });
  }
  if (url.pathname === '/finance/journals/deleted') {
    return json({
      items: [
        { journalId: ID, revision: 4, type: 'investment', deletedAt: '2026-11-11T07:00:00Z' },
      ],
      hasMore: false,
    });
  }
  if (url.pathname === '/finance/journals') {
    return json({
      items: [
        {
          journalId: ID,
          type: 'investment',
          occurredAt: record.occurredAt,
          timeZone: record.timeZone,
          assetName: record.assetName,
          action: record.action,
        },
      ],
      nextCursor: null,
    });
  }
  if (url.pathname === `/finance/journals/${ID}/delete`) {
    return json({ journalId: ID, revision: 4, state: 'deleted' });
  }
  if (url.pathname === `/finance/journals/${ID}`) return json(record);
  return json({ error: 'not_found' }, 404);
}

createRoot(document.getElementById('root')!).render(
  <MemoryRouter initialEntries={['/auth']}>
    <AppRouter financeReferenceAuthEnabled financeReferenceFetchImpl={fakeFetch} />
  </MemoryRouter>,
);
