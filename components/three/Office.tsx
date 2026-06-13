"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Group } from "three";
import { DEPARTMENTS, EMPLOYEES } from "@/lib/employees";
import { useOfficeStore } from "@/lib/store";
import Employee from "./Employee";
import MeetingRoom from "./MeetingRoom";
import BreakArea from "./BreakArea";
import { BigPlant, Printer } from "./Decorations";

const FLOOR_W = 38;
const FLOOR_D = 16;

/**
 * 无顶悬浮办公室：地板 + 部门地毯 + 中央走道 + 10 个工位。
 * 整体带轻微的悬浮起伏动画。
 */
export default function Office() {
  const officeRef = useRef<Group>(null);
  const settingsOpen = useOfficeStore((s) => s.settingsOpen);

  useFrame((state) => {
    if (!officeRef.current) return;
    const t = state.clock.elapsedTime;
    officeRef.current.position.y = Math.sin(t * 0.6) * 0.12; // 悬浮起伏
    officeRef.current.rotation.y = Math.sin(t * 0.15) * 0.012;
  });

  return (
    <group ref={officeRef}>
      {/* 地板主体 */}
      <mesh position={[0, -0.25, 0]} receiveShadow>
        <boxGeometry args={[FLOOR_W, 0.5, FLOOR_D]} />
        <meshStandardMaterial color="#222b42" flatShading />
      </mesh>
      {/* 底部霓虹描边 */}
      <mesh position={[0, -0.54, 0]}>
        <boxGeometry args={[FLOOR_W + 0.5, 0.1, FLOOR_D + 0.5]} />
        <meshStandardMaterial
          color="#0e7490"
          emissive="#22d3ee"
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>

      {/* 中央走道发光条（两条高度错开，避免交叉处 Z-fighting） */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[FLOOR_W - 2, 1.6]} />
        <meshStandardMaterial
          color="#164e63"
          emissive="#22d3ee"
          emissiveIntensity={0.35}
          transparent
          opacity={0.55}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, FLOOR_D - 2]} />
        <meshStandardMaterial
          color="#164e63"
          emissive="#22d3ee"
          emissiveIntensity={0.35}
          transparent
          opacity={0.55}
          toneMapped={false}
        />
      </mesh>

      {/* 部门区域：地毯 + 悬浮部门牌 */}
      {DEPARTMENTS.map((dept) => (
        <group key={dept.id}>
          <mesh
            position={[dept.center[0], 0.008, dept.center[1]]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={dept.size} />
            <meshStandardMaterial
              color={dept.color}
              transparent
              opacity={0.13}
            />
          </mesh>

          {/* 部门悬浮标牌 */}
          {!settingsOpen && (
          <Html
            position={[dept.center[0], 3.1, dept.center[1]]}
            center
            distanceFactor={14}
            zIndexRange={[28, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div
              className="select-none whitespace-nowrap rounded-lg border bg-slate-950/70 px-3 py-1 text-center backdrop-blur-sm"
              style={{ borderColor: `${dept.color}66` }}
            >
              <div
                className="text-xs font-bold tracking-widest"
                style={{ color: dept.color }}
              >
                {dept.name}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-white/40">
                {dept.englishName}
              </div>
            </div>
          </Html>
          )}
        </group>
      ))}

      {/* 10 个员工工位 */}
      {EMPLOYEES.map((employee) => (
        <Employee key={employee.id} config={employee} />
      ))}

      {/* ── 公共配套设施 ─────────────────────── */}
      {/* 东翼：玻璃会议室 */}
      <MeetingRoom position={[15.2, 0, 0]} />
      {/* 西翼：茶水间 + 休息区 */}
      <BreakArea position={[-15.2, 0, 0]} />
      {/* 中央走道北端：公用打印机站 */}
      <Printer position={[0, 0, -7]} />
      {/* 办公区角落绿植 */}
      <BigPlant position={[-11.4, 0, -7.1]} scale={0.9} />
      <BigPlant position={[11.2, 0, -7.1]} scale={0.85} />
      <BigPlant position={[-11.4, 0, 7.1]} scale={0.85} />
      <BigPlant position={[11.2, 0, 7.1]} scale={0.9} />
    </group>
  );
}
