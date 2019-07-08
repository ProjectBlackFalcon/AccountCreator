"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = require("node-fetch");
async function invisibleCaptchaSolver(captchaIdentifier, twoCaptchaAPIKey) {
    const request = "http://2captcha.com/in.php?key=" +
        twoCaptchaAPIKey +
        "&method=userrecaptcha&googlekey=" +
        captchaIdentifier +
        "&json=true&pageurl=https://www.dofus.com/fr/creer-un-compte" +
        "&invisible=1";
    const result = await node_fetch_1.default(request);
    const resultJSON = await result.json();
    const requestID = resultJSON.request;
    let captchaInterval;
    const solvedCaptcha = await new Promise((resolve, reject) => {
        setTimeout(async () => {
            const responseRequest = "http://2captcha.com/res.php?key=" + twoCaptchaAPIKey + "&action=get&id=" + requestID + "&json=true";
            let responseResult = await node_fetch_1.default(responseRequest);
            let responseJSON = await responseResult.json();
            let response = responseJSON.request;
            if (response == "CAPCHA_NOT_READY") {
                captchaInterval = setInterval(async () => {
                    responseResult = await node_fetch_1.default(responseRequest);
                    responseJSON = await responseResult.json();
                    response = responseJSON.request;
                    if (response !== "CAPCHA_NOT_READY") {
                        if (captchaInterval) {
                            clearInterval(captchaInterval);
                        }
                        resolve(response);
                    }
                }, 15000);
            }
            else if (response === "CAPCHA_NOT_SOLVABLE") {
                reject(response());
            }
            else {
                if (captchaInterval) {
                    clearInterval(captchaInterval);
                }
                resolve(response);
            }
        }, 30000);
    });
    return solvedCaptcha;
}
exports.invisibleCaptchaSolver = invisibleCaptchaSolver;
