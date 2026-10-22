export const FLOW = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["out_for_delivery", "delivered"],
  out_for_delivery: ["delivered"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};
export const STATUSES = Object.keys(FLOW);
export const RETURN_STATUSES = ["requested", "approved", "picked_up", "refunded", "rejected"];
export const ISSUE_STATUSES = ["open", "in_progress", "resolved"];
