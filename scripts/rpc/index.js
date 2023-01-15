const { Client } = require("discord-rpc");

var startTimestamp = new Date();

async function reconnect() {
	try {
		await login();
	} catch (error) {
		console.error("discord not open:", error);
		setTimeout(async () => {
			await reconnect();
		}, 1000 * 10);
	}
}

reconnect();

async function login() {
	console.log("login");

	rpc = new Client({
		transport: "ipc",
	});

	rpc.on("ready", () => {
		console.log("logged in: ", rpc.user.username);

		rpc.setActivity({
			details: `Free open source selfhostable`,
			state: `Chat, voice, video and discord-compatible platform`,
			startTimestamp,
			smallImageText: "flam3rboy",
			largeImageKey: "logo2",
			largeImageText: "Sneedcord",
			instance: false,
			buttons: [
				{ label: "Discord", url: "https://discord.gg/ZrnGQP6p3d" },
				{
					label: "Website",
					url: "https://sneedcord.com",
				},
			],
		});
	});

	rpc.on("disconnected", async () => {
		console.log("disconnected");
		await reconnect();
	});

	return rpc.login({ clientId: "807686638742142988" });
}
