import * as Imap from "imap";
import { EMAIL_CREDENTIALS } from "./config";
import { inspect } from "util";
import * as fs from "fs";

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

export const readEmailsSince = (date: Date) => {
	imap.once("ready", function() {
		openInbox((err: Error, box: Imap.Box) => {
			if (err) {
				throw err;
			}
			
			imap.search(["UNSEEN"], function(err, results) {
				if (err) throw err;
				var f = imap.fetch(results, { bodies: "" });
				
				f.on("message", function(msg, seqno) {
					console.log("Message #%d", seqno);
					var prefix = "(#" + seqno + ") ";
					msg.on("body", function(stream, info) {
						console.log(prefix + "Body");
						let emailBody: Buffer;
						stream.on("data", chunk => emailBody += chunk)
						stream.on("end", () => {
							const body = emailBody.toString()
							const urlIndex = body.indexOf("https://www.dofus.com/fr/mmorpg/jouer?guid=");
							if(urlIndex != -1){
								const url = body.substr(urlIndex, 300).split(" ]")[0].replace(/=\r\n/g, "").replace(/=3D/g, "=")
								console.log(body, url)	
							}
						})
					});
					msg.once("attributes", function(attrs) {
						console.log(prefix + "Attributes: %s", inspect(attrs, false, 8));
					});
					msg.once("end", function() {
						console.log(prefix + "Finished");
					});
				});
				
				f.once("error", function(err) {
					console.log("Fetch error: " + err);
				});
				
				f.once("end", function() {
					console.log("Done fetching all messages!");
					imap.end();
				});
				
			});
		});
	});	
}

readEmailsSince(new Date())