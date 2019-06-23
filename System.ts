import { Page, launch, Browser } from "puppeteer";
import { invisibleCaptchaSolver } from "./CaptchaSolver";
import { TWO_CAPTCHA_API_KEY } from "./config";

class System {
	browser?: Browser;
	page?: Page;

	launchBrowser = async () => {
		this.browser = await launch({ headless: false });
		[this.page] = await this.browser.pages();
	};

	createAccount = async (username?: string, password?: string, date?: { day: number; month: number; year: number }) => {
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

		console.log("Captcha key", captchaKey)		
		
		const captchaResponse = await invisibleCaptchaSolver(captchaKey, TWO_CAPTCHA_API_KEY);
		
		console.log("Captcha response", captchaResponse)	

		await this.page.type("#userlogin", "Hereticx2k", {delay: 50});
		await this.page.waitForSelector("#user_password");
		await this.page.type("#user_password", "hereticpasszord12(", {delay: 50});
		await this.page.waitForSelector("#user_mail");
		await this.page.type("#user_mail", "hereticx2k@gmail.com", {delay: 50});
		await this.page.waitFor(1000)	
		await this.page.select("#ak_field_1", "1");
		await this.page.waitFor(1000)
		await this.page.select("#ak_field_2", "1");
		await this.page.waitFor(1000)
		await this.page.select("#ak_field_3", "1996");

		// To remove focus from the mail field so that the error event can be triggered.
		await this.page.click("#userlogin");
		await this.page.waitFor(500);
		let errorFields = await this.checkFields(this.page);
		if (errorFields.length) {
			throw new Error("Field error " + JSON.stringify(errorFields));
			process.exit();
		}
		
		await this.page.evaluate(solvedCaptcha => {
			// Typing the captcha solution we received from repatcha.
			const googleCaptchaConfig = (<any>window)["___grecaptcha_cfg"].clients[0];

			// This code finds the callback function within the web page.
			// The object '___grecaptcha_cfg' has obfuscated attributes that change regularly.
			// It is therefore important not to rely on the naming of those objects, but to rely on the callback function whose name does not change.
			// This sends the data that we filled in the text area to google and validates the Captcha.
			const findObject = (object: any, name: string): any => {
				for (const key in object) {
					if (Object.keys(object[key]).includes(name)) {
						return object[key][name];
					} else if (typeof object[key] === "object") {
						const res = findObject(object[key], name);
						if (res) {
							return res;
						}
					}
				}
			};

			const callback = findObject(googleCaptchaConfig, "callback");
			console.log(callback(solvedCaptcha));
			console.log("Solved captcha!")
		}, captchaResponse);
		
		await this.page.evaluate(captchaResponse => {
			document.getElementById("g-recaptcha-response")!.innerHTML = captchaResponse
		}, captchaResponse)

		await this.page.click("#ak_field_4");
		await this.page.waitFor(3000)
		
		const errors: HTMLCollection = await this.page.$$eval(".ak-register-error", elements => elements) as unknown as HTMLCollection
		
		if(errors.length){
			console.log("The account couldn't be created, probably due to bot detection.")
		}else{
			console.log("Account creation successful.")
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

(async () => {
	const system = new System();
	await system.launchBrowser();
	await system.createAccount();
})();
