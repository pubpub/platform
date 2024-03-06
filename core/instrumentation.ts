import { registerAction, registerCorePubField } from "./actions/init";
import { actions } from "./actions";
import { corePubFields } from "./actions/corePubFields";

export async function register() {
	for (const corePubField of corePubFields) {
		console.log(`Registering core field ${corePubField.slug}`);
		await registerCorePubField(corePubField);
	}
	for (const { action } of Object.values(actions)) {
		console.log(`Registering action ${action.name}`);
		await registerAction(action);
	}
}
