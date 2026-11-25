import { useContext } from 'react';
import { UNSAFE_DataRouterContext } from 'react-router';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useLeaveGuard, type LeaveGuardWhen } from '@/components/common/useLeaveGuard';
import { useTranslation } from '@/i18n/I18nContext';

function ActiveLeaveGuard({ when, saving }: { when: LeaveGuardWhen; saving: boolean }) {
  const { t } = useTranslation();
  const { blocked, stay, leave } = useLeaveGuard(when);
  // 저장 중에는 나가기를 주지 않는다: 저장 결과가 이 화면에서 확정되기 전에 떠나면 결과를 보지 못한다.
  if (saving) {
    return (
      <ConfirmDialog
        open={blocked}
        title={t('common.leaveGuard.saving.title')}
        description={t('common.leaveGuard.saving.description')}
        stayLabel={t('common.leaveGuard.saving.stay')}
        onStay={stay}
      />
    );
  }
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

/**
 * 작성·복기 화면에 한 번 둔다. `when`이 참인 동안 이탈 시 같은 확인이 뜬다.
 * `saving`이 참이면 저장이 끝날 때까지 이동을 막고, 나가기 없이 기다리라는 안내만 띄운다.
 */
export function LeaveGuard({ when, saving = false }: { when: LeaveGuardWhen; saving?: boolean }) {
  const dataRouter = useContext(UNSAFE_DataRouterContext);
  return dataRouter ? <ActiveLeaveGuard when={when} saving={saving} /> : null;
}
