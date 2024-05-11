import express from "express";
import { join } from "path";
import { Low, JSONFile } from "lowdb";
import { Client, GatewayIntentBits, REST, Routes, Events, EmbedBuilder, SlashCommandBuilder, ActivityType } from "discord.js";
import snowflakeid from "flakeid"; // used for generating warnids

const token = "";
const loggingChannel = "929727980694044742";
const prefix = ".";
const app = express();
const port = 8080;
const file2 = join("./", "Roles.json"); // I am quite aware of these json databases but uh :yawning_face:
const adapter2 = new JSONFile(file2);
const db2 = new Low(adapter2);
const file = join("./", "DB.json");
const adapter = new JSONFile(file);
const db = new Low(adapter);
const warnsf = join("./", "Warns.json");
const adapterw = new JSONFile(warnsf);
const warns = new Low(adapterw);

await db.read();
await db2.read();
await warns.read();

const client = new Client({
	intents: [
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	]
});

const snowflake = new snowflakeid({
	mid : 42,
	offset : (2021-1970)*31536000*1000
});

function between(min, max) {
	return Math.floor(
		Math.random() * (max - min) + min
	)
};

client.on("messageCreate", msg => {
	let data = db.data;
	if (msg.author.bot) {
		return
	}
	if(!data[msg.author.id]){
		data[msg.author.id] = {
			"xp": 0,
			"Levels": 1,
			"lastmsg": 0
		}
		db.write();
	}
	let UD = data[msg.author.id];
	if (UD.lastmsg === 0 ){
		UD.lastmsg = Date.now();
		db.write();
	}
	if (UD) {
		if (Date.now() - UD.lastmsg >= 65000) {
			UD.xp += between(10, 12)
			UD.lastmsg = Date.now();
			if (UD.xp > (UD.Levels * 112) && UD.xp < ((UD.Levels + 1) * 112)) {
				UD.Levels += 1;
				UD.xp = 0;
				if (UD["logLevels"] || UD["logLevels"] === undefined) {
	  				client.channels.cache.get(loggingChannel).send(`<@${msg.author.id}>, you advanced to level ${UD.Levels}.`);
				} else if (UD["logLevels"] === false) {
					client.channels.cache.get(loggingChannel).send(`${msg.author.tag}, you advanced to level ${UD.Levels}.`);
				}
				for (const v in db2.data) {
					if (UD.Levels >= db2.data[v].level) {
						let role = msg.guild.roles.cache.find(role => role.id === db2.data[v].ID.toString());
						if (msg.member.roles.cache.has(role.id)) {} else {
							msg.member.roles.add(role);
						}
					}
				}
			}
			db.write();
		}
	} else {
		db.data[msg.author.id] = {
			"xp": 0,
			"Levels": 1,
			"lastmsg": 0
		}
		db.write();
	}
});

client.on("messageCreate", msg => {
	if (!msg.content.startsWith(prefix) || msg.author.bot) return;
	const args = msg.content.slice(prefix.length).trim().split(" ");
	const command = args.shift().toLowerCase();

	if (command === "setlevelrole") {
		if (!msg.member.roles.cache.some(r => r.id === "923444560766590986")) {
			return
		}
		if (args[0] && args[1] && args[2]) {
			let name = args[0];
			let ID = args[1];
			let level = parseInt(args[2], 10)
			db2.data[name] = {
				"ID": ID,
				"level": level
			}
			db2.write()
			msg.channel.send({
				embeds: [{
					"type": "rich",
					"title": `Level Rank status`,
					"description": "level role set :thumbsup:",
					"color": 0x0073ff
				}]
			})
		}
	} else if(command === "warn"){
	if (msg.member.roles.cache.some(r => r.id === "923444560766590986")) {
	  let warnedUser = msg.mentions.users.first()
	  
	  if (warnedUser && !warnedUser.bot) {
		let id = warnedUser.id
		if (warns.data[id]){
		  args.splice(0, 1) // removes the mention in the msg
		  if(args.length === 0){
			args[0] = "an unspecified reason"
		  }
		  let reason = args.join(" ")
		  let warnid = snowflake.gen();
		  warns.data[id][warnid] = {"reason" : reason, "date" : Date.now()}
		  const Embed = new EmbedBuilder()
		  	.setColor(0x0073ff)
			.setTitle("Warned User")
			.setDescription(`<@${id}> has been warned.`)
			.addFields({
				"name" : "Reason:",
				"value" : reason,
				"inline" : false
			})
		const NEmbed = new EmbedBuilder()
		  	.setColor(0x0073ff)
			.setTitle("You have been warned.")
			.setDescription(`you have just been warned.`)
			.addFields({
				"name" : "Reason:",
				"value" : reason,
				"inline" : false
			})
		  msg.reply({ embeds: [Embed] })
		  warnedUser.send({ embeds: [NEmbed] })
		  warns.write();
		} else {
		  let id = warnedUser.id
		  args.splice(0, 1) // removes the mention in the msg
		  if(args.length === 0){
			args[0] = "an unspecified reason"
		  }
		  let reason = args.join(" ");
		  let warnid = snowflake.gen();
		  warns.data[id] = {}
		  warns.data[id][warnid] = {"reason" : reason, "date" : Date.now()}
		  const Embed = new EmbedBuilder()
		  	.setColor(0x0073ff)
			  .setTitle("Warned User")
			  .setDescription(`<@${id}> has been warned.`)
			  .addFields({
				  "name" : "Reason:",
				  "value" : reason,
				  "inline" : false
			})
		  msg.reply({ embeds: [Embed] })
		  warns.write();
		}
	  } else if(warnedUser && warnedUser.bot) {
		  msg.reply("bots cannot be warned")
	  }
	}
  } else if(command === "warnings"){
	 if (msg.member.roles.cache.some(r => r.id === "923444560766590986")) {
	  let warnedUser = msg.mentions.users.first()
		let Embed = new EmbedBuilder()
		.setColor(0x0073FF)
		.setTitle(`${warnedUser.tag} infractions \nall infractions: `)
	if (warnedUser) {
		let id = warnedUser.id;
		let warnings = "";
		if (warns.data[id]){
			let d1 = warns.data[id]
			let count = 0
			for (let v in d1) {
				count += 1;
				let d = new Date();
				let nowTs = d.getTime();
				let seconds = nowTs/1000-d1[v].date/1000;
				let timestamp = "";
				if (seconds > 2*24*3600) {
					let days = Math.floor(seconds / 86400);
					timestamp =  `${days} days ago`;
				}
				else if (seconds > 24*3600) {
					timestamp =  "yesterday";
				}
				else if (seconds > 3600) {
					let hours = Math.floor(seconds / 3600);
					timestamp =  `${hours} hours ago`;
				}
				else if (seconds > 1800) {
					let minutes = Math.floor(seconds / 60);
					timestamp = `${minutes} minutes ago`;
				}
				else if (seconds > 60) {
					timestamp =  Math.floor(seconds/60) + " minutes ago";
				}
				let s = `**${d1[v].reason} •** ${timestamp}`
				Embed.addFields({"name" : s, "value" : `[Warning ID](https://MEAp.mexoeo.repl.co/display?id=${v})`, "inline" : false})
			}
			Embed.setDescription(`Total Infractions: ${count}`)
			msg.reply({ embeds: [Embed] });
		}
  }}
  } else if(command === "removewarn"){
		if (msg.member.roles.cache.some(r => r.id === "923444560766590986")) {
			let warnedUser = msg.mentions.users.first();
			if (warnedUser) {
				let id = warnedUser.id;
				if (warns.data[id]){
					let d1 = warns.data[id];
					if(args[1]){
						if(d1[args[1]]) {
							delete d1[args[1]]
							warns.write();
							const Embed = new EmbedBuilder()
								.setColor(0x0073FF)
								.setTitle(`Removed warning with id of: ${args[1]}.`)
								.setDescription(`Successfully removed the warning from ${warnedUser.tag}.`)
							msg.reply({ embeds: [Embed] });
						}
			  		}
				}
			}
		}
	}
});

client.on("messageCreate", msg => {
	if (!msg.content.startsWith(prefix) || msg.author.bot) return;
	const args = msg.content.slice(prefix.length).trim().split(" ");
	const command = args.shift().toLowerCase();

	if (command === "purge" || command === "clear") {
		if (!msg.member.roles.cache.some(r => r.id === "923444560766590986")) {
			msg.channel.send({
				embeds: [{
					"type": "rich",
					"title": `Purged`,
					"description": "You need to be an administrator to use this command.",
					"color": 0x0073ff
				}]
			});
			return;
		} 
		if (args[0] && !isNaN(+args[0])) {
			try {
				msg.delete()
				msg.channel.bulkDelete(parseInt(args[0]))
				let a = msg.channel.send({
					embeds: [{
						"type": "rich",
						"title": `Purged`,
						"description": `Purged ${args[0]} Messages.`,
						"color": 0x0073ff
					}]
				}).then(a => setTimeout(function() {
					a.delete();
				}, 3000));		
			} catch (error) {
				msg.channel.send({
					embeds: [{
						"type": "rich",
						"title": `Error`,
						"description": "an Error occured",
						"color": 0x0073ff
					}]
				});
				console.log(error);
			}
		} else {
			msg.channel.send({
				embeds: [{
					"type": "rich",
					"title": `Purged`,
					"description": "Argument 1 missing or argument 1 is not a number.",
					"color": 0x0073ff
				}]
			});
		}
	}
});

client.on(Events.InteractionCreate, interaction => {
	if (interaction.commandName === "ping"){
		interaction.reply("Pong!");
  	} else if(interaction.commandName === "rank"){
		const user_i = interaction.options.getUser("user")
		let arg = interaction.user.id;
		
		if (user_i) {
			arg = user_i.id;
			if (user_i.bot) {
				interaction.reply("Requested user is a bot and therefore invalid.");
				return;
			}
		}

		let user = client.users.cache.find(user => user.id === arg);
		let data = db.data[arg];
		if (!data) {
			interaction.reply({
				embeds: [{
					"type": "rich",
					"title": `Users Rank`,
					"description": `current stats\nid: ${arg} \nXP: 0/0\nLEVEL: 1\nUsername: ${user.username}`,
					"color": 0x0073ff,
				}]
	 		});
			return;
		}
		if (user != undefined) {
			interaction.reply({
				embeds: [{
					"type": "rich",
					"title": `Users Rank`,
					"description": `current stats\nid: ${arg} \nXP: ${data.xp}/${data.Levels * 112}\nLEVEL: ${data.Levels}\nUsername: ${user.username}`,
					"color": 0x0073ff,
				}]
	 		});
	 	 } else {
			interaction.reply({
			  	embeds: [{
					"type": "rich",
					"title": `Users Rank`,
					"description": `current stats\nid: ${arg} \nXP: ${data.xp}/${data.Levels * 112}\nLEVEL: ${data.Levels}\nUsername: Username Not Found`,
					"color": 0x0073ff,
				}]
			});
		}
	} else if(interaction.commandName === "level_up_pings") {
		let arg = interaction.user.id;
		let data = db.data[arg];
		const value = interaction.options.getString("value")

		if (value === "off") {
			data["logLevels"] = false;
			interaction.reply({
				embeds: [{
					"type": "rich",
					"title": `level-up pings`,
					"description": `Set value of level-up pings to false`,
					"color": 0x0073ff,
			  	}]
			});
			db.write();
		} else if(value === "on") {
			data["logLevels"] = true;
			interaction.reply({
				embeds: [{
					"type": "rich",
					"title": `level-up pings`,
					"description": `Set value of level-up pings to true`,
					"color": 0x0073ff,
			  	}]
			});
			db.write();
		}
	} else if(interaction.commandName === "docs") {
		const type = interaction.options.getString("type")
		const type2 = interaction.options.getString("type2")
		const what = interaction.options.getString("what")
		const property = interaction.options.getString("propertymethodevent")
		if (property) {
			interaction.reply(`https://create.roblox.com/docs/reference/${type}/${type2}/${what}#${property}`)
		}
	} else if(interaction.commandName === "member_count") {
		if(interaction.guild){
			interaction.reply({
				embeds: [{
					"type": "rich",
					"title": `Member Count`,
					"description": interaction.guild.memberCount,
					"color": 0x0073ff,
				}]
			})
		} else {
			interaction.reply({
				embeds: [{
					"type": "rich",
					"title": `Member Count`,
					"description": "null",
					"color": 0x0073ff,
				}]
			})
		}
	} else if(interaction.commandName === "percentage") {
		const value = interaction.options.getString("value")
		const user_i = interaction.options.getUser("user")
		
		if (value === "Communist") {
			interaction.reply({
				embeds: [{
					"type": "rich",
					"title": `Rating <:hammer_sickle:1106776302435967057>`,
					"description": `Analyzing behavior <a:loading:1106779481441587232>\n<@${user_i.id}> is ` + between(0, 100) + `% Communist. <:hammer_sickle:1106776302435967057>`,
					"color": 0x0073ff,
				}]
			})
		}
	}
	
});

client.on(Events.ClientReady, c => {
	console.log(`Logged in as ${c.user.tag}!`);
	client.user.setPresence({
		activities: [{ name: "Roblox Lua Community", type: ActivityType.Watching}],
	});
});

app.listen(port, () => console.log(`Luau Bot listening at http://localhost:${port}`));

app.get('/display', function(req, res) {
	let id = req.query.id;
	if(id){
		res.end(`id: ${id}`);
	}
});

(async () => {
  	await client.login(token).catch((err) => {
		throw err;
  	});

  	const rest = new REST({ version: "10" }).setToken(token);
	const levelUpPings = new SlashCommandBuilder()
		.setName("level_up_pings")
		.setDescription("turns the pinging from the level up messages off or on for just you")
		.addStringOption( option => 
			option.setName("value")
			.setDescription("off or on")
			.setRequired(true)
			.addChoices({ name: 'on', value: 'on' }, { name: 'off', value: 'off' }) )
	const membercount = new SlashCommandBuilder()
		.setName("member_count")
		.setDescription("Gets the member count of the server.")
	const docs = new SlashCommandBuilder()
		.setName("docs")
		.setDescription("Command which fetches anything from the roblox api")
		.addStringOption(option => option
			.setName("type")
			.setDescription("What type of Document from Roblox")
			.addChoices({name: "Engine", value: "engine"})
			.setRequired(true))
		.addStringOption(option2 => option2
			.setName("type2")
			.setDescription("What type of the type of the Document from Roblox")
			.addChoices({name: "Classes", value: "classes"})
			.setRequired(true))
		.addStringOption(option3 => option3
			.setName("what")
			.setDescription("What the thing is")
			.setRequired(true))
		.addStringOption(option4 => option4
			.setName("propertymethodevent")
			.setDescription("not required but could be used to fetch a property, event or method from the object")
			.setRequired(false))
	const rank = new SlashCommandBuilder()
		.setName("rank")
		.setDescription("returns the user's ranks")
		.addUserOption(user => user
			.setName("user")
			.setRequired(false)
			.setDescription("the user you want to get the rank of"))
	const percentage = new SlashCommandBuilder()
		.setName("percentage")
		.setDescription("rates the users percentage of being ___")
		.addUserOption(user => user
			.setName("user")
			.setRequired(true)
			.setDescription("the user you want to get the percentage on"))
		.addStringOption(option2 => option2
			.setName("value")
			.setDescription("What youre going to be rated by")
			.addChoices({name: "Communist", value: "Communist"})
			.setRequired(true))
	const ping = new SlashCommandBuilder()
		.setName("ping")
		.setDescription('returns "Pong!" back to the user')

	await rest.put(Routes.applicationCommands(client.user.id), { body: [
		ping,
		rank,
		levelUpPings,
		docs,
		membercount,
		percentage
  	]});
})();