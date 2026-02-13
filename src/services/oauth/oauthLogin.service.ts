import axios from 'axios';
import prisma from "src/utils/prismaClient.js";
import generateJwtTokens from 'src/utils/generateJwtTokens.js';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '@core/index.js';
import { USER_SERVICE_URL, STATS_SERVICE_URL } from 'src/utils/env.js';

const oauthLogin = (githubOAuth2: any) => {
	return {
		async getUserData(request: any) {
			let profile: any;
			let emails: any;

			const tokenData = await githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
			const { access_token } = tokenData.token;

			if (!access_token) throw new AppError('NO_OAUTH_TOKEN');

			try {

				profile = await axios.get('https://api.github.com/user', {
					headers: { Authorization: `token ${access_token}` },
				});

				emails = await axios.get('https://api.github.com/user/emails', {
					headers: { Authorization: `token ${access_token}` },
				});

			} catch (error) {
				throw new AppError('GITHUB_API_ERROR');
			}

			const profileLogin = profile.data.login;
			if (!profileLogin) throw new AppError('NO_GITHUB_USERNAME');

			const primaryEmail = emails.data.find((e: any) => e.primary && e.verified)?.email;
			if (!primaryEmail) throw new AppError('NO_VERIFIED_EMAIL');

			let user = await prisma.authUser.findUnique({
				where: { email: primaryEmail },
			});

			const githubId = profile.data.id.toString();

			if (!user) {

				user = await prisma.authUser.create({
					data: {
						email: primaryEmail,
						passwordHash: '',
						githubId,
						isEmailVerified: true,
					},
				});

				const userServiceHeaders = {
					'Content-Type': 'application/json',
					'x-service-token': process.env.SERVICE_TOKEN,
				};

				let username = profileLogin;
				try {
					await axios.post(`${USER_SERVICE_URL}/internal/`,
						{ userId: user.id, username },
						{ headers: userServiceHeaders },
					);
				} catch (error) {
					if (error?.response?.status === 409) {
						username = `${profileLogin}_${uuidv4().slice(0, 6)}`;
						try {
							await axios.post(`${USER_SERVICE_URL}/internal/`,
								{ userId: user.id, username },
								{ headers: userServiceHeaders },
							);
						} catch {
							await prisma.authUser.delete({ where: { id: user.id } });
							throw new AppError('USER_SERVICE_ERROR');
						}
					} else {
						await prisma.authUser.delete({ where: { id: user.id } });
						throw new AppError('USER_SERVICE_ERROR');
					}
				}

				// Initialize player stats so user appears in leaderboard
				try {
					await axios.post(`${STATS_SERVICE_URL}/internal/init-stats`,
						{ userId: user.id },
						{
							headers: {
								'Content-Type': 'application/json',
								'x-service-token': process.env.SERVICE_TOKEN,
							},
						});
				} catch {
					// Non-critical: stats will be created on first match if this fails
				}

			} else if (!user.githubId) {
				await prisma.authUser.update({
					where: { id: user.id },
					data: { githubId },
				});
			}

			const tokens = await generateJwtTokens(user.id);

			return { userId: user.id, ...tokens };
		}
	}
};

export default oauthLogin;
