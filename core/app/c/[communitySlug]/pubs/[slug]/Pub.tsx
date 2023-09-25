import { PubPayload } from "~/lib/types";

type Props = {
	pub: PubPayload;
};

export default function Pub(porps: Props) {

	return (
		<div className="flex flex-row">
			<div className="w-[900px] bg-orange-500">Render Fields</div>
			<div className="h-100% bg-gray-50 w-[250px] p-4 shadow-inner flex flex-col">
				<div>Stages</div>
				<div>Intergations</div>
				<div>members</div>
			</div>
		</div>
	);
}
