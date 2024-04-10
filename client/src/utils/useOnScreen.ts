import { RefObject, useEffect, useState } from "react";

export default function useOnScreen(ref: RefObject<HTMLElement>) {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setIntersecting(entry.isIntersecting),
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref.current, ref]);

  return isIntersecting;
}
