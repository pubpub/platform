import React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";


import ContextEditor, { ContextEditorProps } from "../ContextEditor";

export default function EditorDash(props: ContextEditorProps) {
	return (
		<div className="grid grid-cols-2">
			<ContextEditor {...props} />
			<div className="bg-neutra00">
				<Tabs defaultValue="account">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="account">Account</TabsTrigger>
						<TabsTrigger value="password">Password</TabsTrigger>
					</TabsList>
					<TabsContent value="account">Account</TabsContent>
					<TabsContent value="password">password</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
