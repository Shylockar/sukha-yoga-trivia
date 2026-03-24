"use client";

import { useEffect, useState } from "react";
import { getLocalScore, getRegisteredUser } from "@/lib/progress";
import { checkReturnAfter24h } from "@/lib/contextualMessages";
import ToastMessage from "./ToastMessage";
import WelcomeModal from "./WelcomeModal";

const WELCOME_SEEN_KEY = "sukha_welcome_seen";

export default function HomeMessages() {
  const [toast, setToast] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Welcome modal: first-time unregistered users only
    const alreadySeen = localStorage.getItem(WELCOME_SEEN_KEY) === "1";
    const isRegistered = !!getRegisteredUser();
    if (!alreadySeen && !isRegistered) {
      localStorage.setItem(WELCOME_SEEN_KEY, "1");
      setShowWelcome(true);
      return; // don't show return-toast on same render
    }

    // Return after 24h toast
    const score = getLocalScore();
    const msg = checkReturnAfter24h(score);
    if (msg) setTimeout(() => setToast(msg), 1200);
  }, []);

  return (
    <>
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      {toast && <ToastMessage text={toast} onClose={() => setToast(null)} />}
    </>
  );
}
