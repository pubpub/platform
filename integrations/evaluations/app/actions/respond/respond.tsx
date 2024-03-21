"use client";

import { GetPubResponseBody, User } from "@pubpub/sdk";
import { useCallback } from "react";
import { Button } from "ui/button";
import { toast } from "ui/use-toast";
import { calculateDeadline } from "~/lib/emails";
import { InstanceConfig } from "~/lib/types";
import { accept, decline } from "./actions";

type Props = {
	intent: "accept" | "decline" | "info";
	instanceId: string;
	instanceConfig: InstanceConfig;
	pub: GetPubResponseBody;
	evaluationManager: User;
};

const AboutUnjournal = () => {
	return (
		<>
			<h2>About The Unjournal</h2>
			<p>
				<em>We are not a journal!</em>{" "}
				<a target="_blank" href="https://unjournal.org">
					<em>The Unjournal</em>
				</a>{" "}
				does not 'publish any papers in a journal'; we organize and fund public,
				journal-independent feedback, rating, and evaluation of hosted papers and
				dynamically presented research projects.
			</p>
			<p>
				Peer review is great, but conventional academic publication processes are wasteful,
				slow, and rent-extracting. They discourage innovation and prompt researchers to
				focus more on 'gaming the system' than on the quality of their research. We provide
				an immediate alternative and at the same time offer a bridge to a more efficient,
				informative, useful, and transparent research evaluation system.
			</p>
			<p>
				Our evaluations and ratings are hosted here on PubPub, along with manager summaries,
				author responses, and links to the research being evaluated. Each evaluation and
				response is given a DOI and indexed by bibliometrics and academic search engines
				(such as Google Scholar).
			</p>
			<p>
				Our initial focus is quantitative work that informs global priorities, especially in
				economics, policy, and social science. We encourage better research by making it
				easier for researchers to get feedback and credible ratings on their work.
			</p>
			<p>
				<em>The Unjournal</em> does not charge any fees. In fact, we{" "}
				<a
					target="_blank"
					href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/policies-projects-evaluation-workflow/evaluation/why-pay-evaluators-reviewers"
				>
					compensate evaluators
				</a>{" "}
				for their time, and award prizes for strong work.
			</p>
			<p>
				Read more about us{" "}
				<a
					target="_blank"
					href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/readme-1#in-a-nutshell"
				>
					here
				</a>
				, including our{" "}
				<a
					target="_blank"
					href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/readme-1#funding"
				>
					funding sources
				</a>
				.
			</p>
		</>
	);
};

const EvaluationProcess = () => {
	return (
		<>
			<h2>About our evaluation process</h2>
			<p>
				As a sign that we{" "}
				<a
					target="_blank"
					href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/policies-projects-evaluation-workflow/evaluation/why-pay-evaluators-reviewers"
				>
					value this work
				</a>
				, we offer evaluators a $300 honorarium for completing the assignment by the
				deadline. Evaluators may earn an additional $100 “prompt evaluation bonus” for
				completing the assignment promptly (see below). As of February 2024, we are also
				currently setting aside $150 per evaluation for evaluator incentives and prizes.
			</p>
			<p>
				Your evaluation will be made public and given a DOI, but you have the option to{" "}
				<a
					target="_blank"
					href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/policies-projects-evaluation-workflow/evaluation/guidelines-for-evaluators#that-this-review-and-ratings-will-be-made-public"
				>
					remain anonymous or to be identified as the author
				</a>
				.
			</p>
			<p>We ask evaluators to:</p>
			<ol>
				<li>
					Write an evaluation: essentially a high-quality referee report, considering{" "}
					<a
						target="_blank"
						href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/policies-projects-evaluation-workflow/evaluation/guidelines-for-evaluators#the-unjournals-criteria"
					>
						The Unjournal's guidelines
					</a>
					. Please try to address any specific considerations mentioned in the manager’s
					notes above, or any specific requests from the evaluation manager.
				</li>
				<li>
					Give{" "}
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
				You can read the full guidelines{" "}
				<a
					target="_blank"
					href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/policies-projects-evaluation-workflow/evaluation/guidelines-for-evaluators#publishing-and-signing-reviews-considerations-exceptions"
				>
					here
				</a>
				.
			</p>
		</>
	);
};

export const Respond = (props: Props) => {
	const onAccept = useCallback(async () => {
		const result = await accept(props.instanceId, props.pub.id);
		if (result?.error) {
			toast({
				title: "Error",
				description: "There was an error accepting this submission.",
				variant: "destructive",
			});
		}
	}, []);
	const onDecline = useCallback(async () => {
		const result = await decline(props.instanceId, props.pub.id);
		if (result?.error) {
			toast({
				title: "Error",
				description: "There was an error declining this submission.",
				variant: "destructive",
			});
		}
	}, []);

	const submissionUrl = props.pub.values["unjournal:url"] as string;
	const submissionTitle = props.pub.values[props.instanceConfig.titleFieldSlug] as string;
	const submissionAbstract = props.pub.values["unjournal:description"] as string;
	const deadline = calculateDeadline(
		{
			deadlineLength: props.instanceConfig.deadlineLength,
			deadlineUnit: props.instanceConfig.deadlineUnit,
		},
		new Date(Date.now())
	);

	return (
		<div className="prose max-w-none">
			{props.intent === "info" && (
				<p>
					Thanks for following up. Below, we provide more information about the evaluation
					we are inviting you to do, and about{" "}
					<a target="_blank" href="https://unjournal.org">
						<em>The Unjournal</em>
					</a>{" "}
					and our processes. When you are ready, please indicate your decision at the
					bottom of this page (e.g., Accept or Decline).
				</p>
			)}
			{props.intent === "accept" && (
				<p>
					Thanks for your interest in doing an evaluation for{" "}
					<a target="_blank" href="https://unjournal.org">
						<em>The Unjournal</em>
					</a>
					! Please confirm your acceptance below.
				</p>
			)}
			<h2>About the research</h2>
			<p>
				<em>The details of the research we are asking you to evaluate.</em>
			</p>
			<h3>{submissionTitle}</h3>
			{submissionAbstract ? (
				<p>
					<strong>Abstract:</strong> {submissionAbstract}
				</p>
			) : (
				<p>
					<em>No abstract provided.</em>
				</p>
			)}
			{submissionUrl && (
				<p>
					<a target="_blank" href={submissionUrl}>
						Link to research
					</a>
				</p>
			)}
			{props.intent === "accept" && (
				<>
					<h2>Confirm</h2>
					<p>
						We strongly encourage evaluators to complete evaluations relatively quickly,
						for the benefit of authors, research-users, and the evaluation ecosystem. If
						you submit the evaluation within that window (by{" "}
						<strong>
							{new Date(
								deadline.getTime() - 21 * (1000 * 60 * 60 * 24)
							).toLocaleDateString()}
						</strong>
						), you will receive a $100 “prompt evaluation bonus,” in addition to the
						baseline $300 honorarium, in addition to the baseline $300 honorarium, as
						well as other potential evaluator incentives and prizes. After{" "}
						<strong>{new Date(deadline.getTime()).toLocaleDateString()}</strong>, we
						will consider re-assigning the evaluation, and later submissions may not be
						eligible for the full baseline compensation.
					</p>
					<div className="flex gap-1">
						<Button onClick={onAccept}>Accept</Button>
						{props.evaluationManager && (
							<a href={`mailto:${props.evaluationManager.email}`}>
								<Button>
									Email {props.evaluationManager.firstName}{" "}
									{props.evaluationManager.lastName}
								</Button>
							</a>
						)}
					</div>
					<h2>Changed your mind?</h2>
					<p>
						If you have changed your mind and decided you will not be able to conduct
						this evaluation, you may choose 'Decline' below. (But we would also love to
						get your feedback on why you made this decision — please do contact us.)
					</p>
					<Button onClick={onDecline}>Decline</Button>
				</>
			)}
			<AboutUnjournal />
			<EvaluationProcess />
			{props.intent === "info" && (
				<>
					<h2>To respond to our invitation...</h2>
					<p>
						To agree to take on this assignment, please click the ‘Accept’ button below.
						If you have questions at this point, please select ‘Contact Evaluation
						Manager’. If you cannot accept our invitation, please choose ‘Decline’
						below. We strongly encourage evaluators to complete evaluations relatively
						quickly, for the benefit of authors, research-users, and the evaluation
						ecosystem. If you submit the evaluation within that window (by{" "}
						<strong>
							{new Date(
								deadline.getTime() - 21 * (1000 * 60 * 60 * 24)
							).toLocaleDateString()}
						</strong>
						), you will receive a $100 “prompt evaluation bonus,” in addition to the
						baseline $300 honorarium, as well as other potential evaluator incentives
						and prizes. After{" "}
						<strong>{new Date(deadline.getTime()).toLocaleDateString()}</strong>, we
						will consider re-assigning the evaluation, and later submissions may not be
						eligible for the full baseline compensation.
					</p>
					<div className="flex gap-1">
						<Button onClick={onAccept}>Accept</Button>
						{props.evaluationManager && (
							<a href={`mailto:${props.evaluationManager.email}`}>
								<Button>
									Email {props.evaluationManager.firstName}{" "}
									{props.evaluationManager.lastName}
								</Button>
							</a>
						)}
						<Button onClick={onDecline}>Decline</Button>
					</div>
				</>
			)}
		</div>
	);
};
