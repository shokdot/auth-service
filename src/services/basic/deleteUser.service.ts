import prisma from "../../utils/prismaClient.js";
import axios from 'axios';
import { AppError } from '@core/index.js'
import {
	USER_SERVICE_URL,
	STATS_SERVICE_URL,
	CHAT_SERVICE_URL,
	NOTIFICATION_SERVICE_URL,
	SERVICE_TOKEN
} from "../../utils/env.js";

const deleteUser = async (userId: string): Promise<any> => {
	const user = await prisma.authUser.findUnique({
		where: { id: userId }
	});

	if (!user) throw new AppError('USER_NOT_FOUND');

	const services = [
		{ name: 'User', url: `${USER_SERVICE_URL}/internal/${userId}` },
		{ name: 'Stats', url: `${STATS_SERVICE_URL}/internal/${userId}` },
		{ name: 'Chat', url: `${CHAT_SERVICE_URL}/internal/${userId}` },
		{ name: 'Notification', url: `${NOTIFICATION_SERVICE_URL}/internal/${userId}` },
	];

	for (const service of services) {
		try {
			await axios.delete(service.url, {
				headers: {
					'x-service-token': SERVICE_TOKEN
				},
			});
		} catch (error) {
			console.error(`Failed to delete data from ${service.name} service for user ${userId}:`, error);
			// We continue even if one non-core service fails to ensure as much data as possible is deleted
			if (service.name === 'User') {
				throw new AppError('USER_SERVICE_ERROR');
			}
		}
	}

	await prisma.refreshToken.deleteMany({ where: { userId } });
	await prisma.passwordResetToken.deleteMany({ where: { userId } });
	await prisma.authUser.delete({
		where: { id: userId }
	});

};

export default deleteUser;
