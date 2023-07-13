import { Instance } from "../types";
import { Page } from "./Page";

type Props = {
	instance?: Instance;
};

export const Apply = (props: Props) => {
	return (
		<Page title="apply">
			{props.instance ? (
				<>
					<p>Words: {String(props.instance.config.words)}</p>
					<p>Lines: {String(props.instance.config.lines)}</p>
				</>
			) : (
				<p>Instance has not been configured.</p>
			)}
		</Page>
	);
};
