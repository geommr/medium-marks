const express = require("express");
const mongoose = require("mongoose"); // not yet required
const request = require("request");
const cheerio = require("cheerio");
const env = require("./env");
const port = process.env.PORT || env.PORT;
const bookmarksOptions = {
  url: `https://medium.com/me/list/bookmarks?limit=${env.LIMIT}`,
  headers: {
    'Cookie': env.MEDIUM_COOKIE
  }
};

const app = express();
app.set("view engine", "ejs");

mongoose.connect(env.mongoURI)
	.then(() => console.log("MongoDB connected"))
	.catch((err) => console.log(err));
	
app.use(express.static(__dirname + "/views"));
app.use(express.static(__dirname + "/public"));

app.get("/bookmarks", async (req, res) => {
	let list = await getBMs();
	res.render("index", {list: list});
});

app.get("/api/bookmarks", async (req, res) => {
	let list = await getBMs();
	res.send(list);
});

function getBMs() {
	return new Promise(function (resolve, reject) {
		let result = [];
		request(bookmarksOptions, function(err, res, html) {
			if (!err && res.statusCode == 200) {
				const $ = cheerio.load(html);
				$(".streamItem .link.link--noUnderline.u-baseColor--link").each(function(i, elem) {
					let bm = {};
					if (i%2 == 0) {
						bm["title"] = elem.children[0].children[0].data;
						bm["desc"] = elem.children[1] ? elem.children[1].children[0].data : "";
						bm["link"] = elem.attribs.href;
						bm["time_mins"] = parseInt(elem.next.children[3].next.attribs.title);
						result.push(bm);
					}
				});
				resolve(result);
			} else {
				reject(err);
			}
		});
	});
}

app.listen(port, () => console.log(`Server running on ${port}`));