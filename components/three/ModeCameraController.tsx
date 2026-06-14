"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Vector3 } from "three";
import { BREAK_CENTER, MEETING_CENTER } from "@/lib/officeAnchors";
import { useOfficeStore } from "@/lib/store";
import { OfficeMode } from "@/lib/types";

const DEFAULT_TARGET = new Vector3(0, 0.5, 0);
const ORBIT_RADIUS = 13;
const ORBIT_HEIGHT = 11;
const ORBIT_SPEED = 0.14;

function modeCenter(mode: OfficeMode): Vector3 | null {
  if (mode === "focus") {
    return new Vector3(MEETING_CENTER[0], 0.5, MEETING_CENTER[2]);
  }
  if (mode === "break") {
    return new Vector3(BREAK_CENTER[0], 0.5, BREAK_CENTER[2]);
  }
  return null;
}

/** 专注/休息模式：镜头锁定区域中心并环绕；结束后恢复自由视角 */
export default function ModeCameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const officeMode = useOfficeStore((s) => s.officeMode);
  const { camera } = useThree();
  const angleRef = useRef(0);
  const prevModeRef = useRef<OfficeMode>("normal");
  const desiredPos = useRef(new Vector3());
  const desiredTarget = useRef(new Vector3());

  useEffect(() => {
    if (officeMode === prevModeRef.current) return;
    prevModeRef.current = officeMode;

    const center = modeCenter(officeMode);
    if (center) {
      const dx = camera.position.x - center.x;
      const dz = camera.position.z - center.z;
      angleRef.current = Math.atan2(dx, dz);
    }
  }, [officeMode, camera]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const center = modeCenter(officeMode);
    if (!center) {
      controls.enabled = true;
      controls.enableRotate = true;
      controls.enableZoom = true;
      desiredTarget.current.lerp(DEFAULT_TARGET, 0.06);
      controls.target.copy(desiredTarget.current);
      controls.update();
      return;
    }

    controls.enabled = false;
    controls.enableRotate = false;
    controls.enableZoom = false;

    angleRef.current += ORBIT_SPEED * delta;
    const a = angleRef.current;

    desiredPos.current.set(
      center.x + Math.sin(a) * ORBIT_RADIUS,
      ORBIT_HEIGHT,
      center.z + Math.cos(a) * ORBIT_RADIUS
    );
    desiredTarget.current.copy(center);

    camera.position.lerp(desiredPos.current, 0.1);
    controls.target.lerp(desiredTarget.current, 0.12);
    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      target={[0, 0.5, 0]}
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      minDistance={12}
      maxDistance={48}
      minPolarAngle={Math.PI / 5}
      maxPolarAngle={Math.PI / 2.6}
    />
  );
}
