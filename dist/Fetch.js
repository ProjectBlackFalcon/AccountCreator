"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = require("node-fetch");
exports.accountCreationRequest = async ({ username, password, email, solvedCaptcha, date }) => {
    const body = `userlogin=${username}&userpassword=${password}&useremail=${email}&birth_day=${date.day}&birth_month=${date.month}&birth_year=${date.year}&parentemail=noreply%40ankama.com&sAction=submit&g-recaptcha-response=${solvedCaptcha}&_pjax=.ak-registerform-container`;
    await node_fetch_1.default("https://www.dofus.com/fr/creer-un-compte", {
        credentials: "include",
        headers: {
            accept: "text/html, */*; q=0.01",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "x-pjax": "true",
            "x-pjax-container": ".ak-registerform-container",
            "x-requested-with": "XMLHttpRequest"
        },
        referrer: "https://www.dofus.com/fr/creer-un-compte",
        referrerPolicy: "no-referrer-when-downgrade",
        body,
        method: "POST",
        mode: "cors"
    });
};
