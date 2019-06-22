import { Page, launch, Browser } from "puppeteer";

class System{
	browser?: Browser;
	page?: Page;
	
	constructor(){
		this.launchBrowser()
	}
	
	launchBrowser = async () => {
		this.browser = await launch({ headless: false });
		[this.page] = await this.browser.pages()
	}
	
	createAccount = async (username?: string, password?: string, date?: {day: number, month: number, year: number}) => {
		if(!this.page || !this.browser){
			return
		}
		
		await this.page.goto("https://www.dofus.com/fr/creer-un-compte");
		await this.page.waitForSelector("#userlogin");
		await this.page.type("#userlogin", "Username1345542");
		await this.page.waitForSelector("#user_password");
		await this.page.type("#user_password", "password123NiceEh");
		await this.page.waitForSelector("#user_mail");
		await this.page.type("#user_mail", "lolkay@blackfalcon.fr");
		await this.page.select("#ak_field_1", "1");
		await this.page.select("#ak_field_2", "1");
		await this.page.select("#ak_field_3", "1996");

		// To remove focus from the mail field so that the error event can be triggered.
		await this.page.click("#userlogin");
		await this.page.waitFor(500);
		let errorFields = await this.checkFields(this.page);
		if (errorFields.length) {
			throw new Error("Field error " + JSON.stringify(errorFields));
			process.exit();
		}

		await this.page.click("#ak_field_4");
	}
	
	async checkFields(page: Page) {
		const elements = await page.$$eval(".error", elements => {
			console.log(elements);
			return elements
				.map(element => {
					return { type: (element as HTMLLabelElement).htmlFor, value: element.innerHTML };
				})
				.filter(element => element.value !== "");
		});
	
		return elements;
	}
}

