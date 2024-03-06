import { registerAction } from "./actions/init";
import { actions } from "./actions";

export async function register() {
	for (const { action } of Object.values(actions)) {
		console.log(`Registering action ${action.name}`);
		await registerAction(action);
	}
}
