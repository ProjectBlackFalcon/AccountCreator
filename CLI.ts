import { existsSync, writeFileSync, fstat } from "fs";
import { createInterface } from "readline";
import { green, bold } from "./System";

const rl = createInterface({ input: process.stdin, output: process.stdout });

async function question(text: string): Promise<string> {
	return await new Promise((resolve, reject) => {
		rl.question(green("> " + text + " "), answer => resolve(answer));
	});
}

if (existsSync("config.json")) {
	
} else {
	(async () => {
		const create = await question("config.json file not found. Create it? (y/n) [y]");
		if (!(create === "" || create.toLowerCase() === "y")) {
			console.log("Aborted.");
			process.exit();
		}

		console.log("A configuration file will be created.");
		console.log(
			"\nAll emails should be redirected to a single account. We recommend using a garbage account. Please fill in this account's credentials:"
		);
		const user = await question("username: (ex: account@outlook.com)");
		const password = await question("password:");
		const host = await question("host: (ex: outlook.office365.com)");
		const port = await question("port: [993]");
		let usingTLS = await question("using TLS (y/n) [y]");
		let tls = false;
		if (usingTLS === "" || usingTLS.toLowerCase() === "y") {
			tls = true;
		}
		
		
		console.log("\nBBF Account Creator uses 2Captcha to solve the captchas. Please provide your API key.")
		const TWO_CAPTCHA_API_KEY = await question("API Key:")
		
		console.log("\nEmails can be auto-generated with the username if you own a domain name. Fill in your domain name or leave blank.")
		const DOMAIN = await question("Domain name: (ex: google.com):")
		
		writeFileSync("config.json", JSON.stringify({ EMAIL_CREDENTIALS: {user, password, host, port, tls},
			TWO_CAPTCHA_API_KEY,
			DOMAIN
		}, null, "\t"))
		
		console.log("Config file was successfully created. You can now create an account by using the following command:\n")
		console.log(`${green("bbf")} create --use=${bold("username")} --password=${bold("password")} --email=${bold("abc@xyz.fr")}  --birthday=${bold("1/1/1992")} `)
		await new Promise(resolve => setTimeout(resolve, 2000))
		rl.close()
	})();
}
