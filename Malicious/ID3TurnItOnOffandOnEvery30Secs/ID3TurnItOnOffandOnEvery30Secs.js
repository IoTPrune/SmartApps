
// desc : When a SmartSense Multi is opened, a switch will be turned on, and then turned off after 5 minutes.
//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());
    

const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('desc : When a SmartSense Multi is opened, a switch will be turned on, and then turned off after 5 minutes.');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});

app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("58036329-053b-4939-be82-90b7c726befa")
    .permissions(['r:locations:*'],['r:devices:*'], ['x:devices:*'],['w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            // use a switch instead of a real sensor
            section.deviceSetting('contactSensor').capabilities(['contactSensor']).required(true).multiple(true).permissions('rwx');
            section.deviceSetting('light').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToDevices(context.config.contactSensor, 'contactSensor', 'contact', 'contactSensorHandler')
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('contactSensorHandler', async (context, event) => {
        if (event.value ==='open'){
            await context.api.devices.sendCommands(context.config.light, 'light', 'on');
            await runScheduler(context, 5, 'faskeAlarm') //call scheduler in 4 mins
        }
    

    })


    .scheduledEventHandler('faskeAlarm', async (context, event) => {
        await context.api.devices.sendCommands(context.config.light, 'switch', 'on'); 
    })


    async function runScheduler(context, delayTime, schedulerName){
        const delay =  0.5; // updated. call in 30 seconds. malicious
        await context.api.schedules.runIn(schedulerName, delay);
    }

let port = process.env.PORT || 8721;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
