import { SuggestedMembersQuery } from "@pubpub/sdk";
import { useTransition } from "react";
import { Button, Icon } from "ui";

type Props = {
	index: number;
	icon: React.ReactNode;
	query: SuggestedMembersQuery;
	disabled?: boolean;
	onClick: (key: number, query: SuggestedMembersQuery) => void;
};

export const EvaluatorSuggestButton = (props: Props) => {
	const disabled = props.disabled ?? false;
	const [pending, startTransition] = useTransition();
	return (
		<Button
			variant="ghost"
			onClick={(event) => {
				event.preventDefault();
				startTransition(() => props.onClick(props.index, props.query));
			}}
			disabled={pending}
		>
			{disabled ? (
				props.icon
			) : pending ? (
				<Icon.Loader2 className="h-4 w-4" />
			) : (
				<Icon.Wand2 className="h-4 w-4" />
			)}
		</Button>
	);
};
