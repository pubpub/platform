/**
 * @swagger
 * /api/v7/integrations/{instanceId}/members:
 *   get:
 *     tags:
 *       - Members
 *     parameters:
 *       - $ref: '#/components/parameters/instanceId'
 *     summary: Finds members and roles
 *     description: Returns members for this instances stage
 *     responses:
 *       200:
 *         description: List of members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid Instance ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvalidInstanceId'
 *               example: Invalid Instance ID
 *       403:
 *         description: You dont have access to do this
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvalidAccessToken'
 *               example: Invalid Instance ID
 */
export async function GET(request: Request) {
	// Return all members in this instance's stage? TODO: clarify the use cases for this endpoint
}
