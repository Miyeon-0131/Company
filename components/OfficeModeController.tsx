"use client";

import { useEffect } from "react";
import { useOfficeStore } from "@/lib/store";

/** 驱动员工移动插值与专注/休息倒计时 */
export default function OfficeModeController() {
  const officeMode = useOfficeStore((s) => s.officeMode);
  const tickMovement = useOfficeStore((s) => s.tickMovement);
  const tickModeTimer = useOfficeStore((s) => s.tickModeTimer);

  useEffect(() => {
    let last = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      tickMovement(dt);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [tickMovement]);

  useEffect(() => {
    if (officeMode === "normal") return;
    const id = setInterval(tickModeTimer, 1000);
    return () => clearInterval(id);
  }, [officeMode, tickModeTimer]);

  return null;
}
