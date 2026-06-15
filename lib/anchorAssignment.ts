import { EMPLOYEES } from "./employees";
import { WorldAnchor } from "./officeAnchors";
import { EmployeeConfig } from "./types";

/** 确定性伪随机洗牌（同一 seed 结果可复现） */
export function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

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

/** 每次会议/休息打乱座位锚点，再按工位远近配对 */
export function pairEmployeesToAnchorsShuffled<T extends WorldAnchor>(
  anchors: T[],
  employees: EmployeeConfig[] = EMPLOYEES,
  seed: number = Date.now()
): T[] {
  return pairEmployeesToAnchors(seededShuffle(anchors, seed), employees);
}
