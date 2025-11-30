import axios from 'axios';
import prisma from "src/utils/prismaClient.js";
import generateJwtTokens from 'src/utils/generateJwtTokens.js';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '@core/utils/AppError.js';
import { USER_SERVICE_URL } from 'src/utils/env.js';

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

			if (!user) {

				user = await prisma.authUser.create({
					data: {
						email: primaryEmail,
						passwordHash: '',
						isEmailVerified: true,
					},
				});

				let username = `user${uuidv4().slice(0, 8)}`;
				try {
					await axios.post(`${USER_SERVICE_URL}/`,
						{
							'userId': user.id,
							username
						},
						{
							headers: {
								'x-service-token': process.env.SERVICE_TOKEN,
								'Content-Type': 'application/json',
							}
						});
				}
				catch (error) {
					if (error?.response?.status === 409) {

						username = `user${uuidv4().slice(0, 8)}`;

						await axios.post(`${USER_SERVICE_URL}/`, {
							userId: user.id,
							username
						}, {
							headers: {
								'x-service-token': process.env.SERVICE_TOKEN,
								'Content-Type': 'application/json',
							}
						});

					} else {
						await prisma.authUser.delete({ where: { id: user.id } });
						throw new AppError('USER_SERVICE_ERROR');
					}
				}

			}
			const tokens = await generateJwtTokens(user.id);

			return { userId: user.id, ...tokens };
		}
	}
};

export default oauthLogin;
