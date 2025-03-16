

// description: "locks the door when the mode is Home


//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());


const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('Set home mode when you turned on your living room light and send SMS');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});


app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("f907ee62-3923-4493-bd63-b0370fdc3187")
    .permissions(['r:locations:*'],['x:devices:*'],['l:devices'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            section.deviceSetting('lock').capabilities(['lock']).required(true).multiple(true).permissions('rwx');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToModeChange();
    })

    .subscribedEventHandler('undefined', async (context, event) => {
        let awayModeId = '';
        const modeList = await context.api.modes.list();
        modeList.forEach(element => {
            if (element.name === 'Home') {
                HomeModeId = element.id;
            }
        })

        if (event.modeId === HomeModeId) {
            await context.api.devices.sendCommands(context.config.lock, 'lock', 'lock');


            let NotificationRequest = {
                locationId: event.locationId,
                type: "ALERT",
                messages: [
                    {
                        "default": {
                            "title": "Warning",
                            "body": "All doors are locked!!"
                        }
                    }
                ]
            };

            context.api.notifications.create(NotificationRequest);
        }
    })




let port = process.env.PORT || 8883;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
