import { RouteShorthandOptions } from "fastify";

const oauthLoginSchema: RouteShorthandOptions =
{
	schema:
	{
		description: 'OAuth github callback — sets refreshToken cookie and redirects to frontend /auth/callback',
		tags: ['OAuth'],
		response: {
			302: {
				type: 'string',
				description: 'Redirect to frontend callback page',
			},
		},
	}
};

export default oauthLoginSchema;
