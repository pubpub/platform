"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { apiAccessRulesInitializerSchema } from "db/public/ApiAccessRules";
import { apiAccessTokensInitializerSchema } from "db/public/ApiAccessTokens";
import { Button } from "ui/button";
import { Card, CardContent } from "ui/card";
import { Checkbox } from "ui/checkbox";
import { Form, FormField, FormItem, FormLabel } from "ui/form";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";

const schema = apiAccessTokensInitializerSchema.extend({
	permissions: apiAccessRulesInitializerSchema.array(),
});

export const CreateTokenForm = () => {
	const form = useForm<typeof schema>({
		resolver: zodResolver(schema),
	});

	return (
		<Form {...form}>
			<form className="grid gap-2">
				<h2 className="text-xl font-semibold">Create New Token</h2>
				<Card>
					<CardContent className="grid gap-4">
						<FormField
							name="name"
							control={form.control}
							render={({ field }) => (
								<FormItem className="grid gap-2">
									<FormLabel>Token Name</FormLabel>
									<Input placeholder="Enter a name" {...field} />
								</FormItem>
							)}
						/>
						<FormField
							name="description"
							control={form.control}
							render={({ field }) => (
								<FormItem className="grid gap-2">
									<FormLabel>Description</FormLabel>
									<Input placeholder="Enter a description" {...field} />
								</FormItem>
							)}
						/>
						<FormField
							name="permissions"
							control={form.control}
							render={({ field }) => {
								return (
									<>
										<FormLabel>Permissions</FormLabel>
										<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
											<div className="space-y-2">
												<h3 className="text-lg font-semibold">Pubs</h3>
												<div className="grid grid-cols-3 gap-2">
													<div className="flex items-center gap-2">
														<Checkbox id="permission-pubs-read" />
														<Label htmlFor="permission-pubs-read">
															Read
														</Label>
													</div>
													<div className="flex items-center gap-2">
														<Checkbox id="permission-pubs-write" />
														<Label htmlFor="permission-pubs-write">
															Write
														</Label>
													</div>
													<div className="flex items-center gap-2">
														<Checkbox id="permission-pubs-archive" />
														<Label htmlFor="permission-pubs-archive">
															Archive
														</Label>
													</div>
												</div>
												<div className="grid gap-2">
													<Label htmlFor="permission-pubs-stages">
														Stages
													</Label>
													<Select id="permission-pubs-stages" multiple>
														<SelectTrigger className="w-full">
															<SelectValue placeholder="Select stages" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="draft">
																Draft
															</SelectItem>
															<SelectItem value="published">
																Published
															</SelectItem>
															<SelectItem value="archived">
																Archived
															</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>
											<div className="space-y-2">
												<h3 className="text-lg font-semibold">Community</h3>
												<div className="grid grid-cols-3 gap-2">
													<div className="flex items-center gap-2">
														<Checkbox id="permission-community-read" />
														<Label htmlFor="permission-community-read">
															Read
														</Label>
													</div>
													<div className="flex items-center gap-2">
														<Checkbox id="permission-community-write" />
														<Label htmlFor="permission-community-write">
															Write
														</Label>
													</div>
													<div className="flex items-center gap-2">
														<Checkbox id="permission-community-archive" />
														<Label htmlFor="permission-community-archive">
															Archive
														</Label>
													</div>
												</div>
											</div>
											<div className="space-y-2">
												<h3 className="text-lg font-semibold">Stages</h3>
												<div className="grid grid-cols-3 gap-2">
													<div className="flex items-center gap-2">
														<Checkbox id="permission-stages-read" />
														<Label htmlFor="permission-stages-read">
															Read
														</Label>
													</div>
													<div className="flex items-center gap-2">
														<Checkbox id="permission-stages-write" />
														<Label htmlFor="permission-stages-write">
															Write
														</Label>
													</div>
													<div className="flex items-center gap-2">
														<Checkbox id="permission-stages-archive" />
														<Label htmlFor="permission-stages-archive">
															Archive
														</Label>
													</div>
												</div>
											</div>
											<div className="space-y-2">
												<h3 className="text-lg font-semibold">Pub Types</h3>
												<div className="grid grid-cols-3 gap-2">
													<div className="flex items-center gap-2">
														<Checkbox id="permission-pub-types-read" />
														<Label htmlFor="permission-pub-types-read">
															Read
														</Label>
													</div>
													<div className="flex items-center gap-2">
														<Checkbox id="permission-pub-types-write" />
														<Label htmlFor="permission-pub-types-write">
															Write
														</Label>
													</div>
													<div className="flex items-center gap-2">
														<Checkbox id="permission-pub-types-archive" />
														<Label htmlFor="permission-pub-types-archive">
															Archive
														</Label>
													</div>
												</div>
											</div>
											<div className="space-y-2">
												<h3 className="text-lg font-semibold">Members</h3>
												<div className="grid grid-cols-3 gap-2">
													<div className="flex items-center gap-2">
														<Checkbox id="permission-members-read" />
														<Label htmlFor="permission-members-read">
															Read
														</Label>
													</div>
													<div className="flex items-center gap-2">
														<Checkbox id="permission-members-write" />
														<Label htmlFor="permission-members-write">
															Write
														</Label>
													</div>
													<div className="flex items-center gap-2">
														<Checkbox id="permission-members-archive" />
														<Label htmlFor="permission-members-archive">
															Archive
														</Label>
													</div>
												</div>
											</div>
										</div>
									</>
								);
							}}
						/>

						<Button type="submit" className="justify-self-end">
							Create Token
						</Button>
					</CardContent>
				</Card>
			</form>
		</Form>
	);
};
