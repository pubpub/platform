import { EvaluatorWhoAccepted } from "../types";

type Props = {
	deadline: Date;
};

export const Process = (props: Props) => {
	return (
		<>
			<p>
				Deadline for promptness bonus:{" "}
				{new Date(
					props.deadline.getTime() - 21 * (1000 * 60 * 60 * 24)
				).toLocaleDateString()}
			</p>
			<p>Final deadline: {props.deadline.toLocaleDateString()}</p>
			<h2>About our evaluation process</h2>
			<p>
				We ask evaluators to:
				<ol>
					<li>
						Write an evaluation; essentially a high-quality referee report. Consider{" "}
						<a
							target="_blank"
							href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/policies-projects-evaluation-workflow/evaluation/guidelines-for-evaluators/conventional-guidelines-for-referee-reports"
						>
							standard guidelines
						</a>{" "}
						as well as{" "}
						<a
							href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/policies-projects-evaluation-workflow/evaluation/guidelines-for-evaluators#the-unjournals-criteria"
							target="_blank"
						>
							The Unjournal’s emphases
						</a>
						. Write a review: a “standard high-quality referee report,” with some
						specific considerations. Please try to address any specific considerations
						mentioned in our bespoke evaluation notes, or any specific requests from the
						evaluation manager.
					</li>
					<li>Give quantitative metrics and predictions.</li>
					<li>Answer a short questionnaire about your background and our processes.</li>
				</ol>
			</p>
			<p>
				We suggest that you read and consult our the full evaluation guidelines{" "}
				<a
					target="_blank"
					href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/policies-projects-evaluation-workflow/evaluation/guidelines-for-evaluators#publishing-and-signing-reviews-considerations-exceptions"
				>
					here
				</a>{" "}
				(or download the pdf, with all boxes unfolded).
			</p>
			<p>
				As a sign that we{" "}
				<a
					target="_blank"
					href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/policies-projects-evaluation-workflow/evaluation/why-pay-evaluators-reviewers"
				>
					value this work
				</a>
				, we offer a $300 honorarium for evaluations submitted before the deadline, and an
				additional $100 bonus for completing the assignment within three weeks from the date
				you accepted. We are also setting aside $150 per evaluation for evaluator incentives
				and prizes.
			</p>
			<p>
				Your evaluation will be made public and given a DOI, but you have the option to{" "}
				<a
					target="_blank"
					href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/policies-projects-evaluation-workflow/evaluation/guidelines-for-evaluators#that-this-review-and-ratings-will-be-made-public"
				>
					remain anonymous or to 'sign your review'
				</a>{" "}
				and take credit.
			</p>
		</>
	);
};
