"use client";

import { motion } from "framer-motion";

type CookieConsentProps = {
  storageAvailable: boolean;
  onDecision: (decision: "accepted" | "rejected") => void;
  revealFromHandoff: boolean;
};

export function CookieConsent({ storageAvailable, onDecision, revealFromHandoff }: CookieConsentProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[81] flex items-center justify-center bg-[rgba(9,10,14,0.72)] px-4 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="glass-panel noise-mask relative max-w-xl rounded-[36px] p-8 shadow-[0_30px_110px_rgba(52,34,20,0.18)]"
        initial={
          revealFromHandoff
            ? { scale: 0.12, y: 0, opacity: 0, rotate: -2, filter: "blur(14px)" }
            : { scale: 0.9, y: 28, opacity: 0 }
        }
        animate={{ scale: 1, y: 0, opacity: 1, rotate: 0, filter: "blur(0px)" }}
        transition={
          revealFromHandoff
            ? { type: "spring", stiffness: 160, damping: 18, mass: 0.8 }
            : { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
        }
        style={{ transformOrigin: "center center" }}
      >
        <h2 className="text-3xl font-semibold text-ink md:text-4xl">Anonymous insight only.</h2>
        <p className="mt-4 text-sm leading-7 text-ink/72 md:text-base">
          Cookies are used purely to improve the website experience through anonymous analytics like
          visits, session length, and section engagement. No personal data is collected.
        </p>
        {!storageAvailable ? (
          <p className="mt-4 rounded-2xl border border-amber-300/20 bg-[rgba(10,10,14,0.34)] px-4 py-3 text-sm text-ink/72">
            Local storage is unavailable in this browser, so analytics will remain disabled even if
            you accept.
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button className="glass-button flex-1" onClick={() => onDecision("accepted")} type="button">
            Accept
          </button>
          <button
            className="glass-button-muted flex-1"
            onClick={() => onDecision("rejected")}
            type="button"
          >
            Reject
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
