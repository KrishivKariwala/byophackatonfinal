import { handle, body } from "@/lib/api";
import { createSchedule, type ScheduleInput } from "@/lib/p2/recurring";
import { getActor } from "@/lib/session";

export async function POST(req: Request) {
  return handle(async () => createSchedule(await getActor(), await body<ScheduleInput>(req)));
}
