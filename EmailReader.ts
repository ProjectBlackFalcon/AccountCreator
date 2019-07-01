import * as Imap from "imap";

export const readEmailsSince = async ({
	dateSince,
	subject,
	emailCredentials
}: {
	dateSince: Date;
	subject: "ADDRESS_CONFIRMATION" | "SUCCESSFUL_ACCOUNT_CREATION";
	emailCredentials: { user: string; password: string; host: string; port: number; tls: boolean }
}) => {
	const newLinks: string[] = [];

	await new Promise((resolve, reject) => {
		const imap = new Imap(emailCredentials);

		function openInbox(cb: (error: Error, mailbox: Imap.Box) => void) {
			imap.openBox("INBOX", true, cb);
		}

		imap.once("error", function(err: Error) {
			console.log(err);
		});

		imap.connect();

		imap.once("ready", function() {
			openInbox((err: Error, box: Imap.Box) => {
				if (err) {
					throw err;
				}

				imap.search(["UNSEEN"], function(err, results) {
					if (err) throw err;
					var f = imap.fetch(results, { bodies: ["HEADER.FIELDS (DATE)", "TEXT"] });

					f.on("message", function(msg, seqno) {
						let emailBody: Buffer;
						let emailDate: Buffer;
						msg.on("body", function(stream, info) {
							stream.on("data", chunk => {
								if (info.which === "TEXT") {
									emailBody += chunk;
								} else {
									emailDate += chunk;
								}
							});

							stream.on("end", () => {
								const body = emailBody.toString("utf-8");
								const date = emailDate.toString("utf-8");

								const dateIndexes = [date.indexOf("undefinedDate: ") + "undefinedDate: ".length, date.indexOf("+0000")];
								const utcMailDate = new Date(
									new Date(date.substring(dateIndexes[0], dateIndexes[1])).getTime() - new Date().getTimezoneOffset() * 60 * 1000
								);

								if (subject === "ADDRESS_CONFIRMATION") {
									const urlIndex = body.indexOf("https://www.dofus.com/fr/mmorpg/jouer?guid=");

									if (urlIndex != -1) {
										const url = body
											.substr(urlIndex, 300)
											.split(" ]")[0]
											.replace(/=\r\n/g, "")
											.replace(/=3D/g, "=");

										if (utcMailDate.getTime() > dateSince.getTime()) {
											newLinks.push(url);
										}
									}
								} else {
									const urlIndex = body.indexOf("Bienvenue dans la communaut");

									if (urlIndex != -1) {
										if (utcMailDate.getTime() > dateSince.getTime()) {
											newLinks.push("Successful account creation");
										}
									}
								}
							});
						});
					});

					f.once("error", function(err) {
						console.log("Fetch error: " + err);
						reject();
					});

					f.once("end", function() {
						imap.end();
						resolve();
					});
				});
			});
		});
	});

	return Array.from(new Set(newLinks));
};
