import type { EmitEventPayload } from "./emitEvent";

export * from "./emitEvent";

declare global {
	namespace GraphileWorker {
		interface Tasks {
			emitEvent: EmitEventPayload;
		}
	}
}
