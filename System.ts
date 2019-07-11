import { Page, launch, Browser } from "puppeteer";
import { invisibleCaptchaSolver } from "./CaptchaSolver";
import { accountCreationRequest } from "./Fetch";
import { readEmailsSince } from "./EmailReader";

export class System {
	browser?: Browser;
	page?: Page;
	EMAIL_CREDENTIALS: {
		user: string;
		password: string;
		host: string;
		port: number;
		tls: boolean;
	};
	TWO_CAPTCHA_API_KEY: string;
	DOMAIN: string;

	constructor(){
		const config = require('./config.json');
		this.EMAIL_CREDENTIALS = config.EMAIL_CREDENTIALS
		this.TWO_CAPTCHA_API_KEY = config.TWO_CAPTCHA_API_KEY
		this.DOMAIN = config.DOMAIN;
	}
	
	launchBrowser = async () => {
		this.browser = await launch({ headless: true });
		[this.page] = await this.browser.pages();
	};

	createAccount = async ({
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
		// This token is so that only recent mails are analyzed and not all the inbox.
		const dateSince = new Date(new Date().getTime());

		console.log("Creating account with params", {
			email,
			username,
			password,
			date
		});

		if (!this.page || !this.browser) {
			return;
		}

		if (!username.length) {
		}

		if (!email || (email && !email.length)) {
			if (!this.DOMAIN) {
				console.log(
					red(
						"No email address was specified and no domain was found in config. Add a domain in config or specify the email address to create an account."
					)
				);
			}
			email = username + "@" + this.DOMAIN;
		}

		await this.page.goto("https://www.dofus.com/fr/creer-un-compte");
		await this.page.waitForSelector("#userlogin");

		await this.page.type("#userlogin", username, { delay: 50 });
		await this.page.waitForSelector("#user_password");
		await this.page.type("#user_password", password, { delay: 50 });
		await this.page.waitForSelector("#user_mail");
		await this.page.type("#user_mail", email, { delay: 50 });
		await this.page.waitFor(1000);
		await this.page.select("#ak_field_1", date.day.toString());
		await this.page.waitFor(1000);
		await this.page.select("#ak_field_2", date.month.toString());
		await this.page.waitFor(1000);
		await this.page.select("#ak_field_3", date.year.toString());

		// To remove focus from the mail field so that the error event can be triggered.
		await this.page.click("#userlogin");
		await this.page.waitFor(500);
		let errorFields = await this.checkFields(this.page);
		if (errorFields.length) {
			errorFields.map(error => {
				console.log(red("Error creating account: " + error.value))
			})
		
			return;
		}

		console.log("No errors. Proceeding to captcha solving & account creation.");

		// Page is loaded, start fetching captcha
		const captchaKey = await this.page.$eval(".grecaptcha-logo", element => {
			const elementHTML = element.innerHTML;
			return elementHTML.substr(elementHTML.indexOf("k=") + 2, 300).split("&")[0];
		});

		console.log("Obtained captcha key", captchaKey);

		const solvedCaptcha = await invisibleCaptchaSolver(captchaKey, this.TWO_CAPTCHA_API_KEY);

		console.log(solvedCaptcha.length > 100 ? "✔" : "❌", "Obtained captcha response");

		await accountCreationRequest({
			username,
			password,
			email,
			solvedCaptcha,
			date
		});

		// Wait for a few seconds for the email to be sent
		await this.page.waitFor(10_000);
		const links = await readEmailsSince({ dateSince, subject: "ADDRESS_CONFIRMATION", emailCredentials: this.EMAIL_CREDENTIALS });

		if (links.length > 0) {
			await this.page.goto(links[0]);
		} else {
			console.log(`❌ Account was ${red(bold("not"))} successfully created. Possible reasons: the captcha was badly resolved or your IP is flagged.`);
			return;
		}

		// Wait for a few seconds for the email to be sent
		await this.page.waitFor(10_000);
		const confirmationEmail = await readEmailsSince({ dateSince, subject: "SUCCESSFUL_ACCOUNT_CREATION", emailCredentials: this.EMAIL_CREDENTIALS });
		if (confirmationEmail.length > 0) {
			console.log("✔", green("Account was successfully created."));
		} else {
			console.log(`❌ Account was ${red(bold("not"))} successfully created. Possible reasons: the captcha was badly resolved or your IP is flagged.`);
		}
	};

	async checkFields(page: Page) {
		const elements = await page.$$eval(".error", elements => {
			return elements
				.map(element => {
					return { type: (element as HTMLLabelElement).htmlFor, value: element.innerHTML };
				})
				.filter(element => element.value !== "");
		});

		return elements;
	}
}

export const red = (text: string): string => `\x1b[31m${text}\x1b[0m`;
export const green = (text: string): string => `\x1b[32m${text}\x1b[0m`;
export const yellow = (text: string): string => `\x1b[33m${text}\x1b[0m`;
export const bold = (text: string): string => `\x1b[1m${text}\x1b[0m`;

// (async () => {
// 	const system = new System();
// 	await system.launchBrowser();
// 	await system.createAccount({
// 		email: "",
// 		username: "Hdeyuidti",
// 		password: "yessai123!",
// 		date: { day: 9, month: 3, year: 1997 }
// 	});
// 	console.log(`✔ ${green("Done.")}`);
// })();
