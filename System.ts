import { Page, launch } from "puppeteer";

(async () => {
	const browser = await launch({ headless: false });
	const [page] = await browser.pages();
	page.goto("https://www.dofus.com/fr/creer-un-compte");

	await page.waitForSelector("#userlogin");
	await page.type("#userlogin", "Username1345542");
	await page.waitForSelector("#user_password");
	await page.type("#user_password", "password123NiceEh");
	await page.waitForSelector("#user_mail");
	await page.type("#user_mail", "lysandre@hotmail.com");
	await page.select("#ak_field_1", "1");
	await page.select("#ak_field_2", "1");
	await page.select("#ak_field_3", "1996");

	// To remove focus from the mail field so that the error event can be triggered.
	await page.click("#userlogin");
	await page.waitFor(500);
	let errorFields = await checkFields(page);
	if (errorFields.length) {
		throw new Error("Field error " + JSON.stringify(errorFields));
		process.exit();
	}

	await page.click("#ak_field_4");
})();

async function checkFields(page: Page) {
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
