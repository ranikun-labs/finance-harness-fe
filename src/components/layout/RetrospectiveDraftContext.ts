import { createContext, useContext } from 'react';

export const RetrospectiveDraftContext = createContext<{
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
}>({ dirty: false, setDirty: () => {} });

export const useRetrospectiveDraft = () => useContext(RetrospectiveDraftContext);
