import { Card, CardContent } from "ui";

export type Props = {
	title: string;
	abstract: string;
	evaluating?: boolean;
	url: string;
};

export const Research = (props: Props) => {
	return (
		<>
			{props.evaluating ? (
				<>
					<h2>The Unjournal: Evaluation Form</h2>
					<h3>You have been asked to evaluate the following research:</h3>
				</>
			) : (
				<>
					<h2>About the research</h2>
					<p>
						<em>The details about the research we are asking you to evaluate.</em>
					</p>
				</>
			)}
			<Card>
				<CardContent>
					<h3>{props.title}</h3>
					{props.abstract ? (
						<p>
							<strong>Abstract:</strong> {props.abstract}
						</p>
					) : (
						<p>
							<em>No abstract provided.</em>
						</p>
					)}
					{props.url && (
						<p>
							<a target="_blank" href={props.url}>
								View or download the original.
							</a>
						</p>
					)}
				</CardContent>
			</Card>
		</>
	);
};
