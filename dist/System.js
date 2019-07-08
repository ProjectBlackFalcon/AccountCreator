"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = require("puppeteer");
const CaptchaSolver_1 = require("./CaptchaSolver");
const Fetch_1 = require("./Fetch");
const EmailReader_1 = require("./EmailReader");
const config = require("./config.json");
const { EMAIL_CREDENTIALS, TWO_CAPTCHA_API_KEY, DOMAIN } = config;
class System {
    constructor() {
        this.launchBrowser = async () => {
            this.browser = await puppeteer_1.launch({ headless: true });
            [this.page] = await this.browser.pages();
        };
        this.createAccount = async ({ email, username, password, date }) => {
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
                if (!DOMAIN) {
                    console.log(exports.red("No email address was specified and no domain was found in config. Add a domain in config or specify the email address to create an account."));
                }
                email = username + "@" + DOMAIN;
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
                console.log("Field error " + JSON.stringify(errorFields));
                return;
            }
            console.log("No errors. Proceeding to captcha solving & account creation.");
            // Page is loaded, start fetching captcha
            const captchaKey = await this.page.$eval(".grecaptcha-logo", element => {
                const elementHTML = element.innerHTML;
                return elementHTML.substr(elementHTML.indexOf("k=") + 2, 300).split("&")[0];
            });
            console.log("Obtained captcha key", captchaKey);
            const solvedCaptcha = await CaptchaSolver_1.invisibleCaptchaSolver(captchaKey, TWO_CAPTCHA_API_KEY);
            console.log(solvedCaptcha.length > 100 ? "✔" : "❌", "Obtained captcha response");
            await Fetch_1.accountCreationRequest({
                username,
                password,
                email,
                solvedCaptcha,
                date
            });
            // Wait for a few seconds for the email to be sent
            await this.page.waitFor(10000);
            const links = await EmailReader_1.readEmailsSince({ dateSince, subject: "ADDRESS_CONFIRMATION", emailCredentials: EMAIL_CREDENTIALS });
            console.log("Fetched links", links);
            if (links.length > 0) {
                await this.page.goto(links[0]);
            }
            else {
                console.log(`❌ Account was ${exports.red(exports.bold("not"))} successfully created.`);
                return;
            }
            // Wait for a few seconds for the email to be sent
            await this.page.waitFor(10000);
            const confirmationEmail = await EmailReader_1.readEmailsSince({ dateSince, subject: "SUCCESSFUL_ACCOUNT_CREATION", emailCredentials: EMAIL_CREDENTIALS });
            if (confirmationEmail.length > 0) {
                console.log("✔", exports.green("Account was successfully created."));
            }
            else {
                console.log(`❌ Account was ${exports.red(exports.bold("not"))} successfully created.`);
            }
        };
    }
    async checkFields(page) {
        const elements = await page.$$eval(".error", elements => {
            return elements
                .map(element => {
                return { type: element.htmlFor, value: element.innerHTML };
            })
                .filter(element => element.value !== "");
        });
        return elements;
    }
}
exports.System = System;
exports.red = (text) => `\x1b[31m${text}\x1b[0m`;
exports.green = (text) => `\x1b[32m${text}\x1b[0m`;
exports.yellow = (text) => `\x1b[33m${text}\x1b[0m`;
exports.bold = (text) => `\x1b[1m${text}\x1b[0m`;
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
