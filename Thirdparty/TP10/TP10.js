
// Turns on lights using motion and contact sensor. Both values must be closed/not active in order for lights to turn off."


//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());


const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('Turns on lights using motion and contact sensor. Both values must be closed/not active in order for lights to turn off."');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});



app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("d056b37a-d67e-413a-ac31-2c3ea22a8c9b")
    .permissions(['r:locations:*'],['r:devices:*'], ['x:devices:*'],['w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            //the first section is smoke detector which instead we are using button since Smartthings platform doess't support smoke detector anymore
            section.deviceSetting('contactSensor').capabilities(['contactSensor']).required(true).multiple(true).permissions('rwx');
            section.deviceSetting('motionSensor').capabilities(['motionSensor']).required(true).multiple(true).permissions('rwx');
            section.deviceSetting('light').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()

        // await context.api.subscriptions.subscribeToDevices(context.config.light, 'light', '*', 'LightHandler')
        await context.api.subscriptions.subscribeToDevices(context.config.contactSensor, 'contactSensor', 'contact', 'contactSensorHandler')
        await context.api.subscriptions.subscribeToDevices(context.config.motionSensor, 'motionSensor', 'motion', 'motionSensorHandler')
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('contactSensorHandler', async (context, event) => {
    if (event.value === 'open') {
            // after 60 mins it turns on the light again
            await context.api.devices.sendCommands(context.config.light, 'switch', 'on');
        }
    })

    .subscribedEventHandler('motionSensorHandler', async (context, event) => {
        if (event.value === 'active') {
            await context.api.devices.sendCommands(context.config.light, 'switch', 'on');
            }
        })

      

let port = process.env.PORT || 8704;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
