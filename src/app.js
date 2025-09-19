import express from "express";
import morgan from "morgan";
import { apiRouter } from "./routers/index.js";
import cors from "cors";
import db from "./db/models/index.js";
import { authentificationMiddleware } from "./middlewares/auth.middleware.js";


const {PORT, NODE_ENV} = process.env;

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));

// authentification middleware pour checker si user co et a des droit
app.use('/api', authentificationMiddleware(), apiRouter);

try {

	await db.sequelize.authenticate();
	console.log("Connected to the DB");

	await db.sequelize.sync({alter : true});
	console.log("DB synched");
	
	app.listen(PORT, (error) => {
		if (error) {
			throw new Error(error)
		}
		console.log(`Web API is running on port ${PORT} on ENV mode : ${NODE_ENV}`);
	})
}
catch (err){
	console.log("❌ Error starting the Web API:", err);
}
