"use client";

import { useEffect, useRef } from "react";
import { EMPLOYEES } from "@/lib/employees";
import {
  IDLE_ACTIVITY_CYCLE_MS,
  pickIdleActivity,
} from "@/lib/idleActivity";
import { useOfficeStore } from "@/lib/store";

function isAtDesk(
  x: number,
  z: number,
  deskX: number,
  deskZ: number
): boolean {
  return Math.hypot(x - deskX, z - deskZ) < 0.55;
}

/** 工位摸鱼动作调度：坐着、喝咖啡、伸懒腰、刷手机等 */
export default function IdleActivityController() {
  const missionStatus = useOfficeStore((s) => s.mission?.status);
  const settingsOpen = useOfficeStore((s) => s.settingsOpen);
  const officeMode = useOfficeStore((s) => s.officeMode);
  const setIdleActivity = useOfficeStore((s) => s.setIdleActivity);
  const counters = useRef<Record<string, number>>({});

  useEffect(() => {
    const busy =
      settingsOpen ||
      officeMode !== "normal" ||
      (missionStatus != null && missionStatus !== "done");

    if (busy) {
      EMPLOYEES.forEach((e) => setIdleActivity(e.id, "sit"));
      return;
    }

    const id = setInterval(() => {
      const state = useOfficeStore.getState();
      EMPLOYEES.forEach((emp) => {
        if ((state.statuses[emp.id] ?? "idle") !== "idle") return;
        if (state.movementTargets[emp.id]) return;

        const pose = state.employeePoses[emp.id];
        if (
          !pose ||
          !isAtDesk(pose.x, pose.z, emp.position[0], emp.position[2])
        )
          return;

        const idx = counters.current[emp.id] ?? 0;
        counters.current[emp.id] = idx + 1;
        setIdleActivity(emp.id, pickIdleActivity(idx));
      });
    }, IDLE_ACTIVITY_CYCLE_MS);

    return () => clearInterval(id);
  }, [missionStatus, settingsOpen, officeMode, setIdleActivity]);

  return null;
}
