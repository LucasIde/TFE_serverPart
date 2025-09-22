import argon2 from "argon2";
import { generateDiscriminator, generateToken } from "../utils/auth.utils.js";
import db from "../db/models/index.js";


const authController = {
	register: async (req, res) => {
		const { username, email, password, role = "user" } = req.body;
		const hashedPassword = await argon2.hash(password);
		try {
			// email already exist
			const existingUser = await db.User.findOne({ where: { email } });
			if (existingUser) {
				return res.status(409).json({ error: "this Email is already used" });
			}

			let newUser;
			let attempt = 0;
			const maxAttempt = 5;

			while (!newUser && (attempt < maxAttempt)) {
				const discriminator = generateDiscriminator();
				try {
					newUser = await db.User.create({
						username: username,
						discriminator: discriminator,
						email: email,
						password: hashedPassword,
						role: role,
					})
				}
				catch (err) {
					if (err instanceof Sequelize.UniqueConstraintError) {
						// conflit username + discriminator already exist
						attempt++;
						continue;
					}
					else {
						throw err;
					}
				}
			}
			if (!newUser) {
				return res.status(500).json({ error: "Failed to generate a unique tag" });
			}
			return res.status(201).json({
				message: "User successfully created",
				id: newUser.id,
				username: newUser.username,
				discriminator: newUser.discriminator
			});
		}
		catch (error) {
			console.error(error);
			res.status(500).json({ error: "Internal server error" });
		}
	},
	login: async (req, res) => {
		const { email, password } = req.body;
		try {
			const user = await db.User.findOne({
				where: { email: email },
				attributes: ['id', 'username', 'password', 'email', 'role'],
			})
			if (!user) {
				return res.status(401).json({ error: "Invalid credentials" });
			}
			const validPassword = await argon2.verify(user.password, password);
			if (!validPassword) {
				return res.status(401).json({ error: "Invalid credentials" });
			}

			const token = await generateToken({id : user.id, username : user.username, role : user.role});
			console.log(token);

			res.status(200).json({
				message : "succesfuly logged"
				, token
			});
		}		
		catch (error) {
			console.error(error);
			res.status(500).json({ error: "Internal server error" });
		}
	},
	// updatePassword: async (req, res) => {
	// 	res.status(404);
	// }
}

export default authController;
