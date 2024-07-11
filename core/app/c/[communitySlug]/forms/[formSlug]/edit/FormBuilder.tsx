"use client";

import * as React from "react";
import { z } from "zod";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";

import type { Form } from "~/lib/server/form";

type Props = {
	form: Form;
};

const schema = z.object({
	inputs: z.array(z.object({ fieldId: z.string() })),
});

export function FormBuilder({ form }: Props) {
	return (
		<Tabs defaultValue="builder" className="">
			<TabsList>
				<TabsTrigger value="builder">Builder</TabsTrigger>
				<TabsTrigger value="preview">Preview</TabsTrigger>
			</TabsList>
			<TabsContent value="builder"></TabsContent>
			<TabsContent value="preview">Preview your form here</TabsContent>
		</Tabs>
	);
}
