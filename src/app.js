import express from "express";
import morgan from "morgan";


const {PORT, NODE_ENV} = process.env;

const app = express();

app.use(morgan("tiny"));

// authentification middleware pour checker si user co et a des droit



app.use(express.json());

app.listen(PORT, (error) => {
	if (error) {
		console.log('an error occured in the Web API. \n');
		console.log(error);
		return;
	}
	console.log(`Web API is running on port ${PORT} on ENV mode : ${NODE_ENV}`);
})
