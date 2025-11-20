import { useFormContext } from "react-hook-form"

import { FormField, FormItem, FormLabel, FormMessage } from "../form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select"
import { useActionInstanceContext } from "./ActionInstancesContext"

type Props = {}

export const ActionInstanceSelector = (_props: Props) => {
	const form = useFormContext()
	const { actions, actionInstances } = useActionInstanceContext()

	return (
		<FormField
			control={form.control}
			name="actionInstanceId"
			render={({ field }) => (
				<FormItem>
					<FormLabel></FormLabel>
					<Select onValueChange={field.onChange} defaultValue={field.value}>
						<SelectTrigger>
							<SelectValue placeholder="Action" />
						</SelectTrigger>
						<SelectContent>
							{actionInstances.map((instance) => {
								const action = actions[instance.action]

								return (
									<SelectItem
										key={instance.id}
										value={instance.id}
										className="hover:bg-gray-100"
									>
										<div className="flex flex-row items-center gap-x-2">
											<action.icon size="12" />
											<span>{instance.name}</span>
										</div>
									</SelectItem>
								)
							})}
						</SelectContent>
					</Select>
					<FormMessage />
				</FormItem>
			)}
		/>
	)
}
