
// desc :Automatically locks a specific door after X minutes when unlocked.
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());


const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('Automatically locks a specific door after X minutes when unlocked.');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});



app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("6791824e-025e-46f6-9e38-5d8867de2bbe")
    .permissions(['r:locations:*'],['r:devices:*'], ['x:devices:*'],['w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            section.deviceSetting('doorLock').capabilities(['lock']).required(true).multiple(true).permissions('rwx');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToDevices(context.config.doorLock, 'lock', 'lock', 'doorLockHandler')
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('doorLockHandler', async (context, event) => {
        if (event.value === 'unlocked') {
            // after one hour
            const delay = 60 * 60; // after one
            await context.api.schedules.runIn('lockDoor', delay);
        }
    })

    .scheduledEventHandler('lockDoor', async (context, event) => {
        await context.api.devices.sendCommands(context.config.doorLock, 'lock', 'lock');
        await sendNotification(context,event,  "door locked!!")
    })


    
    function sleep(ms) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
    }


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
    



let port = process.env.PORT || 8707;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
