//CONFIG===============================================

/* Uses the slack button feature to offer a real time bot to multiple teams */
var Botkit = require('botkit');
var request = require('request');
var mongoUri = process.env.MONGOLAB_URI || 'mongodb://localhost/botkit_express_demo'
var botkit_mongo_storage = require('../../config/botkit-storage-mongoose')({mongoUri: mongoUri})

if (!process.env.SLACK_ID || !process.env.SLACK_SECRET || !process.env.PORT) {
    console.log('Error: Specify SLACK_ID SLACK_SECRET and PORT in environment');
    process.exit(1);
}

var controller = Botkit.slackbot({
    storage: botkit_mongo_storage,
    interactive_replies: true
})

exports.controller = controller

//CONNECTION FUNCTIONS=====================================================
exports.connect = function(team_config) {
    var bot = controller.spawn(team_config);
    controller.trigger('create_bot', [bot, team_config]);
}


// just a simple way to make sure we don't
// connect to the RTM twice for the same team
var _bots = {};

function trackBot(bot) {
    _bots[bot.config.token] = bot;
}

exports.getExistingBot = function(token) {
    return _bots[token];
}

controller.on('create_bot',function(bot,team) {

    if (_bots[bot.config.token]) {
    // already online! do nothing.
        console.log("already online! do nothing.")
    }
    else {
        bot.startRTM(function(err) {

            if (!err) {
                trackBot(bot);

                console.log("RTM ok");

                bot.api.channels.list({
                    token: bot.config.token
                }, function(err, result) {
                    if(!err) {
                        team.channels = []
                        if (result.channels) {
                            for (var i = 0; i < result.channels.length; i++) {
                                team.channels.push({
                                    id: result.channels[i].id,
                                    name: result.channels[i].name,
                                    shared: false
                                })
                            }
                        }
                        controller.saveTeam(team, function(err, id) {
                            if (err) {
                                console.log("Error saving team")
                            }
                            else {
                                console.log("Team " + team.name + " saved")
                            }
                        });
                    }
                });            
            }
            else{
                console.log("RTM failed");
            }

            bot.say({
                text: 'Hi! I\'m Johnny-Three, Human / VSTS relations',
                attachments: [{
                    title: 'To being your journey please make a selection below:',
                    callback_id: '123',
                    attachment_type: 'default',
                    actions: [
                        {
                            "name":"vsts",
                            "text": "Learn about VSTS Integrations",
                            "value": "vsts",
                            "type": "button"
                        },
                        {
                            "name":"echo",
                            "text": "Learn about cross team collaberation",
                            "value": "echo",
                            "type": "button"
                        }
                    ]
                }],
                channel: team.createdBy
            });
        });
    }
});

//REACTIONS TO EVENTS==========================================================
controller.hears([".+","^pattern$"],["ambient"],function(bot,message) {
    var shareId = bot.team_info.id + '.' + message.channel;
                    
    bot.api.users.info({
        user: message.user,
        token: bot.config.token
    }, function(err, result) {
        var usernameForMessage =  result.user.name + ' (from ' + bot.team_info.name + ')';

        controller.storage.shares.get(shareId, function(err, share) {
            if(!err) {
                for (var i=0; i < share.joinedChannels.length; i++) {
                    request({
                        url: share.joinedChannels[i].webhookUrl,
                        method: 'POST',
                        json: {
                            username: usernameForMessage,
                            text: message.text,
                            channel: share.joinedChannels[i].postChannelId
                        }
                    });
                }
            }
        }); 
    });
});

controller.hears('register', 'direct_mention', function(bot, message) {
    var webhookUrl = message.text.substring(8).replace(/\s/g, '');
    var urlStartIndex = webhookUrl.indexOf('<');
    var urlEndIndex = webhookUrl.indexOf('>');

    if(urlStartIndex !== -1 && urlEndIndex !== -1) {
        webhookUrl = webhookUrl.substring(urlStartIndex + 1, urlEndIndex);
    }

    if (webhookUrl !== '') {
        controller.storage.teams.get(bot.team_info.id, function(err, team){
            team.webhooks = {
                incomingUrl: webhookUrl
            };

            controller.storage.teams.save(team, function(err, team){
                bot.reply(message, {
                    "text": "Registered webhook!",
                    "attachments": [{
                        "text": webhookUrl + " was registered for your team"
                    }]
                });
            });
        });
    } else {
        bot.reply(message, {
            "text": "Invalid register command",
            "attachments": [{
                "text": "Please use the following format: `register <webhook URL>`"
            }]
        });
    }
});

// Handle events related to the websocket connection to Slack
controller.on('rtm_open',function(bot) {
    console.log('** The RTM api just connected!');
});

controller.on('rtm_close',function(bot) {
    console.log('** The RTM api just closed');
// you may want to attempt to re-open
});

controller.hears('share', 'direct_mention', function(bot, message) {
    //console.log(message);

    controller.storage.teams.get(message.team, function(err, team_data) {
        if (!err) {
            for(var i = 0; i < team_data.channels.length; i++) {
                if (team_data.channels[i].id === message.channel) {
                    team_data.channels[i].shared = true;

                    controller.storage.shares.save({
                        id: team_data.id + '.' + message.channel,
                        teamId: team_data.id,
                        teamName: team_data.name,
                        channelId: message.channel,
                        channelName: team_data.channels[i].name,
                        joinedChannels: []
                    }, function() {
                        controller.saveTeam(team_data, function(err, id) {
                            bot.reply(message, {
                                text: 'Your channel has been marked as shared.'
                            });
                        });
                    });
                }
            }
        }
    });
});

controller.hears('available', 'direct_mention', function(bot, message) {
    var available_channels = [];

    controller.storage.teams.all(function(err, teams) {
        if (err) {
            console.log(err);
        }

        for (var t in teams) {
            var team = teams[t];

            for(var i = 0; i < team.channels.length; i++) {
                if (team.channels[i].shared === true && team.channels[i].id !== message.team) {
                    var channel = team.channels[i];

                    bot.reply(message, {
                        text: "*" + channel.name + "* in *" + team.name + "* has been shared.",
                        attachments: [
                            {
                                text: "Would you like to join in the conversation?",
                                fallback: "You are unable to choose a game",
                                callback_id: "join_shared_channel_" + channel.id,
                                color: "#3AA3E3",
                                attachment_type: "default",
                                actions: [
                                    {
                                        name: "join_channel",
                                        text: "Join",
                                        type: "button",
                                        style: "primary",
                                        value: team.id + "." + channel.id
                                    }
                                ]
                            }
                        ]
                    });
                }
            }
        }
    });
});

controller.on('interactive_message_callback', function(bot, message) {
    console.log(message);
});

//DIALOG ======================================================================

controller.storage.teams.all(function(err,teams) {

    console.log(teams)

    if (err) {
        throw new Error(err);
    }

// connect all teams with bots up to slack!
    for (var t  in teams) {
        if (teams[t].bot) {
            var bot = controller.spawn(teams[t]).startRTM(function(err, bot) {
                if (err) {
                    console.log('Error connecting bot to Slack:',err);
                } else {
                    trackBot(bot);
                }
            });
        }
    }

});
