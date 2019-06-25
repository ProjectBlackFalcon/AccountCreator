import fetch from "node-fetch";
import { TWO_CAPTCHA_API_KEY } from "./config";

export async function invisibleCaptchaSolver(captchaIdentifier: string, twoCaptchaAPIKey: string): Promise<string> {
	const request =
		"http://2captcha.com/in.php?key=" +
		twoCaptchaAPIKey +
		"&method=userrecaptcha&googlekey=" +
		captchaIdentifier +
		"&json=true&pageurl=https://www.dofus.com/fr/creer-un-compte" +
		"&invisible=1";
	const result = await fetch(request);
	const resultJSON = await result.json();
	const requestID: string = resultJSON.request;

	let captchaInterval: NodeJS.Timeout;
	const solvedCaptcha: string = await new Promise((resolve, reject) => {
		setTimeout(async () => {
			const responseRequest = "http://2captcha.com/res.php?key=" + twoCaptchaAPIKey + "&action=get&id=" + requestID + "&json=true";
			let responseResult = await fetch(responseRequest);
			let responseJSON = await responseResult.json();
			let response = responseJSON.request;

			if (response == "CAPCHA_NOT_READY") {
				captchaInterval = setInterval(async () => {
					responseResult = await fetch(responseRequest);
					responseJSON = await responseResult.json();
					response = responseJSON.request;
					if (response !== "CAPCHA_NOT_READY") {
						if (captchaInterval) {
							clearInterval(captchaInterval);
						}
						resolve(response);
					}
				}, 15000);
			} else if (response === "CAPCHA_NOT_SOLVABLE") {
				reject(response());
			} else {
				if (captchaInterval) {
					clearInterval(captchaInterval);
				}
				resolve(response);
			}
		}, 30000);
	});

	return solvedCaptcha;
}