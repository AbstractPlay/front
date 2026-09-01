import { useCallback, useState } from "react";

export function useVariantSelectionValidity() {
  const [variantsValid, setVariantsValid] = useState(true);

  const onValidityChange = useCallback((valid) => {
    setVariantsValid(valid);
  }, []);

  const resetVariantValidity = useCallback(() => {
    setVariantsValid(true);
  }, []);

  return { variantsValid, onValidityChange, resetVariantValidity };
}
