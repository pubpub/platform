import { zodResolver } from "@hookform/resolvers/zod";
import debounce from "debounce";
import {
	ComponentPropsWithoutRef,
	ElementRef,
	forwardRef,
	useCallback,
	useEffect,
	useMemo,
	useRef,
} from "react";
import { useForm } from "react-hook-form";
import { Button } from "ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "ui/card";
import { Input } from "ui/input";
import { Label } from "ui/label";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	NavigationMenuViewport,
} from "ui/navigation-menu";
import { Separator } from "ui/separator";
import { Sheet, SheetContent } from "ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { cn, expect } from "utils";
import { z } from "zod";
import { StagePayload } from "~/lib/types";
import { useStageEditor } from "./StageEditorContext";
import { useStages } from "./StagesContext";

const overviewFormSchema = z.object({
	name: z.string(),
});

const components: { title: string; href: string; description: string }[] = [
	{
		title: "Pub Mover",
		href: "",
		description: "Moves a Pub to a different stage.",
	},
	{
		title: "Crossref",
		href: "",
		description: "Deposits a Pub to Crossref, optionally assigning a DOI.",
	},
];

const ListItem = forwardRef<ElementRef<"a">, ComponentPropsWithoutRef<"a">>(
	({ className, title, children, ...props }, ref) => {
		return (
			<li>
				<NavigationMenuLink asChild>
					<a
						ref={ref}
						className={cn(
							"block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer",
							className
						)}
						{...props}
					>
						<div className="text-sm font-medium leading-none">{title}</div>
						<p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
							{children}
						</p>
					</a>
				</NavigationMenuLink>
			</li>
		);
	}
);
ListItem.displayName = "ListItem";

export function StageEditorPanelTabs() {
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
					<CardContent className="space-y-2 py-2">
						<div className="space-y-2 py-2">
							<Label htmlFor="name">
								<h4 className="font-semibold mb-2 text-base">Stage Name</h4>
								<Input id="name" {...form.register("name")} />
							</Label>
						</div>
						<Separator />
						<div className="space-y-2 py-2">
							<h4 className="font-semibold mb-2">Actions Enabled on this Stage</h4>
							<p>This stage has no actions.</p>
						</div>
						<Separator />
						<div className="space-y-2 py-2">
							<h4 className="font-semibold mb-2">Stage Management</h4>
							<Button variant="secondary" onClick={onDeleteClick}>
								Delete this Stage
							</Button>
						</div>
					</CardContent>
				</Card>
			</TabsContent>
			<TabsContent value="pubs"></TabsContent>
			<TabsContent value="actions">
				<Card>
					<CardHeader>
						<CardTitle>Actions</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<p>This stage has no actions.</p>
						<NavigationMenu>
							<NavigationMenuList>
								<NavigationMenuItem>
									<NavigationMenuTrigger
										onPointerEnter={(event) => event.preventDefault()}
										onPointerLeave={(event) => event.preventDefault()}
									>
										Add Action
									</NavigationMenuTrigger>
									<NavigationMenuContent
										onPointerEnter={(event) => event.preventDefault()}
										onPointerLeave={(event) => event.preventDefault()}
									>
										<ul className="grid w-[300px] gap-3 p-4 md:grid-cols-2">
											{components.map((component) => (
												<ListItem
													key={component.title}
													title={component.title}
													href={component.href}
												>
													{component.description}
												</ListItem>
											))}
										</ul>
									</NavigationMenuContent>
								</NavigationMenuItem>
							</NavigationMenuList>
							<NavigationMenuViewport
								onPointerEnter={(event) => event.preventDefault()}
								onPointerLeave={(event) => event.preventDefault()}
							/>
						</NavigationMenu>
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
				<StageEditorPanelTabs />
			</SheetContent>
		</Sheet>
	);
};
