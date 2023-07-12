import { jsx } from "./jsx";

type Props = {};

export const Process = (props: Props) => {
	return (
		<html>
			<head>
				<title>Word Count - Process</title>
			</head>
			<body>
				<h1>Process</h1>
				<form method="POST">
					<button type="submit">Update word counts</button>
				</form>
			</body>
		</html>
	);
};
