import Head from "components/Head";
import ResetForm from "./ResetForm";

export default async function Page() {
	return (
		<div className="max-w-lg m-auto">
			<Head title="Reset Password · PubPub" triggers={[]} />
			<ResetForm />
		</div>
	);
}
