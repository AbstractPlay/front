/* eslint-env node */
/** Shared ap:service / ap:stage values for AWS cost allocation (Cost Explorer). */

export const AP_FRONT_SERVICE = "apfront";

export function apCostAllocationTagItems(stage) {
  return [
    { Key: "ap:service", Value: AP_FRONT_SERVICE },
    { Key: "ap:stage", Value: stage },
  ];
}
