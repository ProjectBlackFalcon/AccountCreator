import { Page, launch, Browser } from "puppeteer";
import { invisibleCaptchaSolver } from "./CaptchaSolver";
import { TWO_CAPTCHA_API_KEY } from "./config";
import { accountCreationRequest } from "./Fetch";

class System {
	browser?: Browser;
	page?: Page;

	launchBrowser = async () => {
		this.browser = await launch({ headless: false });
		[this.page] = await this.browser.pages();
	};

	createAccount = async (email: string, username: string, password: string, date: { day: number; month: number; year: number }) => {
		if (!this.page || !this.browser) {
			return;
		}

		await this.page.goto("https://www.dofus.com/fr/creer-un-compte");
		await this.page.waitForSelector("#userlogin");

		// Page is loaded, start fetching captcha
		const captchaKey = await this.page.$eval(".grecaptcha-logo", element => {
			const elementHTML = element.innerHTML;
			return elementHTML.substr(elementHTML.indexOf("k=") + 2, 300).split("&")[0];
		});

		console.log("Obtained captcha key", captchaKey);

		const solvedCaptcha = await invisibleCaptchaSolver(captchaKey, TWO_CAPTCHA_API_KEY);

		console.log("Obtained captcha response", solvedCaptcha);

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
			console.log("Field error " + JSON.stringify(errorFields));
			return;
		}

		console.log("No errors. Proceeding to account creation");

		await accountCreationRequest({
			username,
			password,
			email,
			solvedCaptcha,
			date
		});
		
		// Wait for a couple of seconds for the email to be sent
		this.page.waitFor(10_000)
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

(async () => {
	const system = new System();
	await system.launchBrowser();
	//await system.createAccount();
})();
