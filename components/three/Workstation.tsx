"use client";

import { useOfficeStore } from "@/lib/store";
import { getDepartment } from "@/lib/employees";
import { EmployeeConfig } from "@/lib/types";
import Desk from "./Desk";

/** 固定工位：员工离开去开会/休息时，电脑桌椅仍留在原位 */
export default function Workstation({
  config,
}: {
  config: EmployeeConfig;
}) {
  const status = useOfficeStore((s) => s.statuses[config.id] ?? "idle");
  const department = getDepartment(config.departmentId);

  return (
    <group
      position={config.position}
      rotation={[0, config.rotation, 0]}
    >
      <Desk
        working={status === "working"}
        accentColor={department.color}
      />
    </group>
  );
}
