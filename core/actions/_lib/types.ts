import type { UseFormReturn } from "react-hook-form"

export type ActionFormProps = {
	values: Record<string, unknown> | null
	onSubmit: (values: Record<string, unknown>, form: UseFormReturn<any>) => void
}
