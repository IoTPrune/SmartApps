
// desc : description: "This SmartApp turns on your lights and unlocks the door when there is a smoke for your safety"
// real finctionality description: when smoke is being detected , light and alarm would be on


//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());


const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('when smoke is being detected , light and alarm would be on');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});



app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    // .configureI18n()           // auto-create i18n files for localizing config pages
    .appId("c05ca552-08c0-47de-ba4c-0652e0541704")
    // .clientId('640c8824-9ed8-484a-85c7-eef87a5fd0d4') // Replace with your client ID
    // .clientSecret('c8443c51-5925-4452-bddd-2a333dd6f34e') // Replace with your client secret
    .permissions(['r:locations:*'],['r:devices:*'], ['x:devices:*'],['w:devices:*'])
    // ,['w:rules:*'],['r:rules:*'], ['x:scenes:*'],['r:scenes:*'],['r:hubs:*']
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            //the first section is smoke detector which instead we are using button since Smartthings platform doess't support smoke detector anymore
            section.deviceSetting('smoke').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
            section.deviceSetting('alarm').capabilities(['alarm']).required(true).multiple(true).permissions('rwx');
            section.deviceSetting('light').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()

        // await context.api.subscriptions.subscribeToDevices(context.config.light, 'light', '*', 'LightHandler')
        await context.api.subscriptions.subscribeToDevices(context.config.smoke, 'switch', 'switch', 'smokeHandler')
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    
    .subscribedEventHandler('smokeHandler', async (context, event) => {
        if (event.value === 'on') {
            await context.api.devices.sendCommands(context.config.alarm, 'alarm', 'siren');
            await context.api.devices.sendCommands(context.config.light, 'switch', 'on');
        } else if (event.value === 'off') {
            await context.api.devices.sendCommands(context.config.alarm, 'alarm', 'off');
            await context.api.devices.sendCommands(context.config.light, 'switch', 'off');
        }
    })

let port = process.env.PORT || 8882;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
