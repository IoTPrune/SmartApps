
// desc : if presence sensor is active then lights are on, if not, lights are off"



//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());


const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('if presence sensor is active then lights are on, if not, lights are off');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});



app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("447ce6ed-d1e1-49d6-bd88-b3a9ff22903e")
    .permissions(['r:locations:*'],['r:devices:*'], ['x:devices:*'],['w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            //camera is used instead of presence sensor
            section.deviceSetting('presenceSensor').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
            section.deviceSetting('light').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToDevices(context.config.presenceSensor, 'switch', 'switch', 'presenceSensorHandler')
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('presenceSensorHandler', async (context, event) => {
        if (event.value === 'on') {
            await context.api.devices.sendCommands(context.config.light, 'switch', 'on');
        } else if (event.value === 'off') {
            await context.api.devices.sendCommands(context.config.light, 'switch', 'off');
        }
    })

let port = process.env.PORT || 8881;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
