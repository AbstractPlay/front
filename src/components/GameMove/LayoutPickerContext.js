import { createContext, useContext } from "react";

const LayoutPickerContext = createContext(null);

export function LayoutPickerProvider({ value, children }) {
  return (
    <LayoutPickerContext.Provider value={value}>
      {children}
    </LayoutPickerContext.Provider>
  );
}

export function useLayoutPicker() {
  const value = useContext(LayoutPickerContext);
  if (!value) {
    throw new Error("useLayoutPicker must be used within LayoutPickerProvider");
  }
  return value;
}
