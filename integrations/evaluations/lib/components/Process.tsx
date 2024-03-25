import { EvaluatorWhoAccepted } from "../types";

type Props = {
	deadline: Date;
	managersNotes: string;
};

export const Process = (props: Props) => {
	return (
		<>
			<p>
				Early deadline, for $100 prompt evaluation bonus (+$300 base):{" "}
				{new Date(
					props.deadline.getTime() - 21 * (1000 * 60 * 60 * 24)
				).toLocaleDateString()}
			</p>
			<p>Final deadline, for $300 base honorarium: {props.deadline.toLocaleDateString()}</p>
			{props.managersNotes && (
				<>
					<h2>Manager's Notes</h2>
					<p>
						<em>
							The Evaluation Manager may suggest specific aspects of the research work
							to focus on, or offer other suggestions here.
						</em>
					</p>
					<p>{props.managersNotes}</p>
				</>
			)}
			<h2>About our evaluation process</h2>
			<p>We ask evaluators to:</p>
			<ol>
				<li>
					Write an evaluation: essentially a high-quality referee report. Consider{" "}
					<a
						target="_blank"
						href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/policies-projects-evaluation-workflow/evaluation/guidelines-for-evaluators/conventional-guidelines-for-referee-reports"
					>
						standard guidelines
					</a>{" "}
					as well as{" "}
					<a
						target="_blank"
						href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/policies-projects-evaluation-workflow/evaluation/guidelines-for-evaluators#overall-assessment"
					>
						The Unjournal's emphases
					</a>
					.
				</li>
				<li>
					Give a set of{" "}
					<a
						target="_blank"
						href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/policies-projects-evaluation-workflow/evaluation/guidelines-for-evaluators#quantitative-metrics"
					>
						quantitative metrics and predictions
					</a>
					.
				</li>
				<li>Answer a short questionnaire about your background and our processes.</li>
			</ol>
			<p>
				<em>
					You can read the full guidelines{" "}
					<a
						target="_blank"
						href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/policies-projects-evaluation-workflow/evaluation/guidelines-for-evaluators#publishing-and-signing-reviews-considerations-exceptions"
					>
						here
					</a>
				</em>
				.
			</p>
			<p>
				We compensate evaluators as a sign that we{" "}
				<a
					target="_blank"
					href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/policies-projects-evaluation-workflow/evaluation/why-pay-evaluators-reviewers"
				>
					value this work
				</a>
				. In addition to the compensation mentioned above, we also set aside $150 per
				evaluation to offer incentives and prizes for particularly strong work.
			</p>
			<p>
				Your evaluation will be made public and given a DOI, but you have the option to
				remain anonymous or to be identified as the author .
			</p>
		</>
	);
};
