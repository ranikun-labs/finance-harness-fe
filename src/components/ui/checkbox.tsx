import { Check } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

type CheckboxProps = Omit<React.ComponentProps<'input'>, 'type' | 'children'> & {
  /** 보이는 라벨. native <label>로 입력과 연결되므로 라벨 클릭·SR 이름이 그대로 동작한다. */
  label: React.ReactNode;
  /** 라벨 아래 보조 설명. aria-describedby로 연결된다. */
  description?: React.ReactNode;
};

/**
 * native `<input type="checkbox">` + `<label>`. 입력은 시각적으로만 숨기고(sr-only) 접근성 트리·
 * 키보드(Space)·폼 제출은 브라우저 기본 동작을 그대로 쓴다. 터치 영역은 label 전체(최소 44).
 * 상태는 체크 아이콘 + 면 색으로 전달한다(색만 사용하지 않음).
 */
function Checkbox({ label, description, className, id, disabled, ...props }: CheckboxProps) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  const descriptionId = description ? `${inputId}-description` : undefined;

  // 설명은 <label> 밖에 둔다 — 안에 두면 접근 가능한 이름(name)에 설명이 섞여 읽힌다.
  return (
    <div data-slot="checkbox" className={cn(disabled && 'opacity-50', className)}>
      <label
        htmlFor={inputId}
        className={cn(
          'relative flex min-h-11 items-start gap-3 py-2.5',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        )}
      >
        <input
          id={inputId}
          type="checkbox"
          disabled={disabled}
          aria-describedby={descriptionId}
          className="peer sr-only"
          {...props}
        />
        <span
          aria-hidden="true"
          className="border-input bg-card text-primary-foreground peer-checked:border-primary peer-checked:bg-primary rounded-badge peer-focus-visible:outline-ring mt-px flex size-6 shrink-0 items-center justify-center border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100"
        >
          <Check className="size-4" strokeWidth={3} />
        </span>
        <span className="type-body text-foreground min-w-0">{label}</span>
      </label>
      {description ? (
        <p id={descriptionId} className="type-supporting text-text-secondary -mt-1.5 pb-2 pl-9">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export { Checkbox };
