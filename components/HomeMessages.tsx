"use client";

import { useEffect, useState } from "react";
import { getLocalScore } from "@/lib/progress";
import { checkReturnAfter24h } from "@/lib/contextualMessages";
import ToastMessage from "./ToastMessage";

export default function HomeMessages() {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const score = getLocalScore();
    const msg = checkReturnAfter24h(score);
    if (msg) setTimeout(() => setToast(msg), 1200);
  }, []);

  if (!toast) return null;
  return <ToastMessage text={toast} onClose={() => setToast(null)} />;
}
