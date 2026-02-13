import axios from 'axios';
import bcrypt from 'bcrypt';
import zxcvbn from 'zxcvbn';
import crypto from 'crypto';
import prisma from "src/utils/prismaClient.js";
import { sendVerificationEmail } from 'src/utils/email.js';
import { AppError } from '@core/index.js';
import { USER_SERVICE_URL, STATS_SERVICE_URL } from 'src/utils/env.js';

const registerUser = async ({ email, username, password }) => {

	email = email.toLowerCase().trim();
	username = username.trim();

	const existingEmail = await prisma.authUser.findUnique({ where: { email } });
	if (existingEmail) {
		if (!existingEmail.passwordHash) {
			throw new AppError('OAUTH_USER');
		}
		throw new AppError('EMAIL_EXISTS');
	}

	const passStrength = zxcvbn(password);
	if (passStrength.score < 3) throw new AppError('WEAK_PASSWORD');

	const passwordHash = await bcrypt.hash(password, 10);

	const verificationToken = crypto.randomBytes(32).toString('hex');

	const newUser = await prisma.authUser.create({
		data: {
			email,
			passwordHash,
			verificationToken,
			isEmailVerified: true,
		},
	});

	try {
		await axios.post(`${USER_SERVICE_URL}/internal/`,
			{
				'userId': newUser.id,
				username
			},
			{
				headers: {
					'Content-Type': 'application/json',
					'x-service-token': process.env.SERVICE_TOKEN,
				},
			});

	} catch (error: any) {
		await prisma.authUser.delete({ where: { id: newUser.id } });
		if (axios.isAxiosError(error)) {
			if (error.response?.status === 409) {
				throw new AppError('USERNAME_EXISTS');
			}
			else {
				throw new AppError('USER_SERVICE_ERROR');
			}
		}
		throw new AppError(error.code);
	}

	// await sendVerificationEmail(email, verificationToken, username); //enable in prod

	// Initialize player stats so user appears in leaderboard
	try {
		await axios.post(`${STATS_SERVICE_URL}/internal/init-stats`,
			{ userId: newUser.id },
			{
				headers: {
					'Content-Type': 'application/json',
					'x-service-token': process.env.SERVICE_TOKEN,
				},
			});
	} catch {
		// Non-critical: stats will be created on first match if this fails
	}

	const { passwordHash: _, ...safeUser } = newUser;

	return { ...safeUser, username };
}

export default registerUser;
