"use client";

import { ReactNode } from "react";
import { GuideProvider as Provider } from "@/hooks/useGuide";
import GuideEngine from "./GuideEngine";

export default function GuideProvider({ children }: { children: ReactNode }) {
  return (
    <Provider>
      {children}
      <GuideEngine />
    </Provider>
  );
}
