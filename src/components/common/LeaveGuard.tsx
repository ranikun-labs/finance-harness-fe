import { useContext } from 'react';
import { UNSAFE_DataRouterContext } from 'react-router';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useLeaveGuard, type LeaveGuardWhen } from '@/components/common/useLeaveGuard';
import { useTranslation } from '@/i18n/I18nContext';

function ActiveLeaveGuard({ when }: { when: LeaveGuardWhen }) {
  const { t } = useTranslation();
  const { blocked, stay, leave } = useLeaveGuard(when);
  return (
    <ConfirmDialog
      open={blocked}
      title={t('common.leaveGuard.title')}
      description={t('common.leaveGuard.description')}
      stayLabel={t('common.leaveGuard.stay')}
      confirmLabel={t('common.leaveGuard.leave')}
      onStay={stay}
      onConfirm={leave}
    />
  );
}

/** 작성·복기 화면에 한 번 둔다. `when`이 참인 동안 이탈 시 같은 확인이 뜬다. */
export function LeaveGuard({ when }: { when: LeaveGuardWhen }) {
  const dataRouter = useContext(UNSAFE_DataRouterContext);
  return dataRouter ? <ActiveLeaveGuard when={when} /> : null;
}
