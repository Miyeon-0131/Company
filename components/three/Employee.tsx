"use client";

import { useRef } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { Group } from "three";
import { EmployeeConfig } from "@/lib/types";
import { useOfficeStore } from "@/lib/store";
import { getDepartment } from "@/lib/employees";
import Desk from "./Desk";
import StatusBubble from "./StatusBubble";

interface EmployeeProps {
  config: EmployeeConfig;
}

/**
 * 一个完整的工位单元 = 办公桌 + 低多边形员工。
 * 员工坐在椅子上面朝显示器（-z 方向），根据 status 播放动画：
 *  - idle:     轻微呼吸起伏
 *  - thinking: 歪头左右摇摆
 *  - working:  双臂交替快速敲击键盘 + 身体前倾
 *  - done:     整个人起跳欢呼，双臂高举
 */
export default function Employee({ config }: EmployeeProps) {
  const status = useOfficeStore((s) => s.statuses[config.id] ?? "idle");
  const overrideText = useOfficeStore((s) => s.statusTexts[config.id]);
  const setActiveScreen = useOfficeStore((s) => s.setActiveScreen);

  const department = getDepartment(config.departmentId);

  const characterRef = useRef<Group>(null);
  const torsoRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const character = characterRef.current;
    const torso = torsoRef.current;
    const head = headRef.current;
    const leftArm = leftArmRef.current;
    const rightArm = rightArmRef.current;
    if (!character || !torso || !head || !leftArm || !rightArm) return;

    /**
     * 手臂旋转轴说明（枢轴在肩部，手臂沿 -z 向前伸向显示器）：
     *  rotation.x < 0 → 手端向下（-Y），垂落到键盘上  ← 打字方向
     *  rotation.x > 0 → 手端向上（+Y），举高庆祝
     *  rotation.y 让水平方向左右摆：左臂取负 / 右臂取正 → 双手向中间聚拢（内八）
     */
    let charY = 0;
    let torsoLean = 0;
    let torsoScaleY = 1;
    let headTiltZ = 0;
    let headNodX = 0;
    // 默认：手臂自然垂落、手放在键盘上（负值向下弯）
    let leftArmRotX = -0.5;
    let rightArmRotX = -0.5;
    let leftArmRotY = 0;
    let rightArmRotY = 0;
    let leftArmRotZ = 0;
    let rightArmRotZ = 0;

    switch (status) {
      case "idle":
        torsoScaleY = 1 + Math.sin(t * 1.6) * 0.018; // 呼吸
        headTiltZ = Math.sin(t * 0.7) * 0.05;
        leftArmRotX = -0.5;
        rightArmRotX = -0.5;
        break;

      case "thinking":
        headTiltZ = Math.sin(t * 2.2) * 0.22;
        headNodX = -0.12;
        torsoLean = 0.08;
        leftArmRotX = 0.85;  // 左臂抬起：手举到下巴附近托腮
        leftArmRotY = -0.25; // 略向内收向脸部
        rightArmRotX = -0.5; // 右臂仍放在桌上
        break;

      case "working":
        // 原地端坐：身体几乎不动，头部保持端正不后仰
        torsoLean = 0.06;
        headNodX = 0;
        // 手垂在键盘上（负值），上下交替敲击 —— 只有手在动
        leftArmRotX = -0.55 + Math.sin(t * 16) * 0.2;
        rightArmRotX = -0.55 + Math.sin(t * 16 + Math.PI) * 0.2;
        leftArmRotY = -0.28;  // 左手向中间聚拢（内八）
        rightArmRotY = 0.28;  // 右手向中间聚拢（内八）
        break;

      case "done":
        charY = Math.abs(Math.sin(t * 5)) * 0.45; // 欢呼起跳
        headNodX = -0.2;
        // 正值 → 手臂高举过头
        leftArmRotX = 1.5 + Math.sin(t * 10) * 0.18;
        rightArmRotX = 1.5 + Math.sin(t * 10 + 1) * 0.18;
        leftArmRotZ = 0.35;   // 双臂外展成 V 字形
        rightArmRotZ = -0.35;
        break;
    }

    const lerp = (cur: number, target: number, k = 0.12) =>
      cur + (target - cur) * k;

    character.position.y = lerp(character.position.y, charY, 0.18);
    torso.rotation.x = lerp(torso.rotation.x, torsoLean);
    torso.scale.y = lerp(torso.scale.y, torsoScaleY);
    head.rotation.z = lerp(head.rotation.z, headTiltZ);
    head.rotation.x = lerp(head.rotation.x, headNodX);
    leftArm.rotation.x = lerp(leftArm.rotation.x, leftArmRotX, 0.25);
    rightArm.rotation.x = lerp(rightArm.rotation.x, rightArmRotX, 0.25);
    leftArm.rotation.y = lerp(leftArm.rotation.y, leftArmRotY, 0.2);
    rightArm.rotation.y = lerp(rightArm.rotation.y, rightArmRotY, 0.2);
    leftArm.rotation.z = lerp(leftArm.rotation.z, leftArmRotZ, 0.18);
    rightArm.rotation.z = lerp(rightArm.rotation.z, rightArmRotZ, 0.18);
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setActiveScreen(config.id); // 打开该员工的"工作屏幕"面板
  };

  return (
    <group position={config.position} rotation={[0, config.rotation, 0]}>
      <Desk working={status === "working"} accentColor={department.color} />

      {/* 角色：坐在椅子上，面朝 -z（显示器方向） */}
      <group
        ref={characterRef}
        position={[0, 0, 0.85]}
        onClick={handleClick}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        {/* 躯干（含头和手臂，一起前倾） */}
        <group ref={torsoRef} position={[0, 0.46, 0]}>
          {/* 身体 */}
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[0.42, 0.52, 0.3]} />
            <meshStandardMaterial color={config.shirtColor} flatShading />
          </mesh>

          {/* 头 */}
          <group ref={headRef} position={[0, 0.72, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.3, 0.28, 0.28]} />
              <meshStandardMaterial color={config.skinColor} flatShading />
            </mesh>
            {/* 头发 */}
            <mesh position={[0, 0.12, 0.03]}>
              <boxGeometry args={[0.32, 0.1, 0.3]} />
              <meshStandardMaterial color="#2b2118" flatShading />
            </mesh>
            {/* 眼睛（朝 -z 即面向屏幕） */}
            <mesh position={[-0.07, 0, -0.145]}>
              <boxGeometry args={[0.04, 0.04, 0.01]} />
              <meshStandardMaterial color="#1a1a2e" />
            </mesh>
            <mesh position={[0.07, 0, -0.145]}>
              <boxGeometry args={[0.04, 0.04, 0.01]} />
              <meshStandardMaterial color="#1a1a2e" />
            </mesh>
          </group>

          {/* 左臂（肩部为枢轴，向 -z 前伸） */}
          <group ref={leftArmRef} position={[-0.26, 0.45, 0]}>
            <mesh position={[0, 0, -0.18]} castShadow>
              <boxGeometry args={[0.1, 0.1, 0.38]} />
              <meshStandardMaterial color={config.shirtColor} flatShading />
            </mesh>
            {/* 手 */}
            <mesh position={[0, 0, -0.39]}>
              <boxGeometry args={[0.09, 0.09, 0.08]} />
              <meshStandardMaterial color={config.skinColor} flatShading />
            </mesh>
          </group>

          {/* 右臂 */}
          <group ref={rightArmRef} position={[0.26, 0.45, 0]}>
            <mesh position={[0, 0, -0.18]} castShadow>
              <boxGeometry args={[0.1, 0.1, 0.38]} />
              <meshStandardMaterial color={config.shirtColor} flatShading />
            </mesh>
            <mesh position={[0, 0, -0.39]}>
              <boxGeometry args={[0.09, 0.09, 0.08]} />
              <meshStandardMaterial color={config.skinColor} flatShading />
            </mesh>
          </group>
        </group>

        {/* 大腿（坐姿，朝 -z 伸向桌下） */}
        <mesh position={[-0.11, 0.42, -0.14]} castShadow>
          <boxGeometry args={[0.14, 0.12, 0.36]} />
          <meshStandardMaterial color="#2c3357" flatShading />
        </mesh>
        <mesh position={[0.11, 0.42, -0.14]} castShadow>
          <boxGeometry args={[0.14, 0.12, 0.36]} />
          <meshStandardMaterial color="#2c3357" flatShading />
        </mesh>

        {/* 头顶状态气泡 + 名牌 */}
        <StatusBubble
          status={status}
          name={config.name}
          workingLabel={config.workingLabel}
          overrideText={overrideText}
          accentColor={department.color}
        />
      </group>
    </group>
  );
}
