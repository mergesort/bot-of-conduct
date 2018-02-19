# A Slack app for delivering your code of conduct

This is a small app meant to help your Slack team send it's code of conduct to any new members of your organization, and have them accept it.

Once the user clicks accept, it will post into a channel (ours is private) so you can have a record of any member who has signed the code of conduct for accountability purposes.

To build a Slack app, you need 3 things:

1. **A Slack workspace**. If you don't have one of these already, go ahead and [create one](https://slack.com/create) -- they're free! However, even if you're already happily using Slack, you might consider starting up a test workspace for developing your app, so you have free reign over your workspace and don’t annoy your coworkers with your testing.
2. **An app configuration**. This is something you set up at [http://api.slack.com/apps](http://api.slack.com/apps) when you create your app.
3. **A web server** that’s accessible to the public internet. This can be hosted just about anywhere, whether it’s a cloud service like AWS or Google Compute Cloud, or just a regular old web host. The application that powers your web app can be written in any programming language — Python, Ruby, Node.js, Java, Go, PHP — it’s up to you. This app is written in Node.js using the Express web framework, hosted on Glitch.

Presumably, you've remixed this app and given it a unique name, something like `my-slack-bot`. A bit later on, you'll need to enter the full URL to your app, it will be `https://code-of-conduct-bot.glitch.me`. You can copy this URL by clicking the name in the top left corner of Glitch then clicking the `COPY` button.

![Glitch URL](https://cdn.glitch.com/579d010e-07de-495a-a7e2-bf9194243ff6%2Fglitch-url.png?1518538205095)

## Create your app

To get started, head over to [https://api.slack.com/apps](https://api.slack.com/apps) -- this is where you create and configure your apps. Click the green **Create an App** button. Give your app a name -- Welcome Bot should do -- and assign it to your workspace.

This is where you configure all of the parts of your app. On the left are all of the features available to your app -- these are all optional, it's up to you how feature filled your app should be.

## Configuration

Before setting up any of the features, there's a bit of configuration to handle. The first is a shared secret between Slack and your app to help maintain security. Slack sends a verification token with every request to your app, so you should store that token value in your app's environment variables in the `.env` file. Copy the value from the App Credentials section to your own `.env` file, it will look like this: `SLACK_VERIFICATION_TOKEN=AbC123DeF456gHi789JkL012mNo`.

![Verification token](https://cdn.glitch.com/579d010e-07de-495a-a7e2-bf9194243ff6%2Fverification.png?1518537096848)

## Listen for events

The first feature you're going to add to your app is the ability to subscribe to events. Events are basically anything that happens in your Slack workspace, such as posting a message or adding a reaction emoji. Your app can listen for these events, and only the events you care about, and then respond when something happens. This app is going to listen for team members joining a channel. 

Select **Event Subscriptions** from the left nav of your app's configuration page, and then turn those on. Slack needs to know where to send these events and expects a fully valid URL and path that is capable of processing an `HTTP POST` request. The full URL is going to point to your Glitch app, plus `/slack/events`, so something like `https://code-of-conduct-bot.glitch.me/slack/events`. Go ahead and enter that URL in the field that says **Request URL**.

Slack will immediately send this URL a challenge parameter to make sure it is prepared to receive events. Because Slack could potentially send a lot of events to the URL you enter here, this is a precaution to make sure _ne'er-do-wells_ don't try to use Slack to DDOS an unsuspecting web host. Handling this verification challenge is merely a matter of responding back to Slack with the string we send.

Now, add the event you want to subscribe to. In the **Subscribe to Events** section, click the **Add Workspace Event** button. The event we're interested in is the `team_join` event -- you can just start typing `team` and the dropdown should autocomplete the full name of the event. Here's a [full list of Slack events](https://api.slack.com/events) you can subscribe to.

![Events](https://cdn.glitch.com/579d010e-07de-495a-a7e2-bf9194243ff6%2Fevents.png?1518537920397)

## Install

Even though the app is far from complete, now's a good time to install the app on your workspace. Select **Install app** from the left nav, then click the green **Install App** button. This will show a screen outlining what your app can do once it's installed on your workspace, go ahead and approve that and you'll be redirected back to your app's configuration.

Here you'll see an OAuth Access Token -- this token is required any time you access the Slack API. It's important to keep this token secure, which for our app means an environment variable stored in the `.env` file. Copy the token and then assign it to a variable, like so `SLACK_OAUTH_TOKEN=xoxp-12345678901-98765432109-12345678901-12ab34cd56ef78gh90ij12kl34mn`

![OAuth](https://cdn.glitch.com/579d010e-07de-495a-a7e2-bf9194243ff6%2Foauth.png?1518577645452)

## Responding to events

The code that handles events starts at [line 45](https://glitch.com/edit/#!/code-of-conduct-bot?path=src/index.js:45:0) by defining a URL route. At [line 48](https://glitch.com/edit/#!/code-of-conduct-bot?path=src/index.js:48:0) is where the app handles that initial verification challenge.

At [line 57](https://glitch.com/edit/#!/code-of-conduct-bot?path=src/index.js:57:0) you can see where the app verifies that the request is coming from Slack. This is a good security practice for all of your app's endpoints.

The remainder of this function is sending a message to the user who joins the channel via the [`chat.postMessage`](https://api.slack.com/methods/chat.postMessage) method. This method requires a `channel`, a `user`, a string of `text`, and can optionally include an `attachment` object. The attachment object includes the buttons that will show the form.

One last bit of configuration: in order to be able to send the message, your app needs a new scope: the `chat:write:bot` scope. This gives your app permission to write into a Slack workspace.

Select **OAuth & Permissions** from the left nav, scroll down to the **Select Permission Scopes** and then add the `chat:write:bot` scope (the dropdown will filter the choices once you start typing in a name). Then click the green **Save Changes** button.

Any time you add scopes to an app, you're changing the nature of the app and the permissions it requests of the Workspace where it's installed. So, we require you to re-install the app before you can use it with the new scopes. You should see a banner at the top of your screen with a link to reinstall, or you can select **Install App** from the left nav and reinstall from there. 

## Handle the button and dialog submissions

Handling how the message buttons work is pretty similar to handling the Events -- you specify a URL to receive an `HTTP POST` request from Slack and then process that request.

Message buttons are considered an _interactive component_ so select **Interactive Components** from the left nav. The URL route for handling these is `/slack/components`, with the full URL being something like `https://code-of-conduct-bot.glitch.me/slack/components`. Click the green **Save changes** button. 

![Interactive Components](https://cdn.glitch.com/579d010e-07de-495a-a7e2-bf9194243ff6%2Finteractive-components.png?1518575307718)

The code for handling the request from Slack begins on [line 82](https://glitch.com/edit/#!/code-of-conduct-bot?path=src/index.js:82:0) by defining the route. It parses the JSON sent from the server and validates the verification token. Then there's a switch statement -- this is because this one function will handle multiple kinds of interactive components.

## Congratulations!

That's setting up our app from start to finish.
