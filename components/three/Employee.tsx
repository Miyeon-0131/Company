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

function isAtDesk(
  x: number,
  z: number,
  deskX: number,
  deskZ: number
): boolean {
  return Math.hypot(x - deskX, z - deskZ) < 0.45;
}

export default function Employee({ config }: EmployeeProps) {
  const status = useOfficeStore((s) => s.statuses[config.id] ?? "idle");
  const overrideText = useOfficeStore((s) => s.statusTexts[config.id]);
  const settingsOpen = useOfficeStore((s) => s.settingsOpen);
  const pose = useOfficeStore((s) => s.employeePoses[config.id]);
  const hasTarget = useOfficeStore((s) => s.movementTargets[config.id]);
  const restActivity = useOfficeStore((s) => s.restActivities[config.id]);
  const setActiveScreen = useOfficeStore((s) => s.setActiveScreen);

  const department = getDepartment(config.departmentId);
  const worldX = pose?.x ?? config.position[0];
  const worldZ = pose?.z ?? config.position[2];
  const worldRot = pose?.rotation ?? config.rotation;
  const atDesk =
    !hasTarget &&
    isAtDesk(worldX, worldZ, config.position[0], config.position[2]);

  const rootRef = useRef<Group>(null);
  const characterRef = useRef<Group>(null);
  const torsoRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);
  const sitLegsRef = useRef<Group>(null);
  const standLegsRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const character = characterRef.current;
    const torso = torsoRef.current;
    const head = headRef.current;
    const leftArm = leftArmRef.current;
    const rightArm = rightArmRef.current;
    const leftLeg = leftLegRef.current;
    const rightLeg = rightLegRef.current;
    const sitLegs = sitLegsRef.current;
    const standLegs = standLegsRef.current;
    const root = rootRef.current;
    if (
      !character ||
      !torso ||
      !head ||
      !leftArm ||
      !rightArm ||
      !leftLeg ||
      !rightLeg ||
      !sitLegs ||
      !standLegs ||
      !root
    )
      return;

    // 平滑转向目标朝向
    const rotDiff = worldRot - root.rotation.y;
    root.rotation.y += rotDiff * 0.12;

    const isWalking = status === "walking" || !!hasTarget;
    const isStanding = isWalking || (status === "resting" && restActivity !== "sofa");

    let charY = 0;
    let charForwardZ = 0;
    let torsoLean = 0;
    let torsoScaleY = 1;
    let headTiltZ = 0;
    let headNodX = 0;
    let leftArmRotX = -0.5;
    let rightArmRotX = -0.5;
    let leftArmRotY = 0;
    let rightArmRotY = 0;
    let leftArmRotZ = 0;
    let rightArmRotZ = 0;
    let leftLegRotX = 0;
    let rightLegRotX = 0;

    if (isWalking) {
      charY = Math.abs(Math.sin(t * 10)) * 0.04;
      leftArmRotX = 0.35 + Math.sin(t * 10) * 0.45;
      rightArmRotX = 0.35 + Math.sin(t * 10 + Math.PI) * 0.45;
      leftLegRotX = Math.sin(t * 10) * 0.55;
      rightLegRotX = Math.sin(t * 10 + Math.PI) * 0.55;
    } else {
      switch (status) {
        case "idle":
          torsoScaleY = 1 + Math.sin(t * 1.6) * 0.018;
          headTiltZ = Math.sin(t * 0.7) * 0.05;
          break;

        case "thinking":
          headTiltZ = Math.sin(t * 2.2) * 0.22;
          headNodX = -0.12;
          torsoLean = -0.1;
          leftArmRotX = 0.85;
          leftArmRotY = -0.25;
          break;

        case "working":
          torsoLean = -0.32;
          charForwardZ = -0.22;
          headNodX = -0.1;
          leftArmRotX = -0.62 + Math.sin(t * 16) * 0.22;
          rightArmRotX = -0.62 + Math.sin(t * 16 + Math.PI) * 0.22;
          leftArmRotY = -0.32;
          rightArmRotY = 0.32;
          break;

        case "done":
          charY = Math.abs(Math.sin(t * 5)) * 0.45;
          headNodX = -0.2;
          leftArmRotX = 1.5 + Math.sin(t * 10) * 0.18;
          rightArmRotX = 1.5 + Math.sin(t * 10 + 1) * 0.18;
          leftArmRotZ = 0.35;
          rightArmRotZ = -0.35;
          break;

        case "focusing":
          torsoLean = -0.18;
          charForwardZ = -0.12;
          headNodX = -0.08;
          leftArmRotX = -0.5 + Math.sin(t * 12) * 0.12;
          rightArmRotX = -0.5 + Math.sin(t * 12 + Math.PI) * 0.12;
          leftArmRotY = -0.2;
          rightArmRotY = 0.2;
          break;

        case "resting":
          switch (restActivity) {
            case "sofa":
            case "lounge":
              torsoLean = 0.12;
              headTiltZ = Math.sin(t * 0.5) * 0.04;
              leftArmRotX = -0.2;
              rightArmRotX = -0.2;
              leftArmRotZ = 0.5;
              rightArmRotZ = -0.5;
              break;
            case "coffee":
              torsoLean = 0.05;
              rightArmRotX = -0.9 + Math.sin(t * 3) * 0.08;
              rightArmRotY = 0.15;
              leftArmRotX = -0.35;
              break;
            case "vending":
              rightArmRotX = -1.1;
              rightArmRotY = 0.1;
              headNodX = 0.1;
              break;
            case "water":
              leftArmRotX = -0.75;
              leftArmRotY = -0.15;
              rightArmRotX = -0.4;
              break;
            case "microwave":
              torsoLean = 0.06;
              leftArmRotX = -0.55;
              rightArmRotX = -0.55;
              headNodX = 0.12;
              break;
            default:
              torsoScaleY = 1 + Math.sin(t * 1.2) * 0.015;
              break;
          }
          break;
      }
    }

    const lerp = (cur: number, target: number, k = 0.12) =>
      cur + (target - cur) * k;

    character.position.y = lerp(character.position.y, charY, 0.18);
    character.position.z = lerp(character.position.z, isStanding ? 0 : 0.85 + charForwardZ, 0.15);
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
    leftLeg.rotation.x = lerp(leftLeg.rotation.x, leftLegRotX, 0.2);
    rightLeg.rotation.x = lerp(rightLeg.rotation.x, rightLegRotX, 0.2);

    const standVis = lerp(standLegs.scale.y, isStanding ? 1 : 0.001, 0.15);
    const sitVis = lerp(sitLegs.scale.y, isStanding ? 0.001 : 1, 0.15);
    standLegs.scale.set(1, standVis, 1);
    sitLegs.scale.set(1, sitVis, 1);
    standLegs.visible = standVis > 0.05;
    sitLegs.visible = sitVis > 0.05;
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setActiveScreen(config.id);
  };

  const charYOffset = 0;
  const showDesk = atDesk;

  return (
    <group ref={rootRef} position={[worldX, 0, worldZ]} rotation={[0, worldRot, 0]}>
      {showDesk && (
        <Desk working={status === "working"} accentColor={department.color} />
      )}

      <group
        ref={characterRef}
        position={[0, charYOffset, 0.85]}
        onClick={handleClick}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <group ref={torsoRef} position={[0, 0.46, 0]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[0.42, 0.52, 0.3]} />
            <meshStandardMaterial color={config.shirtColor} flatShading />
          </mesh>

          <group ref={headRef} position={[0, 0.72, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.3, 0.28, 0.28]} />
              <meshStandardMaterial color={config.skinColor} flatShading />
            </mesh>
            <mesh position={[0, 0.12, 0.03]}>
              <boxGeometry args={[0.32, 0.1, 0.3]} />
              <meshStandardMaterial color="#2b2118" flatShading />
            </mesh>
            <mesh position={[-0.07, 0, -0.145]}>
              <boxGeometry args={[0.04, 0.04, 0.01]} />
              <meshStandardMaterial color="#1a1a2e" />
            </mesh>
            <mesh position={[0.07, 0, -0.145]}>
              <boxGeometry args={[0.04, 0.04, 0.01]} />
              <meshStandardMaterial color="#1a1a2e" />
            </mesh>
          </group>

          <group ref={leftArmRef} position={[-0.26, 0.45, 0]}>
            <mesh position={[0, 0, -0.18]} castShadow>
              <boxGeometry args={[0.1, 0.1, 0.38]} />
              <meshStandardMaterial color={config.shirtColor} flatShading />
            </mesh>
            <mesh position={[0, 0, -0.39]}>
              <boxGeometry args={[0.09, 0.09, 0.08]} />
              <meshStandardMaterial color={config.skinColor} flatShading />
            </mesh>
          </group>

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

        {/* 坐姿大腿 */}
        <group ref={sitLegsRef}>
          <mesh position={[-0.11, 0.42, -0.14]} castShadow>
            <boxGeometry args={[0.14, 0.12, 0.36]} />
            <meshStandardMaterial color="#2c3357" flatShading />
          </mesh>
          <mesh position={[0.11, 0.42, -0.14]} castShadow>
            <boxGeometry args={[0.14, 0.12, 0.36]} />
            <meshStandardMaterial color="#2c3357" flatShading />
          </mesh>
        </group>

        {/* 站立行走：小腿 + 鞋子 */}
        <group ref={standLegsRef} position={[0, 0, 0]}>
          <group ref={leftLegRef} position={[-0.11, 0.48, 0]}>
            <mesh position={[0, -0.22, 0]} castShadow>
              <boxGeometry args={[0.13, 0.44, 0.14]} />
              <meshStandardMaterial color="#2c3357" flatShading />
            </mesh>
            <mesh position={[0, -0.48, 0.03]} castShadow>
              <boxGeometry args={[0.15, 0.08, 0.22]} />
              <meshStandardMaterial color="#1a1f36" flatShading />
            </mesh>
          </group>
          <group ref={rightLegRef} position={[0.11, 0.48, 0]}>
            <mesh position={[0, -0.22, 0]} castShadow>
              <boxGeometry args={[0.13, 0.44, 0.14]} />
              <meshStandardMaterial color="#2c3357" flatShading />
            </mesh>
            <mesh position={[0, -0.48, 0.03]} castShadow>
              <boxGeometry args={[0.15, 0.08, 0.22]} />
              <meshStandardMaterial color="#1a1f36" flatShading />
            </mesh>
          </group>
        </group>

        <StatusBubble
          employeeId={config.id}
          status={status}
          name={config.name}
          workingLabel={config.workingLabel}
          overrideText={overrideText}
          accentColor={department.color}
          hideLabels={settingsOpen}
        />
      </group>
    </group>
  );
}
