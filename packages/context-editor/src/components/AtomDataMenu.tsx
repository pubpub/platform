import type { Node } from "prosemirror-model"
import type React from "react"

import { Input } from "ui/input"
import { Label } from "ui/label"

type Props = {
	node: Node
	onChange: (key: string, value: unknown) => void
}

export const AtomDataMenu = (props: Props) => {
	if (!props.node.attrs.data) {
		return null
	}

	return (
		<>
			<div className="mt-8 text-sm">Atom Data</div>
			{Object.keys(props.node.attrs.data).map((attrKey) => {
				const key = `data-${attrKey}`
				const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
					props.onChange(attrKey, event.target.value)
				}
				return (
					<div key={key}>
						<Label className="text-xs font-normal" htmlFor={key}>
							{attrKey}
						</Label>
						<Input
							className="h-8 rounded-sm border-neutral-300 text-xs"
							type="text"
							value={props.node.attrs.data[attrKey] || ""}
							onChange={onChange}
							id={key}
						/>
					</div>
				)
			})}
		</>
	)
}
