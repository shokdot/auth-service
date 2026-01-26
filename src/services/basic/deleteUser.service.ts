import prisma from "src/utils/prismaClient.js";
import axios from 'axios';
import { AppError } from '@core/index.js'
import { USER_SERVICE_URL } from "src/utils/env.js";

const deleteUser = async (userId: string, accessToken: string): Promise<any> => {
	const user = await prisma.authUser.findUnique({
		where: { id: userId }
	});

	if (!user) throw new AppError('USER_NOT_FOUND');

	try {
		await axios.delete(`${USER_SERVICE_URL}/internal/${userId}`, {
			headers: {
				'x-service-token': process.env.SERVICE_TOKEN
			},
		});
	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.response?.status === 404) {
				throw new AppError('USER_NOT_FOUND');
			}
		}
		throw new AppError('USER_SERVICE_ERROR');
	}

	await prisma.refreshToken.deleteMany({ where: { userId } });
	await prisma.passwordResetToken.deleteMany({ where: { userId } });
	await prisma.authUser.delete({
		where: { id: userId }
	});

};

export default deleteUser;
