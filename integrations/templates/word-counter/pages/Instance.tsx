import { Metric } from "../types";
import { jsx } from "./jsx";

type Props = {
	error?: string;
	metric?: Metric;
	updated?: boolean;
	processPubId?: string;
};

const checked = { checked: true };

export const Instance = ({ error, metric, updated, processPubId }: Props) => {
	const countWordsProps = (metric === "words-and-lines" || metric === "words") && checked;
	const countLinesProps = (metric === "words-and-lines" || metric === "lines") && checked;
	return (
		<html>
			<head>
				<title>Word Count - Configure</title>
			</head>
			<body>
				{error && <p>{error}</p>}
				{!error && updated && <p>Configuration updated</p>}
				<form method="POST" action={processPubId && `?processPubId=${processPubId}`}>
					<fieldset name="configure">
						<legend>Select Counting Metric</legend>
						<label for="words">Words</label>
						<input type="checkbox" name="metric[0]" id="words" value="words" {...countWordsProps} />
						<label for="lines">Lines</label>
						<input type="checkbox" name="metric[1]" id="lines" value="lines" {...countLinesProps} />
					</fieldset>
					<button type="submit">Submit</button>
				</form>
			</body>
		</html>
	);
};
