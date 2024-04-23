import { useCallback, useEffect, useState } from "react";

export default function useInViewport() {
  const [isInViewport, setIsInViewport] = useState(false);
  const [refElement, setRefElement] = useState<HTMLElement | null>(null);

  const setRef = useCallback((node: HTMLElement | null) => {
    if (node !== null) {
      setRefElement(node);
    }
  }, []);

  useEffect(() => {
    if (refElement) {
      const observer = new IntersectionObserver(([entry]) =>
        setIsInViewport(entry.isIntersecting),
      );
      observer.observe(refElement);

      return () => {
        if (observer) observer.disconnect();
      };
    }
  }, [refElement]);

  return { isInViewport, ref: setRef };
}
