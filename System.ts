import { Page, launch } from "puppeteer";

(async () => {
	const browser = await launch({ headless: false });
	const [page] = await browser.pages();
	page.goto("https://www.dofus.com/fr/creer-un-compte");

	await page.waitForSelector("#userlogin");
	await page.type("#userlogin", "Username");
	await page.waitForSelector("#user_password");
	await page.type("#user_password", "password");
	await page.waitForSelector("#user_mail");
	await page.type("#user_mail", "mail@mail.mail");
	await page.select("#ak_field_1", "1");
	await page.select("#ak_field_2", "1");
	await page.select("#ak_field_3", "1996");
})();
