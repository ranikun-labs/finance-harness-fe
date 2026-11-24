import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Dialog } from '@/components/ui/dialog';
import '@/styles/globals.css';

// Test-only fixture for the shared Dialog (native <dialog>). Served by the E2E dev server only.
function Harness() {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(0);
  return (
    <main style={{ padding: 24 }}>
      <button id="before">앞 버튼</button>
      <button id="trigger" onClick={() => setOpen(true)}>
        삭제 열기
      </button>
      <button id="after">뒤 버튼</button>
      <p data-testid="confirmed">{confirmed}</p>
      <div style={{ height: 2000 }} />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="기록을 삭제할까요?"
        description="삭제하면 되돌릴 수 없습니다."
        cancelLabel="취소"
        confirmLabel="삭제"
        destructive
        onConfirm={() => {
          setConfirmed((count) => count + 1);
          setOpen(false);
        }}
      />
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Harness />);
