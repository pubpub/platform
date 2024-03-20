import { useTransition } from "react";
import { Button } from "ui/button";
import { Loader2, Wand2 } from "ui/icon";

type Props = {
	onClick: () => void;
};

export const EvaluatorSuggestButton = (props: Props) => {
	const [pending, startTransition] = useTransition();
	return (
		<Button
			variant="ghost"
			onClick={(event) => {
				event.preventDefault();
				startTransition(props.onClick);
			}}
			disabled={pending}
		>
			{pending ? <Loader2 className="h-4 w-4" /> : <Wand2 className="h-4 w-4" />}
		</Button>
	);
};
