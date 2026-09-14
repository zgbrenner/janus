import {
  createEnvironmentRpcCommand,
  createEnvironmentRpcQueryAtomFamily,
} from "@t3tools/client-runtime/state/runtime";
import { WS_METHODS } from "@t3tools/contracts";
import { connectionAtomRuntime } from "../connection/runtime";

export const knowledgeListQuery = createEnvironmentRpcQueryAtomFamily(connectionAtomRuntime, {
  label: "environment-data:knowledge:list",
  tag: WS_METHODS.knowledgeList,
  staleTimeMs: 5_000,
  idleTtlMs: 60_000,
});

export const knowledgeReadQuery = createEnvironmentRpcQueryAtomFamily(connectionAtomRuntime, {
  label: "environment-data:knowledge:read",
  tag: WS_METHODS.knowledgeRead,
  staleTimeMs: 5_000,
  idleTtlMs: 60_000,
});

export const knowledgeWriteCommand = createEnvironmentRpcCommand(connectionAtomRuntime, {
  label: "environment-command:knowledge:write",
  tag: WS_METHODS.knowledgeWrite,
});
