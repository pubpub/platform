"use client";
import { Box, Button, Flex, IconButton, Spacer } from "@chakra-ui/react";
import NextLink from "next/link";

type Props = {};

const PubHeader: React.FC<Props> = function ({}) {
	return (
		<Flex mb="4em">
			<h1>Pubs</h1>
			<Spacer />
			<NextLink href="/types" passHref legacyBehavior>
				<Button as="a" size="sm" variant="outline">
					Manage Types
				</Button>
			</NextLink>
		</Flex>
	);
};
export default PubHeader;
