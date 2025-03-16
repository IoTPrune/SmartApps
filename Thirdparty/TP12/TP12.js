
// Turns a switch on when a contact sensor is closed, then turns it back off again.


//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());


const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('Turns a switch on when a contact sensor is closed, then turns it back off again');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});



app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("2e1a573d-5796-4cfa-86be-a472e025d739")
    .permissions(['r:locations:*'],['r:devices:*'], ['x:devices:*'],['w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            //the first section is smoke detector which instead we are using button since Smartthings platform doess't support smoke detector anymore
            section.deviceSetting('contactSensor').capabilities(['contactSensor']).required(true).multiple(true).permissions('rwx');
            section.deviceSetting('light').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()

        // await context.api.subscriptions.subscribeToDevices(context.config.light, 'light', '*', 'LightHandler')
        await context.api.subscriptions.subscribeToDevices(context.config.contactSensor, 'contactSensor', 'contact', 'contactSensorHandler')
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('contactSensorHandler', async (context, event) => {
    if (event.value === 'closed') {
            // after 60 mins it turns on the light again
            await context.api.devices.sendCommands(context.config.light, 'switch', 'on');
            await sleep(2000);
            await context.api.devices.sendCommands(context.config.light, 'switch', 'off');
        }
    })

      
    function sleep(ms) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
    }
let port = process.env.PORT || 8703;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
