import { existsSync, writeFileSync, fstat } from "fs";
import { createInterface } from "readline";
import { green, bold, red, System } from "./System";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const system = new System();

const _question = async (text: string): Promise<string> => {
	return await new Promise((resolve, reject) => {
		rl.question(green("> " + text + " "), answer => resolve(answer));
	});
};

const _initConfigFile = async (fileURI: string) => {
	console.log("A configuration file will be created.");
	console.log(
		"\nAll emails should be redirected to a single account. We recommend using a garbage account. Please fill in this account's credentials:"
	);
	const user = await _question("username: (ex: account@outlook.com)");
	const password = await _question("password:");
	const host = await _question("host: (ex: outlook.office365.com)");
	const port = await _question("port: [993]");
	let usingTLS = await _question("using TLS (y/n) [y]");
	let tls = false;
	if (usingTLS === "" || usingTLS.toLowerCase() === "y") {
		tls = true;
	}

	console.log("\nBBF Account Creator uses 2Captcha to solve the captchas. Please provide your API key.");
	const TWO_CAPTCHA_API_KEY = await _question("API Key:");

	console.log("\nEmails can be auto-generated with the username if you own a domain name. Fill in your domain name or leave blank.");
	const DOMAIN = await _question("Domain name: (ex: google.com):");

	writeFileSync("config.json", JSON.stringify({ EMAIL_CREDENTIALS: { user, password, host, port, tls }, TWO_CAPTCHA_API_KEY, DOMAIN }, null, "\t"));

	console.log("Config file was successfully created. You can now create an account by using the following command:\n");
	console.log(
		`${green("bbf")} create --use=${bold("username")} --password=${bold("password")} --email=${bold("abc@xyz.fr")}  --birthday=${bold(
			"1/1/1992"
		)} `
	);
	await new Promise(resolve => setTimeout(resolve, 2000));
	rl.close();
};

const init = async (configFile: string) => {
	if (existsSync("config.json")) {
		const create = await _question("config.json file already exists. Overwrite? (y/n) [n]");
		if (create === "" || create.toLowerCase() === "n") {
			console.log("Aborted.");
			process.exit();
		} else {
			_initConfigFile(configFile);
		}
	} else {
		const create = await _question("config.json file not found. Create it? (y/n) [y]");
		if (!(create === "" || create.toLowerCase() === "y")) {
			console.log("Aborted.");
			process.exit();
		} else {
			_initConfigFile(configFile);
		}
	}
};

const createAccount = async ({
	email,
	username,
	password,
	date
}: {
	email?: string;
	username: string;
	password: string;
	date: { day: number; month: number; year: number };
}) => {
	if (existsSync("config.json")) {
		await system.launchBrowser();
		await system.createAccount({
			email: email ? email : "",
			username,
			password,
			date
		});
		console.log(`✔ ${green("Done.")}`);
	} else {
		console.log(
			"No config file found. Put your config file in the root directory or create one using one of the following commands:\n\nbbf\nbbf init"
		);
		process.exit();
	}
};

const parseArguments = () => {
	if (process.argv.length === 2 || process.argv[2] === "init") {
		init("config.json");
	} else {
		const requiredArguments = ["username", "password", "date"];
		const args: { [index in string]: string } = {};
		const givenArguments = process.argv
			.map(argument => {
				if (argument.substring(0, 2) === "--") {
					args[argument.substr(2).split("=")[0]] = argument.substr(2).split("=")[1];
					return argument.substr(2).split("=")[0];
				} else {
					return null;
				}
			})
			.filter(arg => arg !== null);

		let allRequiredArgumentsPresent = true;
		for (const requiredArgument of requiredArguments) {
			if (!givenArguments.includes(requiredArgument)) {
				allRequiredArgumentsPresent = false;
				console.log(red(`Please specify the ${requiredArgument} argument with --${requiredArgument}`));
				process.exit();
			}
		}

		let date = {day: 1, month: 1, year: 1996}
		if (args["date"].split("/").length !== 3) {
			console.log(red("Date needs to be of format dD/mM/YYYY"));
			process.exit()
		}else{
			date.day = parseInt(args["date"].split("/")[0])
			date.month = parseInt(args["date"].split("/")[1])
			date.year = parseInt(args["date"].split("/")[2])
			
			if(isNaN(date.day) || isNaN(date.month) || isNaN(date.year)){
				console.log(red("Date needs to be of format dD/mM/YYYY with numbers"));
				process.exit()
			}
			
			date = {day: 1, month: 1, year: 1996}
		}
		
		rl.close()
		createAccount({email: args["email"], username: args["username"], password: args["password"], date})
	}
};

parseArguments();
