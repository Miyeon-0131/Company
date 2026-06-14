/** 会议室椅子布局（局部坐标，原点在房间中心） */

export const MEETING_SIDE_X = 1.5;

/** 长边 4 椅，沿 z 等间距 0.9m */
export const MEETING_LONG_SIDE_Z = [-0.95, -0.05, 0.85, 1.75] as const;

/** 短边各 1 椅：北端 / 南端 */
export const MEETING_SHORT_CHAIRS = [
  { x: 0, z: -2.5, rotation: Math.PI },
  { x: 0, z: 3.3, rotation: 0 },
] as const;

export type MeetingChairSpec = {
  x: number;
  z: number;
  rotation: number;
};

/** 全部 10 把会议椅（4 + 4 + 1 + 1） */
export function meetingChairSpecs(): MeetingChairSpec[] {
  const longSide: MeetingChairSpec[] = [
    ...MEETING_LONG_SIDE_Z.map((z) => ({
      x: -MEETING_SIDE_X,
      z,
      rotation: -Math.PI / 2,
    })),
    ...MEETING_LONG_SIDE_Z.map((z) => ({
      x: MEETING_SIDE_X,
      z,
      rotation: Math.PI / 2,
    })),
    ...MEETING_SHORT_CHAIRS,
  ];
  return longSide;
}
