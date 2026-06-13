"use client";

/** 大型落地盆栽 */
export function BigPlant({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.24, 0.5, 7]} />
        <meshStandardMaterial color="#c2703d" flatShading />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.045, 0.06, 0.45, 5]} />
        <meshStandardMaterial color="#7c4a21" flatShading />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <icosahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial color="#3fa34d" flatShading />
      </mesh>
      <mesh position={[0.22, 1.42, 0.1]} castShadow>
        <icosahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color="#54c266" flatShading />
      </mesh>
      <mesh position={[-0.24, 1.32, -0.12]} castShadow>
        <icosahedronGeometry args={[0.24, 0]} />
        <meshStandardMaterial color="#2f8a3d" flatShading />
      </mesh>
    </group>
  );
}

/** 公用打印机/复印机站 */
export function Printer({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* 柜体底座 */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.78, 0.44, 0.6]} />
        <meshStandardMaterial color="#2d3450" flatShading />
      </mesh>
      {/* 打印机主体 */}
      <mesh position={[0, 0.66, 0]} castShadow>
        <boxGeometry args={[0.88, 0.46, 0.66]} />
        <meshStandardMaterial color="#475569" flatShading />
      </mesh>
      {/* 出纸托盘 */}
      <mesh position={[0, 0.52, 0.42]}>
        <boxGeometry args={[0.5, 0.03, 0.26]} />
        <meshStandardMaterial color="#334155" flatShading />
      </mesh>
      {/* 顶部纸堆 */}
      <mesh position={[0.12, 0.91, -0.05]}>
        <boxGeometry args={[0.34, 0.05, 0.44]} />
        <meshStandardMaterial color="#e2e8f0" flatShading />
      </mesh>
      {/* 状态指示灯 */}
      <mesh position={[-0.3, 0.78, 0.34]}>
        <boxGeometry args={[0.07, 0.04, 0.02]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** 饮水机 */
export function WaterCooler({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.45, 1, 0.45]} />
        <meshStandardMaterial color="#3b4368" flatShading />
      </mesh>
      {/* 出水口面板 */}
      <mesh position={[0, 0.72, 0.23]}>
        <boxGeometry args={[0.3, 0.16, 0.02]} />
        <meshStandardMaterial color="#1e2438" flatShading />
      </mesh>
      {/* 水桶 */}
      <mesh position={[0, 1.18, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.32, 8]} />
        <meshStandardMaterial color="#7dd3fc" transparent opacity={0.7} flatShading />
      </mesh>
    </group>
  );
}

/** 自动售货机 */
export function VendingMachine({
  position,
  rotation = 0,
  accentColor = "#22d3ee",
}: {
  position: [number, number, number];
  rotation?: number;
  accentColor?: string;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[1.0, 1.9, 0.75]} />
        <meshStandardMaterial color="#1e2438" flatShading />
      </mesh>
      {/* 发光展示窗 */}
      <mesh position={[-0.12, 1.12, 0.38]}>
        <planeGeometry args={[0.62, 1.25]} />
        <meshStandardMaterial
          color="#0f172a"
          emissive={accentColor}
          emissiveIntensity={0.55}
          toneMapped={false}
        />
      </mesh>
      {/* 展示窗内的"商品"排 */}
      {[0.62, 0.95, 1.28, 1.61].map((y, row) => (
        <mesh key={row} position={[-0.12, y, 0.39]}>
          <boxGeometry args={[0.54, 0.1, 0.02]} />
          <meshStandardMaterial color="#334155" flatShading />
        </mesh>
      ))}
      {/* 选购面板 */}
      <mesh position={[0.36, 1.3, 0.38]}>
        <boxGeometry args={[0.16, 0.5, 0.02]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={1.1}
          toneMapped={false}
        />
      </mesh>
      {/* 取货口 */}
      <mesh position={[0, 0.32, 0.38]}>
        <boxGeometry args={[0.6, 0.22, 0.02]} />
        <meshStandardMaterial color="#0b0f1e" flatShading />
      </mesh>
    </group>
  );
}
