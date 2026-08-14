import { createServer } from 'node:http';
import { spawn } from 'node:child_process';

const PORT = 4173;

const PRIMARY_JOURNAL_ID = '550e8400-e29b-41d4-a716-446655440000';
const SECOND_JOURNAL_ID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const STUDY_JOURNAL_ID = '7d444840-9dc0-11d1-b245-5ffdce74fad2';

const DETAILS = {
  [PRIMARY_JOURNAL_ID]: {
    journalId: PRIMARY_JOURNAL_ID,
    type: 'investment',
    occurredAt: '2026-08-12T14:30:15.123',
    timeZone: 'Asia/Seoul',
    createdAt: '2026-08-12T05:31:02.123Z',
    updatedAt: '2026-08-12T05:31:02.123Z',
    assetName: '반도체 기업 A',
    action: 'interest',
    reasoning: 'HBM 수요와 외국인 수급 흐름을 확인한 뒤 지켜보기로 했다.',
    emotion: '확신',
  },
  [SECOND_JOURNAL_ID]: {
    journalId: SECOND_JOURNAL_ID,
    type: 'investment',
    occurredAt: '2026-08-11T10:15:00.000',
    timeZone: 'Asia/Seoul',
    createdAt: '2026-08-11T01:15:00.000Z',
    updatedAt: '2026-08-11T01:15:00.000Z',
    assetName: '배터리 기업 C',
    action: 'watching',
    reasoning: '정책 불확실성이 남아 있어 추가 확인 전에는 지켜보기로 했다.',
    emotion: '불안',
  },
  [STUDY_JOURNAL_ID]: {
    journalId: STUDY_JOURNAL_ID,
    type: 'study',
    occurredAt: '2026-08-10T09:00:00.000',
    timeZone: 'Asia/Seoul',
    createdAt: '2026-08-10T00:00:00.000Z',
    updatedAt: '2026-08-10T00:00:00.000Z',
    title: '월말 리밸런싱',
    keyContent: '기관은 벤치마크 대비 비중을 조정하기 위해 월말 수급을 바꿀 수 있다.',
    openQuestions: ['외국인 수급 흐름을 다시 확인한다', '다음 실적 발표 일정을 확인한다'],
  },
};

const LIST_ITEMS = [
  {
    journalId: PRIMARY_JOURNAL_ID,
    type: 'investment',
    occurredAt: '2026-08-12T14:30:15.123',
    timeZone: 'Asia/Seoul',
    assetName: '반도체 기업 A',
    action: 'interest',
  },
  {
    journalId: SECOND_JOURNAL_ID,
    type: 'investment',
    occurredAt: '2026-08-11T10:15:00.000',
    timeZone: 'Asia/Seoul',
    assetName: '배터리 기업 C',
    action: 'watching',
  },
  {
    journalId: STUDY_JOURNAL_ID,
    type: 'study',
    occurredAt: '2026-08-10T09:00:00.000',
    timeZone: 'Asia/Seoul',
    title: '월말 리밸런싱',
  },
];

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

const apiServer = createServer((req, res) => {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'method_not_allowed' });
    return;
  }

  let url;
  try {
    url = new URL(req.url ?? '/', 'http://finance-e2e');
  } catch {
    sendJson(res, 400, { error: 'invalid_request' });
    return;
  }

  if (url.pathname === '/finance/journals') {
    sendJson(res, 200, { items: LIST_ITEMS, nextCursor: null });
    return;
  }

  const prefix = '/finance/journals/';
  if (url.pathname.startsWith(prefix)) {
    let journalId;
    try {
      journalId = decodeURIComponent(url.pathname.slice(prefix.length));
    } catch {
      sendJson(res, 400, { error: 'invalid_request' });
      return;
    }
    const detail = DETAILS[journalId];
    if (!detail) {
      sendJson(res, 404, { error: 'journal_not_found' });
      return;
    }
    sendJson(res, 200, detail);
    return;
  }

  sendJson(res, 404, { error: 'not_found' });
});

apiServer.listen(0, '127.0.0.1', () => {
  const address = apiServer.address();
  const apiPort = typeof address === 'object' && address !== null ? address.port : 0;
  const vite = spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT)],
    {
      env: { ...process.env, FINANCE_API_PROXY_TARGET: `http://127.0.0.1:${apiPort}` },
      stdio: 'inherit',
    },
  );

  const stop = () => {
    vite.kill('SIGTERM');
    apiServer.close();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  vite.once('exit', (code) => {
    apiServer.close();
    process.exit(code ?? 1);
  });
});
