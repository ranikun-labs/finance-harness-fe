import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

/*
 * Foundation v1 버튼 강조(emphasis): strong · subtle · neutral · text · text-neutral ·
 * danger-text · danger-strong. 진한(strong/danger-strong) 버튼은 화면당 1개가 원칙이다.
 * 기존 shadcn 이름(default/destructive/outline/secondary/ghost/link)은 alias로 남겨
 * 호출부를 깨지 않는다 — 신규 코드는 새 이름을 쓴다.
 *
 * 포커스: 전역 :focus-visible(2px brand + offset 2)을 그대로 쓰므로 outline-none을 두지 않는다.
 */
const emphasis = {
  strong: 'bg-primary text-primary-foreground hover:bg-brand-deep active:bg-brand-deep',
  subtle: 'bg-brand-subtle text-brand-deep hover:bg-brand-subtle/70',
  neutral: 'bg-control text-foreground hover:bg-control/70',
  text: 'text-primary hover:bg-brand-subtle',
  'text-neutral': 'text-text-secondary hover:bg-control',
  'danger-text': 'text-danger hover:bg-danger-bg',
  'danger-strong': 'bg-danger-solid text-on-danger-solid hover:opacity-90',
} as const;

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        ...emphasis,
        // --- 호환 alias (기존 호출부) ---
        default: emphasis.strong,
        destructive: emphasis['danger-strong'],
        secondary: emphasis.neutral,
        outline: emphasis.neutral,
        ghost: emphasis.text,
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        // 기본 컨트롤 높이 48.
        default: 'h-12 min-w-11 rounded-control px-4 text-[15px] leading-6 has-[>svg]:px-3',
        // 시각 36 + 조작 영역 44: ::after가 세로 4px씩 확장(36+8=44), 최소 너비 44.
        sm: "h-9 min-w-11 gap-1.5 rounded-control px-3 text-[13px] leading-[18px] after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] has-[>svg]:px-2.5",
        lg: 'h-[54px] min-w-11 rounded-control px-6 text-[17px] has-[>svg]:px-4',
        // 아이콘 버튼은 터치 최소 44.
        icon: 'size-11 rounded-control',
      },
    },
    defaultVariants: {
      variant: 'strong',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
