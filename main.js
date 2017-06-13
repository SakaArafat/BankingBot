/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const watson = require("watson-developer-cloud/conversation/v1")
const app = express();
var contexts = [];
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get("/webhook", (req, res) => {
    if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'Banking Bot') {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.status(403).end();
    }
});
app.post('/webhook', (req, res) => {
    console.log(req.body);
    if (req.body.object === 'page') {
        req.body.entry.forEach((entry) => {
            entry.messaging.forEach((event) => {
                if (event.message && event.message.text) {
                    sendMessage(event);
                }
            });
        });
        res.status(200).end();
    }
})
app.get("/test", (req, res) => {
    res.json("Hello There, this app works!");
});

function sendMessage(event) {
    let sender = event.sender.id;
    console.log("The sender id is: " + sender);
    let message = event.message.text;
    let context = null;
    let contextIndex = 0;
    let index = 0;
    contexts.forEach((value) => {
        console.log(value.from)
        if (value.from == sender) {
            context = value.context;
            contextIndex = index;
        }
        index++;
    });
    console.log("Received message from " + sender + " saying '" + message + "'");
    var conversation = new watson({
        username: "683584ae-5991-4ca6-a7a9-3961a658cd33",
        password: "3OpKNmHohem3",
        version_date: watson.VERSION_DATE_2017_04_21
    });
    console.log(JSON.stringify(context));
    console.log(contexts.length);
    conversation.message({
        input: {
            text: message
        },
        workspace_id: "69581154-9452-4028-8ad3-37ab279dbd63",
        context: context,
    }, (err, response) => {
        if (err) {
            console.log(err);
        } else {
            console.log(response.output.text[0]);
            if (!context) {
                contexts.push({
                    "from": sender,
                    "context": response.context
                })
            } else {
                contexts[contextIndex].context = response.context;
            }
            //First check if there are intents available
            if (typeof response.intents != "undefined") {
                //Copy the intent into another variable
                intentArray = response.intents;
                if (intentArray.length > 0) {
                    var intent = response.intents[0].intent;
                    console.log(intent);
                    if (intent == 'done') {
                        contexts.splice(contextIndex, 1);
                    }
                }

            }
            request({
                url: "https://graph.facebook.com/v2.6/me/messages",
                qs: {
                    access_token: "EAAEFcnrSHJ8BAKvIwB0SCnnFakR640NmqDCmxUkIUezZCduG1qovZBLZBQZBvSAyOZAve5C8kZA0mNH3CPI1FnlOaSWjr5UszrwTeosfuY1FCdayDp4ZCoOZBrUv8BqTbSJuHoHrgcj42nb0t1F0x7TIZARHSA2Pi5j7e60dwkqxpJwZDZD"

                },
                method: "POST",
                json: {
                    recipient: {
                        id: sender
                    },
                    message: {
                        text: response.output.text[0]
                    }
                }
            }, (error, response) => {
                if (error) {
                    console.log("Error sending message", error);
                } else if (response.body.error) {
                    console.log("Error: ", response.body.error);
                }
            });
        }
    });
}
const server = app.listen(process.env.PORT || 3000, () => {
    console.log("Server starting on port: " + server.address().port)
});
// For Saka's former page.
// access_token: "EAAEhpuUYLXkBAKatG6W5vF04vNwDMUBMOrXIbeNTVOMTRZBaj9ZCXDoQDxZBiKVuywKrGlfQUlJstO2YRqrarE6Tqr3ZCXmkOTUZAfflK5i2ccJ7wFaSaMTr7AJw0ersvUPo3Q09HhqVuM0NNbdmxcSirQH7Fv3oe5bTTdem5VgZDZD"

//For Impulse Energy Drink
// access_token: "EAAGI5aLQ0WMBAPaldrDxXPn52wWZA7ZAWAyPqvWg5xCF6ZCXa9OivmRxPP2hZBDXnxHiR0dvaVWRIymLWT9Tf7q9dDXfFWk0MdekoNVZCITSHNgXKzPHJe3tmY1RGIjLuGyVWQCLEZATSHUoCRp4TX3WIcOSJxKMhaGhB1VtgD8QZDZD"
