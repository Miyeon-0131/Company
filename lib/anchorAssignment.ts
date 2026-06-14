import { EMPLOYEES } from "./employees";
import { WorldAnchor } from "./officeAnchors";
import { EmployeeConfig } from "./types";

/** 按工位空间位置把员工一对一配到锚点，避免扎堆抢同侧入口 */
export function pairEmployeesToAnchors<T extends WorldAnchor>(
  anchors: T[],
  employees: EmployeeConfig[] = EMPLOYEES
): T[] {
  const sortedAnchors = [...anchors].sort(
    (a, b) => a.x - b.x || a.z - b.z
  );
  const order = employees
    .map((emp, index) => ({ emp, index }))
    .sort(
      (a, b) =>
        a.emp.position[0] - b.emp.position[0] ||
        a.emp.position[2] - b.emp.position[2]
    );

  const assigned = new Array<T>(employees.length);
  order.forEach(({ index }, rank) => {
    assigned[index] = sortedAnchors[rank % sortedAnchors.length]!;
  });
  return assigned;
}
