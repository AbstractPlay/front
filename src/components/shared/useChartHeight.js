import { useEffect, useState } from "react";

export function useChartHeight(desktop = 500, mobile = 350) {
  const [height, setHeight] = useState(desktop);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setHeight(media.matches ? mobile : desktop);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [desktop, mobile]);

  return height;
}
