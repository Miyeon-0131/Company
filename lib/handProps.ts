import { HandPropId } from "@/components/three/employeeProps";
import { AgentStatus, IdleActivity, RestActivity } from "./types";

export function resolveHandProps(
  status: AgentStatus,
  idleActivity: IdleActivity,
  restActivity: RestActivity | null | undefined
): { right: HandPropId | null; left: HandPropId | null } {
  if (status === "idle") {
    switch (idleActivity) {
      case "coffee":
        return { right: "coffee-mug", left: null };
      case "phone":
        return { right: "phone", left: null };
      default:
        return { right: null, left: null };
    }
  }

  if (status === "focusing") {
    return { right: "pen", left: "notebook" };
  }

  if (status === "resting" && restActivity) {
    switch (restActivity) {
      case "coffee":
        return { right: "coffee-paper", left: null };
      case "vending":
        return { right: "soda", left: null };
      case "water":
        return { right: null, left: "water" };
      case "microwave":
        return { right: "bento", left: null };
      case "sofa":
        return { right: "phone", left: null };
      case "lounge":
        return { right: "magazine", left: null };
      default:
        return { right: null, left: null };
    }
  }

  return { right: null, left: null };
}
