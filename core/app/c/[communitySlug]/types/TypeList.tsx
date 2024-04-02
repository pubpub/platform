"use client";

import { TypesData } from "./page";
import TypeBlock from "./TypeBlock";

type Props = { types: NonNullable<TypesData> };

const TypeList: React.FC<Props> = function ({ types }) {
	return (
		<div>
			{types.map((type) => {
				return (
					<div key={type.id} className="mb-5">
						<TypeBlock type={type} />
					</div>
				);
			})}
		</div>
	);
};
export default TypeList;
