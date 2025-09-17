import argon2 from "argon2";

const authController = {
	register: async (req, res) => {
		const {username, email, password} = req.body;
		console.log( username, email, password);
		try {

			// email already exist
			// const existingUser = await User.findOne({ email });
			// if (existingUser) {
				// return res.status(409).json({ error: "this Email is already used" });
		// 	}
			return res.status(201).json("user succesfuly created");
		}
		catch (error) {
			console.error(error);
			res.status(500).json({ error: "Erreur interne du serveur" });
		}
	},
	login: async (req, res) => {
		res.status(404);
	},
	// updatePassword: async (req, res) => {
	// 	res.status(404);
	// }
}

export default authController;
