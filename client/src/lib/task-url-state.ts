import { parseAsString, parseAsStringLiteral, throttle } from "nuqs"

/**
 * All query keys used for the task UI (list filters + new-task draft).
 * Persisted in the location bar via nuqs so refresh keeps the same view.
 */
export const taskListUrlParsers = {
  fStatus: parseAsStringLiteral(["all", "todo", "in-progress", "done"] as const).withDefault("all"),
  fPriority: parseAsStringLiteral(["all", "low", "medium", "high"] as const).withDefault("all"),
  newTitle: parseAsString
    .withDefault("")
    .withOptions({ limitUrlUpdates: throttle(300), history: "replace" }),
  newDescription: parseAsString
    .withDefault("")
    .withOptions({ limitUrlUpdates: throttle(300), history: "replace" }),
  newStatus: parseAsStringLiteral(["todo", "in-progress", "done"] as const).withDefault("todo"),
  newPriority: parseAsStringLiteral(["low", "medium", "high"] as const).withDefault("medium"),
} as const
