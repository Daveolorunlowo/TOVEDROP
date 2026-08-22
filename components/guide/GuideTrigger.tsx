"use client";

import { useEffect } from "react";
import { useGuide } from "@/hooks/useGuide";

export function GuideTrigger({ pageKey }: { pageKey: string }) {
  const { checkAndStartGuide } = useGuide();

  useEffect(() => {
    checkAndStartGuide(pageKey);
  }, [pageKey, checkAndStartGuide]);

  return null;
}
