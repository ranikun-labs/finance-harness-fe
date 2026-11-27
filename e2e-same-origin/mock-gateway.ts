// In-memory stand-in for the shared Gateway + Finance reference auth + Finance BE, used only by the
// same-origin e2e. It enforces bearer ownership on journals (another account gets 404) and the
// reference signup/login rules the platform enforces. It is not the real Gateway.
import { randomUUID } from 'node:crypto';

interface Account {
  userId: string;
  password: string;
}

interface Journal {
  journalId: string;
  owner: string;
  type: 'investment';
  occurredAt: string;
  timeZone: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  assetName: string;
  action: string;
  reasoning: string;
  deleted: boolean;
}

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ACCESS_TOKEN_TTL_MS = 300_000;

function envelope(status: number, message: string, data?: unknown): Response {
  const body = data === undefined ? { status, message } : { status, message, data };
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function plain(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function bearerOf(headers: Headers): string | undefined {
  const value = headers.get('authorization') ?? '';
  return value.startsWith('Bearer ') ? value.slice(7) : undefined;
}

/** Local date-time in the strict backend wire shape: yyyy-MM-ddTHH:mm:ss.SSS. */
function toLocalDateTime(value: string): string {
  const trimmed = value.length === 16 ? `${value}:00` : value;
  return /\.\d{3}$/.test(trimmed) ? trimmed : `${trimmed.slice(0, 19)}.000`;
}

export function createMockGateway() {
  const accounts = new Map<string, Account>();
  const tokens = new Map<string, { userId: string; expiresAt: number }>();
  const journals = new Map<string, Journal>();
  const idempotent = new Map<string, { fingerprint: string; journalId: string }>();
  const requestLog: string[] = [];

  function issueToken(userId: string) {
    const accessToken = `fat-${randomUUID()}`;
    const expiresAtMs = Date.now() + ACCESS_TOKEN_TTL_MS;
    tokens.set(accessToken, { userId, expiresAt: expiresAtMs });
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresAt: new Date(expiresAtMs).toISOString().replace(/\.\d{3}Z$/, '.000Z'),
    };
  }

  function ownerOf(headers: Headers): string | undefined {
    const token = bearerOf(headers);
    if (!token) return undefined;
    const entry = tokens.get(token);
    if (!entry || entry.expiresAt <= Date.now()) return undefined;
    return entry.userId;
  }

  function visibleJournal(id: string, owner: string): Journal | undefined {
    const journal = journals.get(id);
    return journal && journal.owner === owner ? journal : undefined;
  }

  function toDetail(journal: Journal) {
    return {
      journalId: journal.journalId,
      type: journal.type,
      occurredAt: journal.occurredAt,
      timeZone: journal.timeZone,
      createdAt: journal.createdAt,
      updatedAt: journal.updatedAt,
      revision: journal.revision,
      assetName: journal.assetName,
      action: journal.action,
      reasoning: journal.reasoning,
      emotion: null,
    };
  }

  async function handle(url: string, init: RequestInit): Promise<Response> {
    const { pathname, searchParams } = new URL(url);
    const method = (init.method ?? 'GET').toUpperCase();
    const headers = new Headers(init.headers);
    const text = init.body ? new TextDecoder().decode(init.body as ArrayBuffer) : '';
    requestLog.push(`${method} ${pathname}`);

    const parseBody = (): Record<string, unknown> => {
      try {
        const value: unknown = JSON.parse(text);
        return typeof value === 'object' && value !== null
          ? (value as Record<string, unknown>)
          : {};
      } catch {
        return {};
      }
    };

    if (method === 'POST' && pathname === '/api/v1/auth/finance-reference/signup') {
      const body = parseBody();
      const email = String(body.email ?? '')
        .trim()
        .toLowerCase();
      const password = String(body.password ?? '');
      const hasLetter = /[A-Za-z]/.test(password);
      const hasDigit = /[0-9]/.test(password);
      if (
        !email.includes('@') ||
        password.length < 10 ||
        password.length > 72 ||
        !hasLetter ||
        !hasDigit
      ) {
        return envelope(400, 'Invalid signup request.');
      }
      if (!accounts.has(email)) {
        accounts.set(email, { userId: email, password });
      }
      return envelope(202, 'Signup request processed.');
    }

    if (method === 'POST' && pathname === '/api/v1/auth/finance-reference/login') {
      const body = parseBody();
      const account = accounts.get(
        String(body.userId ?? '')
          .trim()
          .toLowerCase(),
      );
      if (!account || account.password !== body.password) {
        return envelope(401, 'Invalid credentials.');
      }
      return envelope(200, 'ok', issueToken(account.userId));
    }

    if (!pathname.startsWith('/api/finance/journals')) {
      // A misrouted upstream answers with an HTML page. The edge must not pass it through.
      return new Response('<!doctype html><html><body>Gateway 404 page</body></html>', {
        status: 404,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }

    const owner = ownerOf(headers);
    if (!owner) return envelope(401, 'Unauthorized.');

    if (pathname === '/api/finance/journals' && method === 'POST') {
      const key = headers.get('idempotency-key') ?? '';
      if (key === '') return envelope(400, 'Idempotency-Key is required.');
      const body = parseBody();
      const fingerprint = JSON.stringify(body);
      const replay = idempotent.get(`${owner}:${key}`);
      if (replay) {
        return replay.fingerprint === fingerprint
          ? plain(201, { journalId: replay.journalId })
          : envelope(409, 'Idempotency conflict.');
      }
      const now = new Date().toISOString();
      const journal: Journal = {
        journalId: randomUUID(),
        owner,
        type: 'investment',
        occurredAt: toLocalDateTime(String(body.occurredAt ?? '')),
        timeZone: String(body.timeZone ?? 'Asia/Seoul'),
        createdAt: now,
        updatedAt: now,
        revision: 0,
        assetName: String(body.assetName ?? ''),
        action: String(body.action ?? 'watching'),
        reasoning: String(body.reasoning ?? ''),
        deleted: false,
      };
      journals.set(journal.journalId, journal);
      idempotent.set(`${owner}:${key}`, { fingerprint, journalId: journal.journalId });
      return plain(201, { journalId: journal.journalId });
    }

    if (pathname === '/api/finance/journals' && method === 'GET') {
      const items = [...journals.values()]
        .filter((journal) => journal.owner === owner && !journal.deleted)
        .map((journal) => ({
          journalId: journal.journalId,
          type: journal.type,
          occurredAt: journal.occurredAt,
          timeZone: journal.timeZone,
          assetName: journal.assetName,
          action: journal.action,
        }));
      const limit = Number(searchParams.get('limit') ?? '20');
      return plain(200, { items: items.slice(0, limit), nextCursor: null });
    }

    const detailMatch = /^\/api\/finance\/journals\/([^/]+)$/.exec(pathname);
    if (detailMatch && method === 'GET') {
      const id = detailMatch[1] ?? '';
      const journal = UUID.test(id) ? visibleJournal(id, owner) : undefined;
      if (!journal || journal.deleted) return envelope(404, 'Journal not found.');
      return plain(200, toDetail(journal));
    }

    return envelope(404, 'Not found.');
  }

  return {
    fetch: handle,
    requestLog,
  };
}
