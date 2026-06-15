"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";

/** 咖啡杯（工位坐姿） */
export function CoffeeMug() {
  const steamRef = useRef<Group>(null);

  useFrame((state) => {
    if (!steamRef.current) return;
    const t = state.clock.elapsedTime;
    steamRef.current.children.forEach((child, i) => {
      child.position.y = 0.1 + Math.sin(t * 3 + i) * 0.015;
      child.scale.setScalar(0.9 + Math.sin(t * 4 + i * 1.2) * 0.12);
    });
  });

  return (
    <group position={[0, -0.02, -0.54]} rotation={[0.15, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.058, 0.05, 0.12, 12]} />
        <meshStandardMaterial color="#f4f4f5" flatShading />
      </mesh>
      <mesh position={[0, 0.055, 0]}>
        <cylinderGeometry args={[0.048, 0.048, 0.014, 12]} />
        <meshStandardMaterial color="#6b4423" flatShading />
      </mesh>
      <mesh position={[0.068, 0.015, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.034, 0.011, 8, 14]} />
        <meshStandardMaterial color="#e4e4e7" flatShading />
      </mesh>
      <group ref={steamRef}>
        {[-0.02, 0, 0.02].map((x, i) => (
          <mesh key={i} position={[x, 0.11, 0]}>
            <sphereGeometry args={[0.016, 6, 6]} />
            <meshStandardMaterial
              color="#e2e8f0"
              transparent
              opacity={0.45}
              flatShading
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** 外带纸杯（休息区咖啡机） */
export function PaperCoffeeCup() {
  return (
    <group position={[0, -0.04, -0.56]} rotation={[0.1, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.052, 0.042, 0.16, 10]} />
        <meshStandardMaterial color="#f5efe6" flatShading />
      </mesh>
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.044, 0.044, 0.012, 10]} />
        <meshStandardMaterial color="#5c3d2e" flatShading />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.054, 0.054, 0.022, 10]} />
        <meshStandardMaterial color="#d6d3d1" flatShading />
      </mesh>
    </group>
  );
}

/** 智能手机：屏幕朝面部（局部 +Z 为屏面，与真实握持一致） */
export function Smartphone() {
  const screenRef = useRef<Group>(null);

  useFrame((state) => {
    if (!screenRef.current) return;
    const pulse = 0.92 + Math.sin(state.clock.elapsedTime * 5) * 0.06;
    screenRef.current.scale.setScalar(pulse);
  });

  return (
    <group position={[0.04, -0.1, -0.36]} rotation={[-0.42, 0.05, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.078, 0.158, 0.012]} />
        <meshStandardMaterial color="#18181b" flatShading />
      </mesh>
      {/* 屏幕朝 +Z（朝向胸口/面部） */}
      <mesh position={[0, 0, 0.007]}>
        <boxGeometry args={[0.07, 0.142, 0.001]} />
        <meshStandardMaterial
          color="#0ea5e9"
          emissive="#38bdf8"
          emissiveIntensity={0.55}
          toneMapped={false}
          flatShading
        />
      </mesh>
      <group ref={screenRef} position={[0, 0.03, 0.008]}>
        <mesh>
          <planeGeometry args={[0.048, 0.028]} />
          <meshStandardMaterial
            color="#f8fafc"
            emissive="#bae6fd"
            emissiveIntensity={0.25}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

/** 饮料罐 */
export function SodaCan() {
  return (
    <group position={[0, -0.03, -0.54]} rotation={[0.05, 0.3, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.044, 0.044, 0.14, 12]} />
        <meshStandardMaterial color="#dc2626" flatShading />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.042, 0.042, 0.018, 12]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.4} roughness={0.35} flatShading />
      </mesh>
      <mesh position={[0, 0, 0.044]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.042, 12]} />
        <meshStandardMaterial color="#f87171" flatShading />
      </mesh>
    </group>
  );
}

/** 水杯 */
export function WaterCup() {
  return (
    <group position={[0, -0.02, -0.52]} rotation={[0.08, -0.1, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.05, 0.046, 0.15, 10]} />
        <meshStandardMaterial color="#bae6fd" transparent opacity={0.75} flatShading />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.048, 0.048, 0.024, 10]} />
        <meshStandardMaterial color="#e0f2fe" flatShading />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.038, 0.038, 0.1, 10]} />
        <meshStandardMaterial color="#7dd3fc" transparent opacity={0.6} flatShading />
      </mesh>
    </group>
  );
}

/** 便当盒 */
export function BentoBox() {
  return (
    <group position={[0, -0.05, -0.5]} rotation={[0.2, 0, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.2, 0.065, 0.14]} />
        <meshStandardMaterial color="#1e3a5f" flatShading />
      </mesh>
      <mesh position={[0, 0.036, 0]}>
        <boxGeometry args={[0.19, 0.01, 0.13]} />
        <meshStandardMaterial color="#64748b" metalness={0.3} flatShading />
      </mesh>
      <mesh position={[-0.04, 0.042, 0]}>
        <boxGeometry args={[0.055, 0.014, 0.055]} />
        <meshStandardMaterial color="#fbbf24" flatShading />
      </mesh>
      <mesh position={[0.04, 0.042, 0]}>
        <boxGeometry args={[0.055, 0.014, 0.055]} />
        <meshStandardMaterial color="#34d399" flatShading />
      </mesh>
    </group>
  );
}

/** 杂志：封面朝读者（局部 +Z 为封面，略低头阅读） */
export function Magazine() {
  return (
    <group position={[0.02, 0.04, -0.42]} rotation={[0.62, 0.04, -0.08]}>
      <mesh castShadow>
        <boxGeometry args={[0.22, 0.28, 0.016]} />
        <meshStandardMaterial color="#f97316" flatShading />
      </mesh>
      <mesh position={[0, 0, 0.009]}>
        <boxGeometry args={[0.19, 0.24, 0.001]} />
        <meshStandardMaterial color="#fef3c7" flatShading />
      </mesh>
      <mesh position={[0, 0.04, 0.011]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.14, 0.06]} />
        <meshStandardMaterial color="#fdba74" flatShading />
      </mesh>
    </group>
  );
}

/** 会议笔记本（左手托举） */
export function MeetingNotebook() {
  return (
    <group position={[0.04, -0.06, -0.52]} rotation={[0.55, 0.08, 0.12]}>
      <mesh castShadow>
        <boxGeometry args={[0.24, 0.32, 0.022]} />
        <meshStandardMaterial color="#1e3a8a" flatShading />
      </mesh>
      <mesh position={[0, 0, -0.012]}>
        <boxGeometry args={[0.22, 0.3, 0.001]} />
        <meshStandardMaterial color="#f8fafc" flatShading />
      </mesh>
      {[0.08, 0, -0.08].map((y) => (
        <mesh key={y} position={[0, y, -0.013]}>
          <planeGeometry args={[0.18, 0.008]} />
          <meshStandardMaterial color="#cbd5e1" flatShading />
        </mesh>
      ))}
    </group>
  );
}

/** 会议签字笔（右手书写） */
export function MeetingPen() {
  return (
    <group position={[0, 0.02, -0.5]} rotation={[0.35, 0, -0.15]}>
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.009, 0.009, 0.15, 8]} />
        <meshStandardMaterial color="#0f172a" flatShading />
      </mesh>
      <mesh position={[0, 0, -0.082]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.012, 0.028, 8]} />
        <meshStandardMaterial color="#fbbf24" flatShading />
      </mesh>
      <mesh position={[0, 0, 0.078]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.011, 0.011, 0.02, 8]} />
        <meshStandardMaterial color="#3b82f6" flatShading />
      </mesh>
    </group>
  );
}

export type HandPropId =
  | "coffee-mug"
  | "coffee-paper"
  | "phone"
  | "soda"
  | "water"
  | "bento"
  | "magazine"
  | "notebook"
  | "pen";

export function HandProp({ id }: { id: HandPropId }) {
  switch (id) {
    case "coffee-mug":
      return <CoffeeMug />;
    case "coffee-paper":
      return <PaperCoffeeCup />;
    case "phone":
      return <Smartphone />;
    case "soda":
      return <SodaCan />;
    case "water":
      return <WaterCup />;
    case "bento":
      return <BentoBox />;
    case "magazine":
      return <Magazine />;
    case "notebook":
      return <MeetingNotebook />;
    case "pen":
      return <MeetingPen />;
    default:
      return null;
  }
}
