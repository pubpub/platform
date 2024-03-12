import { zodResolver } from "@hookform/resolvers/zod";
import debounce from "debounce";
import {
	ComponentPropsWithoutRef,
	ElementRef,
	forwardRef,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useForm } from "react-hook-form";
import { Button } from "ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
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
import { cn } from "utils";
import { z } from "zod";
import { StagePayload } from "~/lib/types";
import { useStageEditor } from "./StageEditorContext";
import { useStages } from "./StagesContext";

const overviewFormSchema = z.object({
	name: z.string(),
});

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

const preventNavigationHoverBehavior = {
	onPointerEnter: (event: React.PointerEvent) => {
		event.preventDefault();
		event.stopPropagation();
	},
	onPointerLeave: (event: React.PointerEvent) => {
		event.preventDefault();
		event.stopPropagation();
	},
	onPointerMove: (event: React.PointerEvent) => {
		event.preventDefault();
		event.stopPropagation();
	},
};

type StageEditorPanelTabsProps = {
	stage: StagePayload;
};

export function StageEditorPanelTabs(props: StageEditorPanelTabsProps) {
	const { actions, deleteStages, updateStageName } = useStages();
	const form = useForm<z.infer<typeof overviewFormSchema>>({
		mode: "all",
		reValidateMode: "onChange",
		resolver: zodResolver(overviewFormSchema),
		defaultValues: {
			name: props.stage.name,
		},
	});
	const name = form.watch("name");

	const onDeleteClick = useCallback(() => {
		deleteStages([props.stage.id]);
	}, [deleteStages, props.stage]);

	const onNameChange = useMemo(
		() =>
			debounce((name: string) => {
				updateStageName(props.stage.id, name);
			}, 500),
		[updateStageName, props.stage]
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
									<NavigationMenuTrigger {...preventNavigationHoverBehavior}>
										Add Action
									</NavigationMenuTrigger>
									<NavigationMenuContent {...preventNavigationHoverBehavior}>
										<ul className="grid w-[300px] gap-3 p-4 md:grid-cols-2">
											{actions.map((action) => (
												<ListItem key={action.id} title={action.name}>
													Missing description
												</ListItem>
											))}
										</ul>
									</NavigationMenuContent>
								</NavigationMenuItem>
							</NavigationMenuList>
							<NavigationMenuViewport {...preventNavigationHoverBehavior} />
						</NavigationMenu>
					</CardContent>
				</Card>
			</TabsContent>
			<TabsContent value="members"></TabsContent>
		</Tabs>
	);
}

export const StageEditorPanel = () => {
	const { editingStage, editStage } = useStageEditor();
	const [open, setOpen] = useState(false);
	const [stage, setStage] = useState<StagePayload | null>(null);

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (!open) {
				editStage(null);
			}
			setOpen(open);
		},
		[editStage]
	);

	useEffect(() => {
		const open = editingStage !== null;
		if (open) {
			setStage(editingStage);
		}
		setOpen(open);
	}, [editingStage]);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="sm:max-w-md">
				{stage !== null && <StageEditorPanelTabs stage={stage} />}
			</SheetContent>
		</Sheet>
	);
};
