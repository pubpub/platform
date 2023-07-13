import { Instance } from "../types";
import { Page } from "./Page";

type Props = {
	instance: Instance;
	error?: string;
	updated?: boolean;
};

export const Configure = (props: Props) => {
	return (
		<Page title="Configure Instance" x-data="{ updated: false }" instance={props.instance}>
			<p>Select one or more counting metric(s) to apply to Pub content.</p>
			<fieldset class="checkbox-group" x-data="$store.instance.config">
				<label class="checkbox" for="words">
					<input id="words" type="checkbox" x-on:click="toggleWords" x-bind:checked="words" />
					Words
				</label>
				<label class="checkbox" for="lines">
					<input id="lines" type="checkbox" x-on:click="toggleLines" x-bind:checked="lines" />
					Lines
				</label>
			</fieldset>
			<p x-show="updated" x-transition>
				Updated config!
			</p>
			<script src="/configure.js" />
		</Page>
	);
};
