import { createContext, useContext, useState, ReactNode } from 'react';

interface UnsavedChangesContextType {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  saveCallback: (() => void) | null;
  setSaveCallback: (callback: (() => void) | null) => void;
  discardCallback: (() => void) | null;
  setDiscardCallback: (callback: (() => void) | null) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType>({
  hasUnsavedChanges: false,
  setHasUnsavedChanges: () => {},
  saveCallback: null,
  setSaveCallback: () => {},
  discardCallback: null,
  setDiscardCallback: () => {},
});

export function useUnsavedChanges() {
  return useContext(UnsavedChangesContext);
}

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveCallback, setSaveCallback] = useState<(() => void) | null>(null);
  const [discardCallback, setDiscardCallback] = useState<(() => void) | null>(null);

  return (
    <UnsavedChangesContext.Provider
      value={{
        hasUnsavedChanges,
        setHasUnsavedChanges,
        saveCallback,
        setSaveCallback,
        discardCallback,
        setDiscardCallback,
      }}
    >
      {children}
    </UnsavedChangesContext.Provider>
  );
}
