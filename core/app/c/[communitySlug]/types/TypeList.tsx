import type { PubTypeWithFieldIds } from "~/lib/types"
import TypeBlock from "./TypeBlock"

type Props = {
	types: PubTypeWithFieldIds[]
	allowEditing: boolean
}

const TypeList: React.FC<Props> = function ({ types, allowEditing }) {
	return (
		<div>
			{types.map((type) => {
				return (
					<div key={type.id} className="mb-5">
						<TypeBlock type={type} allowEditing={allowEditing} />
					</div>
				)
			})}
		</div>
	)
}
export default TypeList
