require("missing-native-js-functions");
const fetch = require("node-fetch");
const { Client } = require("@notionhq/client");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();

const PRIORITIES = ["low priority", "medium priority", "high priority"];

class GithubNotionSync {
	constructor({ github, notion }) {
		this.githubAuth = github.token;
		this.githubWebhookSecret = github.webhookSecret;
		this.notionAuth = notion.token;
		this.databaseID = notion.database_id;
		this.org = github.organization;
		this.notion = new Client({ auth: this.notionAuth });
		this.urls = {
			base: "https://api.github.com/",
		};
	}

	async init() {
		this.allNotionPages = await this.getAllNotionPages();
		this.repos = await this.getAllIssueUrls();

		app.use(bodyParser({}));
		app.post("/github", this.handleWebhook.bind(this));
		app.listen(3010, () => {
			console.log("Github <-> Notion sync listening on :3010");
		});
	}

	async handleWebhook(req, res) {
		const { hook, issue } = req.body;

		await this.addItemToDb(GithubNotionSync.convertIssue(issue));
		res.sendStatus(200);
	}

	async execute() {
		await this.init();
		let issues = 0;

		for (let repo of this.repos) {
			for (let issue of await this.getAllIssuesPerRepo(repo)) {
				this.addItemToDb(issue);
				issues++;
			}
		}

		return issues;
	}

	/**
	 * @returns array of urls in the following form:
	 * https://api.github.com/repos/${this.org}/${repo_name}/issues
	 */
	async getAllIssueUrls() {
		let repos = await fetch(`${this.urls.base}orgs/${this.org}/repos`, {
			headers: {
				Authorization: `token ${this.githubAuth}`,
				"User-Agent": this.org,
			},
		}).then((r) => r.json());
		return repos.map((repo) => `${this.urls.base}repos/${this.org}/${repo.name}/issues`);
	}

	/**
	 * @param repoIssueUrl element of array returned by `getAllIssueUrls()`
	 * @returns array of issues for the given repo in the following json form:
	 * ```
	 * {
	 *  url: 'https://api.github.com/repos/sneedcord/sneedcord-server/issues/78',
	 *  title: '[Route] /guilds/:id/regions',
	 *  body: '- [ ] regions',
	 *  number: 78,
	 *  state: 'open',
	 *  label: 'Route',
	 *  assignee: 'Stylix58'
	 * }
	 * ```
	 */
	async getAllIssuesPerRepo(repoIssueUrl) {
		var allIssues = [];
		var page = 1;

		do {
			var issues = await fetch(`${repoIssueUrl}?state=all&direction=asc&per_page=100&page=${page}`, {
				headers: {
					Authorization: `token ${this.githubAuth}`,
					"User-Agent": this.org,
				},
			}).then((r) => r.json());
			issues = issues.filter((x) => !x.pull_request).map(GithubNotionSync.convertIssue);
			page++;

			allIssues = allIssues.concat(issues);
		} while (issues.length);
		return allIssues;
	}

	static convertIssue(x) {
		return {
			url: x?.html_url,
			title: x?.title,
			body: x?.body,
			number: x?.number,
			state: x?.state,
			labels: x?.labels,
			assignees: x?.assignees,
		};
	}

	/**
	 * @returns {Promise<import("@notionhq/client/build/src/api-types").Page[]>}
	 */
	async getAllNotionPages() {
		var allPages = [];
		var start_cursor;

		do {
			var pages = await this.notion.databases.query({
				database_id: this.databaseID,
				page_size: 100,
				...(start_cursor && { start_cursor }),
			});
			start_cursor = pages.next_cursor;
			allPages = allPages.concat(pages.results);
		} while (pages.has_more);

		return allPages;
	}

	async addItemToDb(issue) {
		const priority = issue.labels.find((x) => PRIORITIES.includes(x.name.toLowerCase()))?.name;

		const options = {
			parent: { database_id: this.databaseID },
			properties: {
				Name: {
					title: [
						{
							text: {
								content: issue.title,
							},
						},
					],
				},
				State: {
					select: {
						name: issue.state,
					},
				},
				Repo: {
					select: {
						name: GithubNotionSync.getRepoNameFromUrl(issue.url),
					},
				},
				Url: {
					url: issue.url,
				},
				Number: { number: issue.number },
				...(issue.assignees && {
					Assignee: {
						multi_select: issue.assignees.map((x) => ({ name: x.login })),
					},
				}),
				...(issue.labels && {
					Label: {
						multi_select: issue.labels
							.filter((x) => !PRIORITIES.includes(x.name.toLowerCase()))
							.map((x) => ({ name: x.name })),
					},
				}),
				...(priority && {
					Priority: {
						select: { name: priority },
					},
				}),
			},
			children: [
				{
					object: "block",
					type: "paragraph",
					paragraph: {
						text: [
							{
								type: "text",
								text: {
									content: issue.body?.slice(0, 1990) || "",
								},
							},
						],
					},
				},
			],
		};

		const exists = this.allNotionPages.find(
			(x) =>
				x.properties.Number.number == issue.number &&
				x.properties.Repo.select.name === GithubNotionSync.getRepoNameFromUrl(issue.url)
		);

		try {
			if (exists) {
				if (
					exists.properties.Name?.title?.[0].plain_text !== issue.title ||
					exists.properties.Priority?.select.name !== priority ||
					exists.properties.State?.select.name !== issue.state ||
					JSON.stringify(issue.labels.map((x) => x.name)) !==
						JSON.stringify(exists.properties.Label?.multi_select.map((x) => x.name)) ||
					JSON.stringify(issue.assignees.map((x) => x.login)) !==
						JSON.stringify(exists.properties.Assignee?.multi_select.map((x) => x.name))
				) {
					console.log("update existing one");
					await this.notion.pages.update({ page_id: exists.id, properties: options.properties });
					exists.properties = options.properties;
				}
			} else {
				console.log("adding new one");
				const index = this.allNotionPages.push(options) - 1; // directly insert it as they might be inserted twice if the webhook is triggered in very short amount of time
				this.allNotionPages[index] = await this.notion.pages.create(options);
			}
		} catch (error) {
			console.log(issue);
			console.error(error.body, error);
		}
	}

	static getRepoNameFromUrl(url) {
		return url?.match(/sneedcord\/(sneedcord-)?([\w.-]+)/)[2];
	}
}
module.exports = { GithubNotionSync };
