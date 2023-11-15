import { useTransition } from "react";
import { Button, Icon } from "ui";

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
			{pending ? <Icon.Loader2 className="h-4 w-4" /> : <Icon.Wand2 className="h-4 w-4" />}
		</Button>
	);
};
