import fetch from "node-fetch";

export const accountCreationRequest = async ({
	username,
	password,
	email,
	solvedCaptcha,
	date
}: {
	username: string;
	password: string;
	email: string;
	solvedCaptcha: string;
	date: { day: number; month: number; year: number };
}) => {
	const body = `userlogin=${username}&userpassword=${password}&useremail=${email}&birth_day=${date.day}&birth_month=${date.month}&birth_year=${
		date.year
	}&parentemail=noreply%40ankama.com&sAction=submit&g-recaptcha-response=${solvedCaptcha}&_pjax=.ak-registerform-container`;

	await fetch("https://www.dofus.com/fr/creer-un-compte", <any>{
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
