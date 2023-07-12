import { jsx } from "./jsx";

type Props =
	| { wordCount: number }
	| { lineCount: number }
	| { wordCount: number; lineCount: number };

export const ProcessComplete = (props: Props) => {
	return (
		<html>
			<head>
				<title>Word Count - Process Complete</title>
			</head>
			<body>
				<h1>Process complete</h1>
				<dl>
					{"wordCount" in props && (
						<>
							<dt>Word Count</dt>
							<dd>{props.wordCount}</dd>
						</>
					)}
					{"lineCount" in props && (
						<>
							<dt>Line Count</dt>
							<dd>{props.lineCount}</dd>
						</>
					)}
				</dl>
				<p>Go back to PubPub</p>
			</body>
		</html>
	);
};
