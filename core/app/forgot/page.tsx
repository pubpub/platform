import Head from "components/Head";
import ForgotForm from "./ForgotForm";

export default async function Page() {
	return (
		<div className="max-w-lg m-auto">
			<Head title="Forgot Password · PubPub" triggers={[]} />
			<ForgotForm />
		</div>
	);
}
