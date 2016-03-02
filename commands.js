var cmdPrefix = "meow!";


var commands = {
	"gif": {
		usage: "<image tags>",
        description: "returns a random gif matching the tags passed",
		process: function(bot, msg, suffix) {
		    var tags = suffix.split(" ");
		    get_gif(tags, function(id) {
			if (typeof id !== "undefined") {
			    bot.sendMessage(msg.channel, "http://media.giphy.com/media/" + id + "/giphy.gif [Tags: " + (tags ? tags : "Random GIF") + "]");
			}
			else {
			    bot.sendMessage(msg.channel, "Invalid tags, try something different. [Tags: " + (tags ? tags : "Random GIF") + "]");
			}
		    });
		}
	},
    "ping": {
        description: "responds pong, useful for checking if bot is alive",
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, msg.sender+" pong!");
            if(suffix){
                bot.sendMessage(msg.channel, "note that !ping takes no arguments!");
            }
        }
    },
    "servers": {
        description: "lists servers bot is connected to",
        process: function(bot,msg){bot.sendMessage(msg.channel,bot.servers);}
    },
    "channels": {
        description: "lists channels bot is connected to",
        process: function(bot,msg) { bot.sendMessage(msg.channel,bot.channels);}
    },
    "myid": {
        description: "returns the user id of the sender",
        process: function(bot,msg){bot.sendMessage(msg.channel,msg.author.id);}
    },
    "idle": {
        description: "sets bot status to idle",
        process: function(bot,msg){ bot.setStatusIdle();}
    },
    "online": {
        description: "sets bot status to online",
        process: function(bot,msg){ bot.setStatusOnline();}
    },
    "youtube": {
        usage: "<video tags>",
        description: "gets youtube video matching tags",
        process: function(bot,msg,suffix){
            youtube_plugin.respond(suffix,msg.channel,bot);
        }
    },
    "say": {
        usage: "<message>",
        description: "bot says message",
        process: function(bot,msg,suffix){ bot.sendMessage(msg.channel,suffix);}
    },
	"announce": {
        usage: "<message>",
        description: "bot says message with text to speech",
        process: function(bot,msg,suffix){ bot.sendMessage(msg.channel,suffix,{tts:true});}
    },
    "pullanddeploy": {
        description: "bot will perform a git pull master and restart with the new code",
        process: function(bot,msg,suffix) {
            bot.sendMessage(msg.channel,"fetching updates...",function(error,sentMsg){
                console.log("updating...");
	            var spawn = require('child_process').spawn;
                var log = function(err,stdout,stderr){
                    if(stdout){console.log(stdout);}
                    if(stderr){console.log(stderr);}
                };
                var fetch = spawn('git', ['fetch']);
                fetch.stdout.on('data',function(data){
                    console.log(data.toString());
                });
                fetch.on("close",function(code){
                    var reset = spawn('git', ['reset','--hard','origin/master']);
                    reset.stdout.on('data',function(data){
                        console.log(data.toString());
                    });
                    reset.on("close",function(code){
                        var npm = spawn('npm', ['install']);
                        npm.stdout.on('data',function(data){
                            console.log(data.toString());
                        });
                        npm.on("close",function(code){
                            console.log("goodbye");
                            bot.sendMessage(msg.channel,"brb!",function(){
                                bot.logout(function(){
                                    process.exit();
                                });
                            });
                        });
                    });
                });
            });
        }
    },
    "meme": {
        usage: 'meme "top text" "bottom text"',
        process: function(bot,msg,suffix) {


            var tags = msg.content.split('"');
            var memetype = tags[0].split(" ")[1];
            //bot.sendMessage(msg.channel,tags);
            var Imgflipper = require("imgflipper");
            var imgflipper = new Imgflipper(AuthDetails.imgflip_username, AuthDetails.imgflip_password);
            imgflipper.generateMeme(meme[memetype], tags[1]?tags[1]:"", tags[3]?tags[3]:"", function(err, image){
                //console.log(arguments);
                bot.sendMessage(msg.channel,image);
            });
        }
    },
    "memehelp": { //TODO: this should be handled by !help
        description: "returns available memes for !meme",
        process: function(bot,msg) {
            var str = "Currently available memes:\n"
            for (var m in meme){
                str += m + "\n"
            }
            bot.sendMessage(msg.channel,str);
        }
    },
    "version": {
        description: "returns the git commit this bot is running",
        process: function(bot,msg,suffix) {
            var commit = require('child_process').spawn('git', ['log','-n','1']);
            commit.stdout.on('data', function(data) {
                bot.sendMessage(msg.channel,data);
            });
            commit.on('close',function(code) {
                if( code != 0){
                    bot.sendMessage(msg.channel,"failed checking git version!");
                }
            });
        }
    },
    "log": {
        usage: "<log message>",
        description: "logs message to bot console",
        process: function(bot,msg,suffix){console.log(msg.content);}
    },
    "wiki": {
        usage: "<search terms>",
        description: "returns the summary of the first matching search result from Wikipedia",
        process: function(bot,msg,suffix) {
            var query = suffix;
            if(!query) {
                bot.sendMessage(msg.channel,"usage: !wiki search terms");
                return;
            }
            var Wiki = require('wikijs');
            new Wiki().search(query,1).then(function(data) {
                new Wiki().page(data.results[0]).then(function(page) {
                    page.summary().then(function(summary) {
                        var sumText = summary.toString().split('\n');
                        var continuation = function() {
                            var paragraph = sumText.shift();
                            if(paragraph){
                                bot.sendMessage(msg.channel,paragraph,continuation);
                            }
                        };
                        continuation();
                    });
                });
            },function(err){
                bot.sendMessage(msg.channel,err);
            });
        }
    },
    "join-server": {
        usage: "<invite>",
        description: "joins the server it's invited to",
        process: function(bot,msg,suffix) {
            console.log(bot.joinServer(suffix,function(error,server) {
                console.log("callback: " + arguments);
                if(error){
                    bot.sendMessage(msg.channel,"failed to join: " + error);
                } else {
                    console.log("Joined server " + server);
                    bot.sendMessage(msg.channel,"Successfully joined " + server);
                }
            }));
        }
    },
    "create": {
        usage: "<channel name>",
        description: "creates a new text channel with the given name.",
        process: function(bot,msg,suffix) {
            bot.createChannel(msg.channel.server,suffix,"text").then(function(channel) {
                bot.sendMessage(msg.channel,"created " + channel);
            }).catch(function(error){
				bot.sendMessage(msg.channel,"failed to create channel: " + error);
			});
        }
    },
	"voice": {
		usage: "<channel name>",
		description: "creates a new voice channel with the give name.",
		process: function(bot,msg,suffix) {
            bot.createChannel(msg.channel.server,suffix,"voice").then(function(channel) {
                bot.sendMessage(msg.channel,"created " + channel.id);
				console.log("created " + channel);
            }).catch(function(error){
				bot.sendMessage(msg.channel,"failed to create channel: " + error);
			});
        }
	},
    "delete": {
        usage: "<channel name>",
        description: "deletes the specified channel",
        process: function(bot,msg,suffix) {
			var channel = bot.channels.get("id",suffix);
			if(suffix.startsWith('<#')){
				channel = bot.channels.get("id",suffix.substr(2,suffix.length-3));
			}
            if(!channel){
				var channels = bot.channels.getAll("name",suffix);
				if(channels.length > 1){https://github.com/chalda/DiscordBot/issues/new
					var response = "Multiple channels match, please use id:";
					for(var i=0;i<channels.length;i++){
						response += channels[i] + ": " + channels[i].id;
					}
					bot.sendMessage(msg.channel,response);
					return;
				}else if(channels.length == 1){
					channel = channels[0];
				} else {
					bot.sendMessage(msg.channel, "Couldn't find channel " + suffix + " to delete!");
					return;
				}
			}
            bot.sendMessage(msg.channel.server.defaultChannel, "deleting channel " + suffix + " at " +msg.author + "'s request");
            if(msg.channel.server.defaultChannel != msg.channel){
                bot.sendMessage(msg.channel,"deleting " + channel);
            }
            bot.deleteChannel(channel).then(function(channel){
				console.log("deleted " + suffix + " at " + msg.author + "'s request");
            }).catch(function(error){
				bot.sendMessage(msg.channel,"couldn't delete channel: " + error);
			});
        }
    },
    "stock": {
        usage: "<stock to fetch>",
        process: function(bot,msg,suffix) {
            var yahooFinance = require('yahoo-finance');
            yahooFinance.snapshot({
              symbol: suffix,
              fields: ['s', 'n', 'd1', 'l1', 'y', 'r'],
            }, function (error, snapshot) {
                if(error){
                    bot.sendMessage(msg.channel,"couldn't get stock: " + error);
                } else {
                    //bot.sendMessage(msg.channel,JSON.stringify(snapshot));
                    bot.sendMessage(msg.channel,snapshot.name
                        + "\nprice: $" + snapshot.lastTradePriceOnly);
                }  
            });
        }
    },
	"wolfram": {
		usage: "<search terms>",
        description: "gives results from wolframalpha using search terms",
        process: function(bot,msg,suffix){
				if(!suffix){
					bot.sendMessage(msg.channel,"Usage: !wolfram <search terms> (Ex. !wolfram integrate 4x)");
				}
	            wolfram_plugin.respond(suffix,msg.channel,bot);
       	    }
	},
    "rss": {
        description: "lists available rss feeds",
        process: function(bot,msg,suffix) {
            /*var args = suffix.split(" ");
            var count = args.shift();
            var url = args.join(" ");
            rssfeed(bot,msg,url,count,full);*/
            bot.sendMessage(msg.channel,"Available feeds:", function(){
                for(var c in rssFeeds){
                    bot.sendMessage(msg.channel,c + ": " + rssFeeds[c].url);
                }
            });
        }
    },
    "reddit": {
        usage: "[subreddit]",
        description: "Returns the top post on reddit. Can optionally pass a subreddit to get the top psot there instead",
        process: function(bot,msg,suffix) {
            var path = "/.rss"
            if(suffix){
                path = "/r/"+suffix+path;
            }
            rssfeed(bot,msg,"https://www.reddit.com"+path,1,false);
        }
    },
	"alias": {
		usage: "<name> <actual command>",
		description: "Creates command aliases. Useful for making simple commands on the fly",
		process: function(bot,msg,suffix) {
			var args = suffix.split(" ");
			var name = args.shift();
			if(!name){
				bot.sendMessage(msg.channel,"!alias " + this.usage + "\n" + this.description);
			} else if(commands[name] || name === "help"){
				bot.sendMessage(msg.channel,"overwriting commands with aliases is not allowed!");
			} else {
				var command = args.shift();
				aliases[name] = [command, args.join(" ")];
				//now save the new alias
				require("fs").writeFile("./alias.json",JSON.stringify(aliases,null,2), null);
				bot.sendMessage(msg.channel,"created alias " + name);
			}
		}
	},
	"userid": {
		usage: "[user to get id of]",
		description: "Returns the unique id of a user. This is useful for permissions.",
		process: function(bot,msg,suffix) {
			if(suffix){
				var users = msg.channel.server.members.getAll("username",suffix);
				if(users.length == 1){
					bot.sendMessage(msg.channel, "The id of " + users[0] + " is " + users[0].id)
				} else if(users.length > 1){
					var response = "multiple users found:";
					for(var i=0;i<users.length;i++){
						var user = users[i];
						response += "\nThe id of " + user + " is " + user.id;
					}
					bot.sendMessage(msg.channel,response);
				} else {
					bot.sendMessage(msg.channel,"No user " + suffix + " found!");
				}
			} else {
				bot.sendMessage(msg.channel, "The id of " + msg.author + " is " + msg.author.id);
			}
		}
	},
	"eval": {
		usage: "<command>",
		description: 'Executes arbitrary javascript in the bot process. User must have "eval" permission',
		process: function(bot,msg,suffix) {
			if(Permissions.checkPermission(msg.author,"eval")){
				bot.sendMessage(msg.channel, eval(suffix,bot));
			} else {
				bot.sendMessage(msg.channel, msg.author + " doesn't have permission to execute eval!");
			}
		}
	},
	"topic": {
		usage: "[topic]",
		description: 'Sets the topic for the channel. No topic removes the topic.',
		process: function(bot,msg,suffix) {
			bot.setChannelTopic(msg.channel,suffix);
		}
	},
	"roll": {
        usage: "[# of sides] or [# of dice]d[# of sides]( + [# of dice]d[# of sides] + ...)",
        description: "roll one die with x sides, or multiple dice using d20 syntax. Default value is 10",
        process: function(bot,msg,suffix) {
            if (suffix.split("d").length <= 1) {
                bot.sendMessage(msg.channel,msg.author + " rolled a " + d20.roll(suffix || "10"));
            }  
            else if (suffix.split("d").length > 1) {
                var eachDie = suffix.split("+");
                var passing = 0;
                for (var i = 0; i < eachDie.length; i++){
                    if (eachDie[i].split("d")[0] < 50) {
                        passing += 1;
                    };
                }
                if (passing == eachDie.length) {
                    bot.sendMessage(msg.channel,msg.author + " rolled a " + d20.roll(suffix));
                }  else {
                    bot.sendMessage(msg.channel,msg.author + " tried to roll too many dice at once!");
                }
            }
        }
    },
	"msg": {
		usage: "<user> <message to leave user>",
		description: "leaves a message for a user the next time they come online",
		process: function(bot,msg,suffix) {
			var args = suffix.split(' ');
			var user = args.shift();
			var message = args.join(' ');
			if(user.startsWith('<@')){
				user = user.substr(2,user.length-3);
			}
			var target = msg.channel.server.members.get("id",user);
			if(!target){
				target = msg.channel.server.members.get("username",user);
			}
			messagebox[target.id] = {
				channel: msg.channel.id,
				content: target + ", " + msg.author + " said: " + message
			};
			updateMessagebox();
			bot.sendMessage(msg.channel,"message saved.")
		}
	},
	"twitch": {
		usage: "<stream>",
		description: "checks if the given stream is online",
		process: function(bot,msg,suffix){
			require("request")("https://api.twitch.tv/kraken/streams/"+suffix,
			function(err,res,body){
				var stream = JSON.parse(body);
				if(stream.stream){
					bot.sendMessage(msg.channel, suffix
						+" is online, playing "
						+stream.stream.game
						+"\n"+stream.stream.channel.status
						+"\n"+stream.stream.preview.large)
				}else{
					bot.sendMessage(msg.channel, suffix+" is offline")
				}
			});
		}
	},
	"xkcd": {
		usage: "[comic number]",
		description: "displays a given xkcd comic number (or the latest if nothing specified",
		process: function(bot,msg,suffix){
			var url = "http://xkcd.com/";
			if(suffix != "") url += suffix+"/";
			url += "info.0.json";
			require("request")(url,function(err,res,body){
				try{
					var comic = JSON.parse(body);
					bot.sendMessage(msg.channel,
						comic.title+"\n"+comic.img,function(){
							bot.sendMessage(msg.channel,comic.alt)
					});
				}catch(e){
					bot.sendMessage(msg.channel,
						"Couldn't fetch an XKCD for "+suffix);
				}
			});
		}
	},
    "watchtogether": {
        usage: "[video url (Youtube, Vimeo)",
        description: "Generate a watch2gether room with your video to watch with your little friends!",
        process: function(bot,msg,suffix){
            var watch2getherUrl = "https://www.watch2gether.com/go#";
            bot.sendMessage(msg.channel,
                "watch2gether link",function(){
                    bot.sendMessage(msg.channel,watch2getherUrl + suffix)
                })
        }
    },
    "uptime": {
    	usage: "",
	description: "returns the amount of time since the bot started",
	process: function(bot,msg,suffix){
		var now = Date.now();
		var msec = now - startTime;
		console.log("Uptime is " + msec + " milliseconds");
		var days = Math.floor(msec / 1000 / 60 / 60 / 24);
		msec -= days * 1000 * 60 * 60 * 24;
		var hours = Math.floor(msec / 1000 / 60 / 60);
		msec -= hours * 1000 * 60 * 60;
		var mins = Math.floor(msec / 1000 / 60);
		msec -= mins * 1000 * 60;
		var secs = Math.floor(msec / 1000);
		var timestr = "";
		if(days > 0) {
			timestr += days + " days ";
		}
		if(hours > 0) {
			timestr += hours + " hours ";
		}
		if(mins > 0) {
			timestr += mins + " minutes ";
		}
		if(secs > 0) {
			timestr += secs + " seconds ";
		}
		bot.sendMessage(msg.channel,"Uptime: " + timestr);
	}
    }
};



//////////////////
//Exports
//////////////////

exports.cmdPrefix = cmdPrefix;
exports.commands = commands;
