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
				<p>Word count complete!</p>
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
