import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// 중첩 Dialog가 비-LIFO로 닫혀도 배경 스크롤이 먼저 풀리지 않도록 잠금을 카운트한다.
let scrollLockCount = 0;
let scrollLockPrevious = '';

function lockBodyScroll() {
  if (scrollLockCount === 0) {
    scrollLockPrevious = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  scrollLockCount += 1;
}

function unlockBodyScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) document.body.style.overflow = scrollLockPrevious;
}

type DialogProps = {
  open: boolean;
  /** 취소·ESC·닫기 — 부모가 `open`을 false로 내린다(제어 컴포넌트). */
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  cancelLabel: string;
  /** 없으면 취소(닫기) 버튼만 보인다. */
  confirmLabel?: string;
  onConfirm?: () => void;
  /**
   * 파괴적 확인(삭제 등). 확인 버튼이 danger-strong이 되고, 열릴 때 초기 포커스가 취소에 간다.
   * role은 `alertdialog`로 바뀐다.
   */
  destructive?: boolean;
  className?: string;
};

/**
 * Modal / Bottom Sheet (한 컴포넌트, 반응형): 폰 폭에서는 하단 시트(상단 반경 24),
 * `sm` 이상에서는 가운데 모달.
 *
 * native `<dialog>` + `showModal()`: 배경 비활성(inert)·top layer·`::backdrop`·ESC(cancel)을
 * 브라우저가 처리한다. 추가로 직접 보장하는 것:
 * - 초기 포커스(파괴적이면 취소, 아니면 `[data-autofocus]` → 첫 포커스 가능 요소)
 * - Tab/Shift+Tab 순환(브라우저 UI로 빠지지 않게)
 * - 닫힐 때 열기 전 포커스 요소(트리거)로 복귀
 * - 열린 동안 body 스크롤 잠금, 내용은 내부 스크롤(overscroll-contain)
 * `showModal`이 없는 환경(jsdom 등)에서는 `open` 속성 폴백으로 같은 키보드 동작을 유지한다.
 * 닫기는 항상 취소 버튼/ESC만 — 배경 클릭으로는 닫지 않는다(작성 중 데이터 보호).
 */
function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  cancelLabel,
  confirmLabel,
  onConfirm,
  destructive = false,
  className,
}: DialogProps) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();
  const nativeModal = React.useRef(false);
  const openRef = React.useRef(open);
  React.useEffect(() => {
    openRef.current = open;
  }, [open]);

  React.useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;

    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    nativeModal.current = typeof dialog.showModal === 'function';
    if (nativeModal.current) {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }

    lockBodyScroll();

    const target = destructive
      ? cancelRef.current
      : (dialog.querySelector<HTMLElement>('[data-autofocus]') ??
        dialog.querySelector<HTMLElement>(FOCUSABLE));
    (target ?? dialog).focus();

    return () => {
      unlockBodyScroll();
      if (nativeModal.current && typeof dialog.close === 'function') {
        if (dialog.open) dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open, destructive]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'Escape' && !nativeModal.current) {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const dialog = event.currentTarget;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <dialog
      ref={ref}
      data-slot="dialog"
      role={destructive ? 'alertdialog' : undefined}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      tabIndex={-1}
      // native ESC: 기본 닫힘을 막고 부모 상태로 닫는다(제어 컴포넌트와 상태 일치).
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // 연속 ESC 등으로 브라우저가 cancel 취소를 무시하고 닫아도, 부모가 아직 열어두고 있으면 다시 연다.
      onClose={(event) => {
        const dialog = event.currentTarget;
        if (openRef.current && nativeModal.current && !dialog.open) dialog.showModal();
      }}
      onKeyDown={handleKeyDown}
      className={cn(
        'bg-card text-card-foreground shadow-overlay backdrop:bg-scrim rounded-t-sheet m-0 mt-auto w-full max-w-none flex-col overflow-hidden p-0 open:flex',
        'sm:rounded-card max-h-[85dvh] sm:m-auto sm:max-w-md',
        className,
      )}
    >
      {open ? (
        <>
          <div className="flex flex-col gap-2 px-5 pt-5">
            <h2 id={titleId} className="type-section-title text-foreground">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="type-body text-text-body">
                {description}
              </p>
            ) : null}
          </div>
          {children ? (
            <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pt-4">{children}</div>
          ) : null}
          <div className="flex gap-2 px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:justify-end">
            {/* 취소는 항상 왼쪽, 확인은 오른쪽. */}
            <Button
              ref={cancelRef}
              type="button"
              variant="neutral"
              className="flex-1 sm:flex-none"
              onClick={onClose}
            >
              {cancelLabel}
            </Button>
            {confirmLabel ? (
              <Button
                type="button"
                variant={destructive ? 'danger-strong' : 'strong'}
                className="flex-1 sm:flex-none"
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            ) : null}
          </div>
        </>
      ) : null}
    </dialog>
  );
}

export { Dialog };
