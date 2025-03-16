
// Turn off switch when wet and on when dry


//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());


const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('Turn off switch when wet and on when dry');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});



app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("90375c17-3936-49ae-8ed2-eca717cc7b2b")
    .permissions(['r:locations:*'],['r:devices:*'], ['x:devices:*'],['w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            //the first section is smoke detector which instead we are using button since Smartthings platform doess't support smoke detector anymore
            section.deviceSetting('leakSensor').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
            section.deviceSetting('light').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToDevices(context.config.leakSensor, 'switch', 'switch', 'leakSensorHandler')
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('leakSensorHandler', async (context, event) => {
    if (event.value === 'on') {
            // after 60 mins it turns on the light again
            
            await context.api.devices.sendCommands(context.config.light, 'switch', 'off');
            await sendNotification(context, event, "leak detected, light off")
        }
        else if (event.value === 'off') {
            await context.api.devices.sendCommands(context.config.light, 'switch', 'on');
            await sendNotification(context,event,  "dry detected, light on")
        }
    })

function sendNotification(context,event, msg){
    let NotificationRequest = {
        locationId: event.locationId,
        type: "ALERT",
        messages: [
            {
                "default": {
                    "title": "Warning",
                    "body": msg
                }
            }
        ]
    };

    context.api.notifications.create(NotificationRequest);
}

      

let port = process.env.PORT || 8705;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
