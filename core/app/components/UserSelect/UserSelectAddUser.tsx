import { Button } from "ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "ui/card";
import { Input } from "ui/input";
import { Label } from "ui/label";

import * as actions from "./actions";

type Props = {};

export const UserSelectAddUser = (props: Props) => {
	return (
		<Card className="m-0 border-0 p-0 shadow-none">
			<CardHeader className="p-3">
				<CardTitle className="text-lg">Add User</CardTitle>
				<CardDescription>
					Upon submission, an email will be sent to notify this user of account creation.
				</CardDescription>
			</CardHeader>
			<CardContent className="p-3">
				<div className="grid w-full items-center gap-2">
					<div className="grid grid-cols-3 items-center gap-2">
						<Label htmlFor="firstName">First Name</Label>
						<Input id="firstName" className="col-span-2 h-8" />
					</div>
					<div className="grid grid-cols-3 items-center gap-2">
						<Label htmlFor="lastName">Last Name</Label>
						<Input id="lastName" className="col-span-2 h-8" />
					</div>
				</div>
			</CardContent>
			<CardFooter className="flex items-stretch justify-stretch p-3">
				<Button
					variant="outline"
					onClick={(e) => {
						e.preventDefault();
						actions.createUser();
					}}
					className="w-full"
				>
					Submit
				</Button>
			</CardFooter>
		</Card>
	);
};
