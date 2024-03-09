import { zodResolver } from "@hookform/resolvers/zod";
import debounce from "debounce";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "ui/card";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Separator } from "ui/separator";
import { Sheet, SheetContent } from "ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { expect } from "utils";
import { z } from "zod";
import { StagePayload } from "~/lib/types";
import { useStages } from "./StagesContext";
import { useStageEditor } from "./StageEditorContext";

const overviewFormSchema = z.object({
	name: z.string(),
});

export function TabsDemo() {
	const { actions, deleteStages, updateStageName } = useStages();
	const { editingStage } = useStageEditor();
	const stageRef = useRef<StagePayload>(editingStage);
	const stage = expect(stageRef.current);
	const form = useForm<z.infer<typeof overviewFormSchema>>({
		mode: "all",
		reValidateMode: "onChange",
		resolver: zodResolver(overviewFormSchema),
		defaultValues: {
			name: stage.name,
		},
	});
	const name = form.watch("name");

	const onDeleteClick = useCallback(() => {
		deleteStages([stage.id]);
	}, [deleteStages, stage]);

	const onNameChange = useMemo(
		() =>
			debounce((name: string) => {
				updateStageName(stage.id, name);
			}, 500),
		[updateStageName]
	);

	useEffect(() => {
		onNameChange(name);
	}, [name]);

	return (
		<Tabs defaultValue="overview" className="w-[400px]">
			<TabsList className="grid w-full grid-cols-4">
				<TabsTrigger value="overview">Overview</TabsTrigger>
				<TabsTrigger value="pubs">Pubs</TabsTrigger>
				<TabsTrigger value="actions">Actions</TabsTrigger>
				<TabsTrigger value="members">Members</TabsTrigger>
			</TabsList>
			<TabsContent value="overview">
				<Card>
					<CardHeader>
						<CardTitle>Overview</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="space-y-1">
							<Label htmlFor="name">Stage Name</Label>
							<Input id="name" {...form.register("name")} />
						</div>
						<Separator />
						<h3>Actions Enabled on this Stage</h3>
						<p>No actions</p>
						<Separator />
						<h3>Stage Management</h3>
						<Button onClick={onDeleteClick}>Delete this Stage</Button>
					</CardContent>
					<CardFooter></CardFooter>
				</Card>
			</TabsContent>
			<TabsContent value="pubs">
				<Card>
					<CardHeader>
						<CardTitle>Password</CardTitle>
						<CardDescription>
							Change your password here. After saving, you'll be logged out.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="space-y-1">
							<Label htmlFor="current">Current password</Label>
							<Input id="current" type="password" />
						</div>
						<div className="space-y-1">
							<Label htmlFor="new">New password</Label>
							<Input id="new" type="password" />
						</div>
					</CardContent>
					<CardFooter>
						<Button>Save password</Button>
					</CardFooter>
				</Card>
			</TabsContent>
			<TabsContent value="actions">
				<Card>
					<CardHeader>
						<CardTitle>Actions</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<p>No actions</p>
						<ul>
							{actions.map((action) => (
								<li key={action.id}>{action.name}</li>
							))}
						</ul>
					</CardContent>
					<CardFooter></CardFooter>
				</Card>
			</TabsContent>
			<TabsContent value="members"></TabsContent>
		</Tabs>
	);
}

export const StageEditorPanel = () => {
	const { editingStage, editStage } = useStageEditor();
	const { stages } = useStages();
	const onOpenChange = useCallback(
		(open: boolean) => {
			if (!open) {
				editStage(null);
			}
		},
		[editStage]
	);

	return (
		<Sheet
			open={stages.some((stage) => stage.id === editingStage?.id)}
			onOpenChange={onOpenChange}
		>
			<SheetContent className="sm:max-w-md">
				<TabsDemo />
			</SheetContent>
		</Sheet>
	);
};
