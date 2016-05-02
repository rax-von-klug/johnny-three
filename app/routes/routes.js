var requestify      = require('requestify');
var slack           = require('../controllers/botkit');
var util            = require('util');

module.exports = function(app) {

    app.get('/', function(req, res) {
        console.log("root");

        res.render('root'); // load view/root.html file
    });

    app.get('/new', function(req, res) {
        console.log("================== START TEAM REGISTRATION ==================")
        
        let auth_code = req.query.code;

        if (!auth_code) {
            res.redirect('/');
        }
        else {
            console.log("New user auth code " + auth_code);
            perform_auth(auth_code, res);
        }
    });

    var perform_auth = function(auth_code, res) {
        let base_url = 'https://slack.com/api/oauth.access?client_id=%s&client_secret=%s&code=%s&redirect_uri=%snew';
        var auth_adresse = util.format(base_url, process.env.SLACK_ID, process.env.SLACK_SECRET, auth_code, process.env.SLACK_REDIRECT);

        requestify.get(auth_adresse).then((res) => {
            let auth = JSON.parse(body);
            console.log("New user auth");
            console.log(auth);

            register_team(auth, res);
        });
    }

    var register_team = function(auth, res) {
        var url = util.format('https://slack.com/api/auth.test?token=%s', auth.access_token);

        requestify.get(url).then((res) => {
        
            try {
                var identity = JSON.parse(body)
                console.log(identity)

                var team = {
                    id: identity.team_id,
                    bot:{
                        token: auth.bot.bot_access_token,
                        user_id: auth.bot.bot_user_id,
                        createdBy: identity.user_id
                    },
                    createdBy: identity.user_id,
                    url: identity.url,
                    name: identity.team
                }
                
                startBot(team);
                res.send("Your bot has been installed")

                saveUser(auth, identity)
            }
            catch (e) {
                console.log(e);
            }
        });
    }

    var startBot = function(team) {
        console.log(team.name + " start bot");

        slack.connect(team);
    }

    var saveUser = function(auth, identity) {
        var scopes = auth.scope.split(/\,/);

        slack.controller.storage.users.get(identity.user_id, function(err, user) {
            isnew = false;
            
            if (!user) {
                isnew = true;
                user = {
                    id: identity.user_id,
                    access_token: auth.access_token,
                    scopes: scopes,
                    team_id: identity.team_id,
                    user: identity.user,
                };
            }
            
            slack.controller.storage.users.save(user, function(err, id) {
                if (err) {
                    console.log('An error occurred while saving a user: ', err);
                    slack.controller.trigger('error', [err]);
                }
                else {
                    if (isnew) {
                        console.log("New user " + id.toString() + " saved");
                    }
                    else {
                        console.log("User " + id.toString() + " updated");
                    }
                    console.log("================== END TEAM REGISTRATION ==================")
                }
            });
        });
    }
}
