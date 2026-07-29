import { useEffect, useState } from "react";

/**
 * Height in px that the on-screen keyboard covers at the bottom of the layout
 * viewport. iOS keeps `window.innerHeight` fixed and only shrinks the visual
 * viewport, so fixed-position UI must be offset manually. Android resizes the
 * layout viewport instead, which yields 0 here and needs no offset.
 */
export function useKeyboardInset(enabled = true): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setInset(0);
      return;
    }
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const overlap = window.innerHeight - (vv.height + vv.offsetTop);
      // Small deltas come from browser chrome collapsing, not a keyboard.
      setInset(overlap > 80 ? Math.round(overlap) : 0);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [enabled]);

  return inset;
}
