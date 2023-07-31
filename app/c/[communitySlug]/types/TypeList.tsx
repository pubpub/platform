"use client";
import { Box, Button, Divider, Flex, Heading, IconButton } from "@chakra-ui/react";
import { TypesData } from "./page";
import TypeBlock from "./TypeBlock";


type Props = { types: NonNullable<TypesData> };

const TypeList: React.FC<Props> = function ({ types }) {
	return (
		<div>
			{types.map((type) => {
				return (
					<div key={type.id}>
						<Box mb="5">
							<TypeBlock type={type} />
						</Box>
					</div>
				);
			})}
		</div>
	);
};
export default TypeList;
