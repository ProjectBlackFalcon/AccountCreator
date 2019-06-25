import * as Imap from "imap";
import { EMAIL_CREDENTIALS } from "./config";

export const readEmailsSince = async (dateSince: Date) => {
	const newLinks: string[] = [];

	await new Promise((resolve, reject) => {
		const imap = new Imap(EMAIL_CREDENTIALS);

		function openInbox(cb: (error: Error, mailbox: Imap.Box) => void) {
			imap.openBox("INBOX", true, cb);
		}

		imap.once("error", function(err: Error) {
			console.log(err);
		});

		imap.once("end", function() {
			console.log("Connection ended");
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
						console.log("Received message");
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

								const urlIndex = body.indexOf("https://www.dofus.com/fr/mmorpg/jouer?guid=");
								const dateIndexes = [date.indexOf("undefinedDate: ") + "undefinedDate: ".length, date.indexOf("+0000")];

								if (urlIndex != -1) {
									const url = body
										.substr(urlIndex, 300)
										.split(" ]")[0]
										.replace(/=\r\n/g, "")
										.replace(/=3D/g, "=");

									const utcMailDate = new Date(
										new Date(date.substring(dateIndexes[0], dateIndexes[1])).getTime() -
											new Date().getTimezoneOffset() * 60 * 1000
									);
									console.log(utcMailDate, (utcMailDate.getTime() - dateSince.getTime()) / (60 * 1000));
									console.log(url + "\n");

									if (utcMailDate.getTime() > dateSince.getTime()) {
										newLinks.push(url);
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
						console.log("Done fetching all messages!");
						imap.end();
						resolve();
					});
				});
			});
		});
	});

	return Array.from(new Set(newLinks));
};
