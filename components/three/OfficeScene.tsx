"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import Office from "./Office";
import ModeCameraController from "./ModeCameraController";
import { SCENE_THEME, useThemeStore } from "@/lib/theme";

/**
 * Step 1: R3F 基础场景。
 * 透视相机 + OrbitControls，限制俯仰角与距离，保持等距（Isometric）观感。
 */
export default function OfficeScene() {
  const theme = useThemeStore((s) => s.theme);
  const cfg = SCENE_THEME[theme];

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [20, 16, 20], fov: 30, near: 1, far: 200 }}
    >
      <color attach="background" args={[cfg.background]} />
      <fog attach="fog" args={cfg.fog} />

      {/* 光照：主方向光（投影）+ 环境光 + 两盏氛围点光源 */}
      <ambientLight intensity={cfg.ambient} />
      <directionalLight
        position={[14, 20, 10]}
        intensity={cfg.dirLight}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-bias={-0.0004}
      />
      <pointLight position={[-12, 8, -8]} intensity={60} color={cfg.point1} />
      <pointLight position={[12, 6, 10]} intensity={40} color={cfg.point2} />

      {/* 太空感星空背景（仅深色模式） */}
      {cfg.showStars && (
        <Stars radius={70} depth={40} count={2000} factor={3.5} fade speed={0.6} />
      )}

      <Suspense fallback={null}>
        <Office />
      </Suspense>

      <ModeCameraController />
    </Canvas>
  );
}
