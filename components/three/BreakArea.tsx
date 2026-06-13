"use client";

import { Html } from "@react-three/drei";
import { useOfficeStore } from "@/lib/store";
import { BigPlant, VendingMachine, WaterCooler } from "./Decorations";

/** 咖啡机（带发光面板和小杯子） */
function CoffeeMachine({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      {/* 机身 */}
      <mesh castShadow>
        <boxGeometry args={[0.46, 0.62, 0.42]} />
        <meshStandardMaterial color="#1e2438" flatShading />
      </mesh>
      {/* 顶部豆仓 */}
      <mesh position={[0, 0.36, -0.06]}>
        <cylinderGeometry args={[0.1, 0.12, 0.12, 7]} />
        <meshStandardMaterial color="#475569" transparent opacity={0.85} flatShading />
      </mesh>
      {/* 出水嘴 */}
      <mesh position={[0, 0.06, 0.22]}>
        <boxGeometry args={[0.1, 0.14, 0.08]} />
        <meshStandardMaterial color="#0b0f1e" flatShading />
      </mesh>
      {/* 接水的小杯子 */}
      <mesh position={[0, -0.22, 0.24]}>
        <cylinderGeometry args={[0.045, 0.04, 0.09, 8]} />
        <meshStandardMaterial color="#e8e6e3" flatShading />
      </mesh>
      {/* 发光操作面板 */}
      <mesh position={[0.13, 0.14, 0.215]}>
        <planeGeometry args={[0.12, 0.16]} />
        <meshStandardMaterial
          color="#0f172a"
          emissive="#fbbf24"
          emissiveIntensity={0.9}
          toneMapped={false}
        />
      </mesh>
      {/* 工作指示灯 */}
      <mesh position={[-0.14, 0.22, 0.215]}>
        <boxGeometry args={[0.04, 0.04, 0.01]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** 沙发 */
function Sofa({
  position,
  rotation = 0,
  width = 2.2,
  color = "#be123c",
}: {
  position: [number, number, number];
  rotation?: number;
  width?: number;
  color?: string;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* 底座 */}
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[width, 0.4, 0.85]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      {/* 靠背 */}
      <mesh position={[0, 0.66, 0.34]} castShadow>
        <boxGeometry args={[width, 0.55, 0.18]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      {/* 扶手 */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (width / 2 - 0.1), 0.52, 0]}
          castShadow
        >
          <boxGeometry args={[0.2, 0.5, 0.85]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
      ))}
      {/* 坐垫 */}
      {width > 1.4 ? (
        [-0.5, 0.5].map((x) => (
          <mesh key={x} position={[x * (width / 2 - 0.55) * 2, 0.51, -0.05]}>
            <boxGeometry args={[width / 2 - 0.25, 0.1, 0.65]} />
            <meshStandardMaterial color="#e8b4bc" flatShading />
          </mesh>
        ))
      ) : (
        <mesh position={[0, 0.51, -0.05]}>
          <boxGeometry args={[width - 0.5, 0.1, 0.65]} />
          <meshStandardMaterial color="#e8b4bc" flatShading />
        </mesh>
      )}
    </group>
  );
}

/**
 * 茶水间 + 休息区：操作台（咖啡机/微波炉）、饮水机、冰箱、
 * 自动售货机、沙发休息角、落地灯。
 * 局部坐标系以区域中心为原点，footprint 约 7(x) × 14(z)。
 */
export default function BreakArea({
  position,
}: {
  position: [number, number, number];
}) {
  const settingsOpen = useOfficeStore((s) => s.settingsOpen);

  return (
    <group position={position}>
      {/* 区域地毯 */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6.8, 13.6]} />
        <meshStandardMaterial color="#fb7185" transparent opacity={0.06} />
      </mesh>

      {/* ── 茶水操作台（西侧）─────────────────── */}
      <group position={[-3.05, 0, -2.2]}>
        <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.92, 4.4]} />
          <meshStandardMaterial color="#3b4368" flatShading />
        </mesh>
        <mesh position={[0, 0.95, 0]}>
          <boxGeometry args={[1.0, 0.06, 4.5]} />
          <meshStandardMaterial color="#94a3b8" flatShading />
        </mesh>
        {/* 咖啡机 */}
        <CoffeeMachine position={[0, 1.29, -1.5]} />
        {/* 微波炉 */}
        <group position={[0, 1.17, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.36, 0.42]} />
            <meshStandardMaterial color="#475569" flatShading />
          </mesh>
          <mesh position={[-0.06, 0, 0.215]}>
            <planeGeometry args={[0.3, 0.26]} />
            <meshStandardMaterial
              color="#0b0f1e"
              emissive="#fde68a"
              emissiveIntensity={0.15}
              toneMapped={false}
            />
          </mesh>
        </group>
        {/* 一排马克杯 */}
        {[1.0, 1.3, 1.6].map((z, i) => (
          <mesh key={i} position={[0.1, 1.04, z]}>
            <cylinderGeometry args={[0.05, 0.045, 0.1, 8]} />
            <meshStandardMaterial
              color={["#f87171", "#facc15", "#4ade80"][i]}
              flatShading
            />
          </mesh>
        ))}
      </group>

      {/* 冰箱 */}
      <group position={[-3.05, 0, 1.1]}>
        <mesh position={[0, 0.85, 0]} castShadow>
          <boxGeometry args={[0.82, 1.7, 0.72]} />
          <meshStandardMaterial color="#cbd5e1" flatShading />
        </mesh>
        <mesh position={[0.3, 1.0, 0.37]}>
          <boxGeometry args={[0.05, 0.5, 0.04]} />
          <meshStandardMaterial color="#64748b" flatShading />
        </mesh>
        <mesh position={[0, 1.05, 0.365]}>
          <boxGeometry args={[0.82, 0.04, 0.01]} />
          <meshStandardMaterial color="#94a3b8" flatShading />
        </mesh>
      </group>

      {/* 饮水机 */}
      <WaterCooler position={[-3.05, 0, 2.6]} rotation={Math.PI / 2} />

      {/* 自动售货机 ×2（北侧，面向南） */}
      <VendingMachine position={[-0.7, 0, -6.2]} accentColor="#22d3ee" />
      <VendingMachine position={[0.6, 0, -6.2]} accentColor="#fb923c" />

      {/* ── 沙发休息角（南侧）────────────────── */}
      {/* 圆形地毯 */}
      <mesh position={[0.4, 0.03, 3.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.3, 24]} />
        <meshStandardMaterial color="#475569" transparent opacity={0.55} />
      </mesh>
      {/* 三人沙发（面向北） */}
      <Sofa position={[0.4, 0, 5.4]} rotation={0} />
      {/* 两张单人沙发（面向南） */}
      <Sofa position={[-0.6, 0, 1.9]} rotation={Math.PI} width={1.0} color="#9f1239" />
      <Sofa position={[1.4, 0, 1.9]} rotation={Math.PI} width={1.0} color="#9f1239" />
      {/* 圆形茶几 */}
      <group position={[0.4, 0, 3.6]}>
        <mesh position={[0, 0.42, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.55, 0.07, 10]} />
          <meshStandardMaterial color="#4a5578" flatShading />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 0.38, 6]} />
          <meshStandardMaterial color="#2d3450" flatShading />
        </mesh>
        {/* 茶几上的咖啡杯和杂志 */}
        <mesh position={[0.2, 0.51, 0.1]}>
          <cylinderGeometry args={[0.045, 0.04, 0.09, 8]} />
          <meshStandardMaterial color="#e8e6e3" flatShading />
        </mesh>
        <mesh position={[-0.18, 0.47, -0.08]} rotation={[0, 0.5, 0]}>
          <boxGeometry args={[0.26, 0.02, 0.34]} />
          <meshStandardMaterial color="#38bdf8" flatShading />
        </mesh>
      </group>
      {/* 落地灯 */}
      <group position={[2.7, 0, 5.6]}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.22, 0.25, 0.05, 8]} />
          <meshStandardMaterial color="#2d3450" flatShading />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.75, 6]} />
          <meshStandardMaterial color="#2d3450" flatShading />
        </mesh>
        <mesh position={[0, 1.85, 0]}>
          <coneGeometry args={[0.28, 0.32, 8, 1, true]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#fbbf24"
            emissiveIntensity={1.3}
            toneMapped={false}
          />
        </mesh>
        <pointLight position={[0, 1.7, 0]} intensity={6} distance={6} color="#fde68a" />
      </group>

      {/* 角落盆栽 */}
      <BigPlant position={[2.8, 0, -5.6]} />
      <BigPlant position={[-3.0, 0, 6.2]} scale={0.85} />

      {/* 悬浮标牌 */}
      {!settingsOpen && (
      <Html
        position={[0, 3.3, 0]}
        center
        distanceFactor={14}
        zIndexRange={[28, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div className="select-none whitespace-nowrap rounded-lg border border-rose-400/40 bg-slate-950/70 px-3 py-1 text-center backdrop-blur-sm">
          <div className="text-xs font-bold tracking-widest text-rose-300">
            茶水间 · 休息区
          </div>
          <div className="text-[9px] uppercase tracking-wider text-white/40">
            Break Room &amp; Lounge
          </div>
        </div>
      </Html>
      )}
    </group>
  );
}
