import type { PubTypeWithFieldIds } from "~/lib/types";
import TypeBlock from "./TypeBlock";

type Props = {
	types: PubTypeWithFieldIds[];
	superadmin: boolean;
};

const TypeList: React.FC<Props> = function ({ types, superadmin }) {
	return (
		<div>
			{types.map((type) => {
				return (
					<div key={type.id} className="mb-5">
						<TypeBlock type={type} superadmin={superadmin} />
					</div>
				);
			})}
		</div>
	);
};
export default TypeList;
