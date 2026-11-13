import { RideStatus, UserRole } from "@/lib/schemas/database";

export interface StateTransitionRule {
  allowedNext: RideStatus[];
  allowedActors: Record<RideStatus, UserRole[]>;
}

export const RIDE_STATE_TRANSITIONS: Record<RideStatus, StateTransitionRule> = {
  requested: {
    allowedNext: ["accepted", "reassigning", "cancelled", "expired"],
    allowedActors: {
      accepted: ["driver", "admin"],
      reassigning: ["admin"],
      cancelled: ["passenger", "admin"],
      expired: ["admin"],
      requested: [],
      arriving: [],
      ongoing: [],
      completed: [],
      unassigned: [],
    },
  },
  accepted: {
    allowedNext: ["arriving", "reassigning", "cancelled"],
    allowedActors: {
      arriving: ["driver", "admin"],
      reassigning: ["driver", "admin"],
      cancelled: ["passenger", "driver", "admin"],
      accepted: [],
      requested: [],
      ongoing: [],
      completed: [],
      expired: [],
      unassigned: [],
    },
  },
  arriving: {
    allowedNext: ["ongoing", "reassigning", "cancelled"],
    allowedActors: {
      ongoing: ["driver", "admin"],
      reassigning: ["admin"],
      cancelled: ["passenger", "driver", "admin"],
      arriving: [],
      accepted: [],
      requested: [],
      completed: [],
      expired: [],
      unassigned: [],
    },
  },
  ongoing: {
    allowedNext: ["completed", "cancelled"],
    allowedActors: {
      completed: ["driver", "admin"],
      cancelled: ["admin"],
      ongoing: [],
      arriving: [],
      accepted: [],
      requested: [],
      reassigning: [],
      expired: [],
      unassigned: [],
    },
  },
  completed: {
    allowedNext: [],
    allowedActors: {} as Record<RideStatus, UserRole[]>,
  },
  cancelled: {
    allowedNext: [],
    allowedActors: {} as Record<RideStatus, UserRole[]>,
  },
  expired: {
    allowedNext: [],
    allowedActors: {} as Record<RideStatus, UserRole[]>,
  },
  unassigned: {
    allowedNext: [],
    allowedActors: {} as Record<RideStatus, UserRole[]>,
  },
  reassigning: {
    allowedNext: ["requested", "unassigned", "cancelled"],
    allowedActors: {
      requested: ["admin"],
      unassigned: ["admin"],
      cancelled: ["admin"],
      reassigning: [],
      accepted: [],
      arriving: [],
      ongoing: [],
      completed: [],
      expired: [],
    },
  },
};

export function isValidRideTransition(
  current: RideStatus,
  next: RideStatus,
  actorRole: UserRole
): { valid: boolean; error?: string } {
  const rule = RIDE_STATE_TRANSITIONS[current];
  if (!rule) {
    return { valid: false, error: `Invalid current state: ${current}` };
  }

  if (rule.allowedNext.length === 0) {
    return { valid: false, error: `Ride is in terminal state '${current}' and cannot be altered.` };
  }

  if (!rule.allowedNext.includes(next)) {
    return {
      valid: false,
      error: `Illegal state transition from '${current}' to '${next}'. Allowed: [${rule.allowedNext.join(", ")}]`,
    };
  }

  const authorizedActors = rule.allowedActors[next] || [];
  if (!authorizedActors.includes(actorRole)) {
    return {
      valid: false,
      error: `Role '${actorRole}' is not authorized to transition ride from '${current}' to '${next}'.`,
    };
  }

  return { valid: true };
}
