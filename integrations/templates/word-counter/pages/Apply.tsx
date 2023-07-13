import { Instance } from "../types";
import { Page } from "./Page";

type Props = {
	instance: Instance;
	pubId: string;
};

export const Apply = (props: Props) => {
	return (
		<Page title="apply" instance={props.instance} pubId={props.pubId} x-data="apply">
			<button x-on:click="fetch">Update word counts</button>
			<dl>
				<dt>Words</dt>
				<dd x-text="words"></dd>
				<dt>Lines</dt>
				<dd x-text="lines"></dd>
			</dl>
			<p x-show="updated" x-transition>
				Updated Pub!
			</p>
			<script src="/apply.js" />
		</Page>
	);
};
