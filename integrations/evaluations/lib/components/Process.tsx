import { EvaluatorWhoAccepted } from "../types";

type Props = {
	evaluator: EvaluatorWhoAccepted;
};

export const Process = (props: Props) => {
	const deadline = new Date(props.evaluator.deadline);

	return (
		<>
			<p>
				We strongly encourage evaluators to complete evaluations relatively quickly, for the
				benefit of authors, research-users, and the evaluation ecosystem. If you submit the
				evaluation within that window (by{" "}
				{new Date(deadline.getTime() - 21 * (1000 * 60 * 60 * 24)).toLocaleDateString()} ),
				you will receive a $100 “prompt evaluation bonus.” After{" "}
				{deadline.toLocaleDateString()}, we will consider re-assigning the evaluation, and
				later submissions may not be eligible for the full baseline compensation.
			</p>
			<h2>About our evaluation process</h2>
			<p>
				As a sign that we{" "}
				<a
					target="_blank"
					href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/policies-projects-evaluation-workflow/evaluation/why-pay-evaluators-reviewers"
				>
					value this work
				</a>
				, we offer evaluators a $400 honorarium for completing the assignment by the
				specified deadline, and we are also setting aside $150 per evaluation for evaluator
				incentives and prizes.
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
			<p>We ask evaluators to:</p>
			<ol>
				<li>
					Write a review: a 'standard high-quality referee report,' with some{" "}
					<a
						target="_blank"
						href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/policies-projects-evaluation-workflow/evaluation/guidelines-for-evaluators#specific-requests-for-focus-or-feedback"
					>
						specific considerations
					</a>
					.
				</li>
				<li>
					Give{" "}
					<a
						target="_blank"
						href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/policies-projects-evaluation-workflow/evaluation/guidelines-for-evaluators#metrics-overall-assessment-categories"
					>
						quantitative metrics and predictions
					</a>
					.
				</li>
				<li>
					Answer a{" "}
					<a
						target="_blank"
						href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/policies-projects-evaluation-workflow/evaluation/guidelines-for-evaluators#survey-questions"
					>
						short questionnaire
					</a>{" "}
					about your background and our processes.
				</li>
			</ol>
			<p>
				You can read the full guidelines{" "}
				<a
					target="_blank"
					href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/policies-projects-evaluation-workflow/evaluation/guidelines-for-evaluators#publishing-and-signing-reviews-considerations-exceptions"
				>
					here
				</a>{" "}
				(or{" "}
				<a
					target="_blank"
					href="https://www.dropbox.com/s/jzxz11gmkrh8lbn/evaluations_as_pdf.pdf?dl=0"
				>
					download the pdf
				</a>
				).
			</p>
		</>
	);
};
