import "server-only";
import { redirect } from "next/navigation";
import { getActor } from "./session";
import { sweep } from "./services";
import type { Profile, Role } from "./types";

/** Server-side page guard. Roles come from the stored profile, never from the browser. */
export async function requirePage(role: Role): Promise<Profile> {
  await sweep();
  const actor = await getActor();
  if (!actor) redirect("/signin");
  if (actor.role !== role) redirect("/signin?wrongRole=1");
  return actor;
}
