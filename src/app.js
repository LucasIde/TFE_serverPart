import express from "express";
import morgan from "morgan";
import { apiRouter } from "./routers/index.js";
import cors from "cors";


const {PORT, NODE_ENV} = process.env;

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));

// authentification middleware pour checker si user co et a des droit
app.use('/api', apiRouter);

app.listen(PORT, (error) => {
	if (error) {
		console.log('an error occured in the Web API. \n');
		console.log(error);
		return;
	}
	console.log(`Web API is running on port ${PORT} on ENV mode : ${NODE_ENV}`);
})
