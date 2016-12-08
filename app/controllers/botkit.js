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
                                    name: result.channels[i].name
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

            bot.startPrivateConversation({user: team.createdBy}, function(err, convo) {
                //console.log(JSON.stringify(convo));
                if (err) {
                    console.log(err);
                } else {
                    convo.say('Hi! I\'m Johnny-Three, Human / VSTS relations');
                    convo.say('To start receiving your VSTS notifications please visit http://johnny-three.herokuapp.com/admin/' + team.id);
                    convo.say('To being sharing your messages with other teams please ')
                }
            });

        });
    }
});

//REACTIONS TO EVENTS==========================================================

// Handle events related to the websocket connection to Slack
controller.on('rtm_open',function(bot) {
    console.log('** The RTM api just connected!');
});

controller.on('rtm_close',function(bot) {
    console.log('** The RTM api just closed');
// you may want to attempt to re-open
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
