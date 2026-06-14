"use client";

import { Html } from "@react-three/drei";
import { meetingChairSpecs } from "@/lib/meetingLayout";
import { useOfficeStore } from "@/lib/store";

/** 玻璃墙段（带上下金属框） */
function GlassWall({
  position,
  rotation = 0,
  width,
}: {
  position: [number, number, number];
  rotation?: number;
  width: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[width, 2.0, 0.05]} />
        <meshStandardMaterial color="#7dd3fc" transparent opacity={0.1} />
      </mesh>
      <mesh position={[0, 2.13, 0]}>
        <boxGeometry args={[width, 0.08, 0.09]} />
        <meshStandardMaterial color="#3b4368" flatShading />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[width, 0.12, 0.09]} />
        <meshStandardMaterial color="#3b4368" flatShading />
      </mesh>
    </group>
  );
}

/** 会议椅 */
function Chair({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.46, 0.07, 0.46]} />
        <meshStandardMaterial color="#1f2540" flatShading />
      </mesh>
      <mesh position={[0, 0.72, 0.21]} castShadow>
        <boxGeometry args={[0.46, 0.6, 0.07]} />
        <meshStandardMaterial color="#1f2540" flatShading />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 6]} />
        <meshStandardMaterial color="#11152a" flatShading />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.05, 5]} />
        <meshStandardMaterial color="#11152a" flatShading />
      </mesh>
    </group>
  );
}

/**
 * 玻璃会议室：长桌 + 十把椅子（长边各四、短边各一）+ 数据大屏。
 * 局部坐标系以房间中心为原点，footprint 约 7(x) × 11(z)。
 */
export default function MeetingRoom({
  position,
}: {
  position: [number, number, number];
}) {
  const settingsOpen = useOfficeStore((s) => s.settingsOpen);

  return (
    <group position={position}>
      {/* 区域地毯 */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6.8, 10.8]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.08} />
      </mesh>

      {/* 玻璃墙：西侧（朝办公区，留出入口）、南北两端、东侧封闭 */}
      <GlassWall position={[-3.5, 0, -3.3]} rotation={Math.PI / 2} width={4.4} />
      <GlassWall position={[-3.5, 0, 3.3]} rotation={Math.PI / 2} width={4.4} />
      <GlassWall position={[3.5, 0, 0]} rotation={Math.PI / 2} width={11} />
      <GlassWall position={[0, 0, -5.5]} width={7} />
      <GlassWall position={[0, 0, 5.5]} width={7} />

      {/* 会议长桌 */}
      <mesh position={[0, 0.78, 0.4]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.1, 4.6]} />
        <meshStandardMaterial color="#4a5578" flatShading />
      </mesh>
      {[-1.4, 2.2].map((z, i) => (
        <mesh key={i} position={[0, 0.37, z]} castShadow>
          <boxGeometry args={[1.2, 0.74, 0.14]} />
          <meshStandardMaterial color="#2d3450" flatShading />
        </mesh>
      ))}
      {/* 桌面摆设：笔记本电脑 + 文件 */}
      <group position={[0, 0.83, 0.2]}>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.36, 0.03, 0.26]} />
          <meshStandardMaterial color="#1e2438" flatShading />
        </mesh>
        <mesh position={[0, 0.13, -0.12]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[0.36, 0.24, 0.02]} />
          <meshStandardMaterial
            color="#0f172a"
            emissive="#38bdf8"
            emissiveIntensity={0.5}
            toneMapped={false}
          />
        </mesh>
      </group>
      <mesh position={[0.35, 0.84, 1.5]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.3, 0.02, 0.4]} />
        <meshStandardMaterial color="#e2e8f0" flatShading />
      </mesh>

      {/* 长边各 4 椅 + 短边各 1 椅（共 10） */}
      {meetingChairSpecs().map((chair, i) => (
        <Chair
          key={`chair-${i}`}
          position={[chair.x, 0, chair.z]}
          rotation={chair.rotation}
        />
      ))}

      {/* 北端数据大屏 */}
      <group position={[0, 0, -4.6]}>
        {[-0.8, 0.8].map((x, i) => (
          <mesh key={i} position={[x, 0.5, 0]}>
            <boxGeometry args={[0.08, 1.0, 0.08]} />
            <meshStandardMaterial color="#2d3450" flatShading />
          </mesh>
        ))}
        <mesh position={[0, 1.62, 0]} castShadow>
          <boxGeometry args={[2.5, 1.4, 0.08]} />
          <meshStandardMaterial color="#11152a" flatShading />
        </mesh>
        <mesh position={[0, 1.62, 0.045]}>
          <planeGeometry args={[2.3, 1.2]} />
          <meshStandardMaterial
            color="#0a0f1e"
            emissive="#38bdf8"
            emissiveIntensity={0.25}
            toneMapped={false}
          />
        </mesh>
        {/* 屏幕上的"柱状图" */}
        {[
          { x: -0.75, h: 0.35, c: "#22d3ee" },
          { x: -0.35, h: 0.6, c: "#a78bfa" },
          { x: 0.05, h: 0.45, c: "#22d3ee" },
          { x: 0.45, h: 0.8, c: "#34d399" },
          { x: 0.85, h: 0.55, c: "#fbbf24" },
        ].map((bar, i) => (
          <mesh key={i} position={[bar.x, 1.12 + bar.h / 2, 0.05]}>
            <boxGeometry args={[0.22, bar.h, 0.01]} />
            <meshStandardMaterial
              color={bar.c}
              emissive={bar.c}
              emissiveIntensity={1.2}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* 悬浮标牌 */}
      {!settingsOpen && (
      <Html
        position={[0, 3.3, 0]}
        center
        distanceFactor={14}
        zIndexRange={[28, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div className="select-none whitespace-nowrap rounded-lg border border-sky-400/40 bg-slate-950/70 px-3 py-1 text-center backdrop-blur-sm">
          <div className="text-xs font-bold tracking-widest text-sky-300">
            会议室
          </div>
          <div className="text-[9px] uppercase tracking-wider text-white/40">
            Meeting Room
          </div>
        </div>
      </Html>
      )}
    </group>
  );
}
