/** 会议室椅子布局（局部坐标，原点在房间中心） */

/** 会议桌：中心 z=0.4，半宽 x=0.85，半长 z=2.3（与 MeetingRoom 一致） */
const TABLE_CENTER_Z = 0.4;
const TABLE_HALF_X = 0.85;
const TABLE_HALF_Z = 2.3;

/** 椅心到桌边的间距（与短边一致） */
const CHAIR_TABLE_GAP = 0.75;

/** 长边椅 x：桌边 + 间距 */
export const MEETING_SIDE_X = TABLE_HALF_X + CHAIR_TABLE_GAP;

/** 长边 4 椅，沿 z 等间距 0.9m */
export const MEETING_LONG_SIDE_Z = [-0.95, -0.05, 0.85, 1.75] as const;

/** 短边各 1 椅：北端 / 南端 */
export const MEETING_SHORT_CHAIRS = [
  { x: 0, z: TABLE_CENTER_Z - TABLE_HALF_Z - CHAIR_TABLE_GAP, rotation: Math.PI },
  { x: 0, z: TABLE_CENTER_Z + TABLE_HALF_Z + CHAIR_TABLE_GAP, rotation: 0 },
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
