var Request = require('request');
var _ = require('lodash');
var slack = require('../controllers/botkit')
var vsts = require('../factories/vsts');

// frontend routes =========================================================
module.exports = function(app) {

  //public pages=============================================
  //index
  app.get('/', function(req, res) {
    console.log("index");

    res.render('index'); // load view/root.html file
  });
  
  app.get('/admin/:id', function(req, res) {
    var teamId = req.params.id;
    slack.controller.storage.teams.get(teamId, function(err, team) {
        vsts.getAreaPaths(function (areaPaths) {
          vsts.getRepos(function (repos) {
            res.render("admin", { team: team, areaPaths: areaPaths, repos: repos });
          });
        });
    });
  });

  //new user creation - redirection from Slack
  app.get('/new', function(req, res) {
    console.log("================== START TEAM REGISTRATION ==================")
    //temporary authorization code
    var auth_code = req.query.code;

    if(!auth_code){
      //user refused auth
      res.redirect('/');
    }
    else{
      console.log("New user auth code " + auth_code);
      perform_auth(auth_code, res);
    }
  });

  app.post('/subscribe', function(req, res) {
    var channel = req.body.channel;
    var area_path = req.body.area_path;
    var team_id = req.body.team_id;

    var event = {
      type: 'workitem.created',
      inputs: {
        'areaPath': area_path,
        'workItemType': '',
        'projectId': '7b8849b0-6d6a-422b-833f-8f962400b781'
      }
    }

    // create vsts subscription
    var subscription = vsts.create_subscription({ team_id: team_id, area_path: area_path }, function (subscription_id) {
      // save subscription info
      slack.controller.storage.teams.get(team_id, function(err, team) {
        var team_subscription = { id: subscription_id, channel: channel, areaPath: area_path.slice(1) };

        if (!_.isArray(team.subscriptions)) {
          team.subscriptions = [];
        }

        team.subscriptions.push(team_subscription);

        slack.controller.saveTeam(team);
        res.end();
      });
    }, event);
  });

  app.post('/subscribe_pull', function(req, res) {
    var channel = req.body.channel;
    var repo = req.body.repo;
    var team_id = req.body.team_id;

    var event = {
      type: 'git.pullrequest.created',
      inputs: {
        'repository': repo,
        'projectId': '7b8849b0-6d6a-422b-833f-8f962400b781'
      }
    }

    // create vsts subscription
    var subscription = vsts.create_subscription({ team_id: team_id }, function (subscription_id) {
      // save subscription info
      slack.controller.storage.teams.get(team_id, function(err, team) {
        var team_subscription = { id: subscription_id, channel: channel, repositoryId: repo };

        if (!_.isArray(team.subscriptions)) {
          team.subscriptions = [];
        }

        team.subscriptions.push(team_subscription);

        slack.controller.saveTeam(team);
        res.end();
      });
    }, event);
  });

  //CREATION ===================================================

  var perform_auth = function(auth_code, res) {
    //post code, app ID, and app secret, to get token
    var auth_adresse = 'https://slack.com/api/oauth.access?';
    auth_adresse += 'client_id=' + process.env.SLACK_ID;
    auth_adresse += '&client_secret=' + process.env.SLACK_SECRET;
    auth_adresse += '&code=' + auth_code;
    auth_adresse += '&redirect_uri=' + process.env.SLACK_REDIRECT + "new";

    Request.get(auth_adresse, function (error, response, body) {
      if (error){
        console.log(error)
        res.sendStatus(500)
      }
      else {
        var auth = JSON.parse(body);
        console.log("New user auth");
        console.log(auth);

        register_team(auth,res);
      }
    });
  }

  var register_team = function(auth, res) {
    //first, get authenticating user ID
    var url = 'https://slack.com/api/auth.test?';
    url += 'token=' + auth.access_token;

    Request.get(url, function (error, response, body) {
      if (error) {
        console.log(error);
        res.sendStatus(500);
      }
      else {
        try {
          var identity = JSON.parse(body);
          console.log(identity);

          var team = {
            id: identity.team_id,
            bot:{
              token: auth.bot.bot_access_token,
              user_id: auth.bot.bot_user_id,
              createdBy: identity.user_id
            },
            createdBy: identity.user_id,
            url: identity.url,
            name: identity.team,
            incoming_webhook: auth.incoming_webhook
          };
          
          startBot(team);

          slack.controller.storage.teams.get(team.id, function(err, team) {
              vsts.getAreaPaths(function (areaPaths) {
                vsts.getRepos(function (repos) {
                  res.render("new", { team: team, areaPaths: areaPaths, repos: repos });
                });
              });
          });

          saveUser(auth, identity);
        }
        catch(e) {
          console.log(e);
        }
      }
    });
  }

  var startBot = function(team) {
    console.log(team.name + " start bot")

    slack.connect(team)
  }

  var saveUser = function(auth, identity) {
    // what scopes did we get approved for?
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
