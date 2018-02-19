"use strict";

require('dotenv').config();

/*
 * Configuration
 */ 

// NPM packages to get everything working
const axios = require('axios');
const bodyParser = require('body-parser');
const express = require('express');
const qs = require('querystring');

// grab the environment variables
const SLACK_VERIFICATION_TOKEN = process.env.SLACK_VERIFICATION_TOKEN;
const SLACK_OAUTH_TOKEN = process.env.SLACK_OAUTH_TOKEN;
const SLACK_POST_TO_CHANNEL = process.env.SLACK_POST_TO_CHANNEL;
const SLACK_CODE_OF_CONDUCT_MESSAGE = process.env.SLACK_CODE_OF_CONDUCT_MESSAGE;

// set up the Express app
const app = express();

app.set('port', process.env.PORT || 3000);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// set up Axios
axios.defaults.baseURL = 'https://slack.com';
axios.defaults.headers.common['Authorization'] = `Bearer ${SLACK_OAUTH_TOKEN}`;
axios.defaults.headers.post['Content-Type'] = 'application/json';

/*
 * Default endpoint
 */
app.get('/', (req, res) => {
  res.send('<h2>Welcome to your Bot of Conduct!</h2> <p>Follow the' +
  ' instructions in the README to configure the Slack App and your environment variables.</p>');
});

/*
 * Endpoint to receive events to which your app is subscribed
 * https://api.slack.com/events-api
 */
app.post('/slack/events', (req, res) => {
    switch (req.body.type) {

      case 'url_verification': {
        // When setting up your app, Slack sends a verification challenge to the URL you specify
        // and expects you to echo it back immediately.
        // https://api.slack.com/events-api#request_url_configuration__amp__verification
        res.send({ challenge: req.body.challenge });
        break;
      }

      case 'event_callback': {
        if (req.body.token === SLACK_VERIFICATION_TOKEN) {
          const event = req.body.event;
          
          if(event.type === 'team_join') {
          // if(event.type === 'member_joined_channel') {
            res.status(200).end();
            
            setTimeout(send_code_of_conduct_message(event), 120000)
          }
        } else { 
          res.sendStatus(500); 
        }
        
        break;
      }
    default: {
      res.sendStatus(500); 
    }
  }
});

/*
 * Endpoint to accept the code of conduct.
 * https://api.slack.com/interactive-messages
 */
app.post('/slack/code_of_conduct', (req, res) => {
  // the payload will vary depending on the type of component -- message button or dialog -- is being sent
  // console log it out to get a feel for it
  const payload = JSON.parse(req.body.payload);
  
  //verify the request is coming from Slack by validating the token
  if (payload.token === SLACK_VERIFICATION_TOKEN) {
    //respond immediately 
    res.status(200).end();

    switch (payload.type) {
      case 'interactive_message': {
        // More info on what interactive message submissions looke like here:
        // https://api.slack.com/docs/interactive-message-field-guide#action_payload
        const action = payload.actions[0];

        if(action['value'] === 'accept_code_of_conduct') {
          axios.post('/api/chat.postMessage', {
            channel: SLACK_POST_TO_CHANNEL,
            attachments: [
              {
                fallback: "<@" + payload.user.name + ">" + " signed the code of conduct",
                color: "#27AE60",
                pretext: "",
                title: "",
                text: "<@" + payload.user.name + ">" + " signed the code of conduct",
                fields: []
              }
            ]
          })
          .then(function(res) {
            axios.post(payload.response_url, {
              // replace_original: true,
              delete_original: true,
              text: SLACK_CODE_OF_CONDUCT_MESSAGE
            })
          })
          .then(function(res) {
            setTimeout(function() {
              axios.post('/api/chat.postMessage', {
                channel: payload.user.id,
                user: payload.user.id,
                text: "Thanks for accepting the code of conduct!",
                attachments: []
              })
            }, 1000);
          })
          .catch(function (error) {
            console.log(error);
          });
        }
      }
    }
  } else { 
    res.sendStatus(500); 
  }
});

/*
 * Start the express server
 */
app.listen(app.get('port'), () => {
  console.log(`App listening on port ${app.get('port')}!`);
});

function send_code_of_conduct_message(event) {
  return function() {
    axios.post('/api/chat.postMessage', {
      channel: event.user,
      text: SLACK_CODE_OF_CONDUCT_MESSAGE,
      attachments: [
        {
          text: '',
          callback_id: 'code_of_conduct_accepted',
          color: '#27AE60',
          attachment_type: 'default',
          actions: [
            {
              name: 'chooser',
              text: 'Accept',
              type: 'button',
              value: 'accept_code_of_conduct'
            }
          ]
        }
      ]
    })
    .catch(function (error) {
      console.log(error);
    });
  }
}
