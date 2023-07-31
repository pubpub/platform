import Link from "next/link";
import { Button } from "@/components/Button";

type Props = {};

const PubHeader: React.FC<Props> = function ({}) {
	return (
		<div className="flex mb-16 justify-between items-center">
			<h1 className="font-bold text-xl">Pubs</h1>
			<Button variant="outline" size="sm" asChild>
				<Link href="/types">Manage Types</Link>
			</Button>
		</div>
	);
};
export default PubHeader;
