"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshStandardMaterial } from "three";

interface DeskProps {
  /** 员工是否在工作（屏幕发光） */
  working: boolean;
  /** 部门主题色（隔板 & 屏幕光） */
  accentColor: string;
}

/**
 * 单个工位：办公桌 + 显示器 + 键盘 + 咖啡杯 + 绿植 + 卡座隔板
 * 局部坐标系：桌子在原点，椅子/员工在 +z 方向，显示器朝 +z。
 */
export default function Desk({ working, accentColor }: DeskProps) {
  const screenMat = useRef<MeshStandardMaterial>(null);

  // 工作时屏幕呼吸发光
  useFrame((state) => {
    if (!screenMat.current) return;
    const t = state.clock.elapsedTime;
    const target = working ? 1.6 + Math.sin(t * 6) * 0.5 : 0.12;
    screenMat.current.emissiveIntensity +=
      (target - screenMat.current.emissiveIntensity) * 0.1;
  });

  return (
    <group>
      {/* 桌面 */}
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.08, 0.85]} />
        <meshStandardMaterial color="#4a5578" flatShading />
      </mesh>
      {/* 桌腿 x4 */}
      {[
        [-0.78, -0.36],
        [0.78, -0.36],
        [-0.78, 0.36],
        [0.78, 0.36],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.34, z]} castShadow>
          <boxGeometry args={[0.07, 0.68, 0.07]} />
          <meshStandardMaterial color="#2d3450" flatShading />
        </mesh>
      ))}

      {/* 显示器：底座 + 支架 + 屏幕 */}
      <mesh position={[0, 0.79, -0.18]} castShadow>
        <boxGeometry args={[0.3, 0.04, 0.2]} />
        <meshStandardMaterial color="#1e2438" flatShading />
      </mesh>
      <mesh position={[0, 0.89, -0.2]}>
        <boxGeometry args={[0.06, 0.18, 0.05]} />
        <meshStandardMaterial color="#1e2438" flatShading />
      </mesh>
      <mesh position={[0, 1.12, -0.22]} castShadow>
        <boxGeometry args={[0.82, 0.5, 0.06]} />
        <meshStandardMaterial color="#11152a" flatShading />
      </mesh>
      {/* 发光屏幕（贴在显示器正面） */}
      <mesh position={[0, 1.12, -0.185]}>
        <planeGeometry args={[0.72, 0.4]} />
        <meshStandardMaterial
          ref={screenMat}
          color="#0a0f1e"
          emissive={accentColor}
          emissiveIntensity={0.12}
          toneMapped={false}
        />
      </mesh>

      {/* 键盘 */}
      <mesh position={[0, 0.78, 0.2]} castShadow>
        <boxGeometry args={[0.52, 0.035, 0.18]} />
        <meshStandardMaterial color="#252c47" flatShading />
      </mesh>

      {/* 咖啡杯 */}
      <group position={[0.58, 0.81, 0.12]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.045, 0.11, 8]} />
          <meshStandardMaterial color="#e8e6e3" flatShading />
        </mesh>
        <mesh position={[0, 0.055, 0]}>
          <cylinderGeometry args={[0.038, 0.038, 0.01, 8]} />
          <meshStandardMaterial color="#4a2c17" flatShading />
        </mesh>
      </group>

      {/* 绿植 */}
      <group position={[-0.62, 0.76, -0.22]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.07, 0.055, 0.13, 6]} />
          <meshStandardMaterial color="#c2703d" flatShading />
        </mesh>
        <mesh position={[0, 0.15, 0]} castShadow>
          <icosahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial color="#3fa34d" flatShading />
        </mesh>
        <mesh position={[0.05, 0.24, 0.03]} castShadow>
          <icosahedronGeometry args={[0.07, 0]} />
          <meshStandardMaterial color="#54c266" flatShading />
        </mesh>
      </group>

      {/* 卡座隔板（带部门色顶条） */}
      <mesh position={[0, 0.62, -0.58]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 1.24, 0.07]} />
        <meshStandardMaterial color="#323a5c" flatShading />
      </mesh>
      <mesh position={[0, 1.27, -0.58]}>
        <boxGeometry args={[1.8, 0.06, 0.075]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.8}
          toneMapped={false}
        />
      </mesh>

      {/* 办公椅 */}
      <group position={[0, 0, 0.85]}>
        <mesh position={[0, 0.42, 0]} castShadow>
          <boxGeometry args={[0.5, 0.07, 0.5]} />
          <meshStandardMaterial color="#1f2540" flatShading />
        </mesh>
        <mesh position={[0, 0.72, 0.24]} castShadow>
          <boxGeometry args={[0.5, 0.62, 0.07]} />
          <meshStandardMaterial color="#1f2540" flatShading />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 6]} />
          <meshStandardMaterial color="#11152a" flatShading />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.05, 5]} />
          <meshStandardMaterial color="#11152a" flatShading />
        </mesh>
      </group>
    </group>
  );
}
