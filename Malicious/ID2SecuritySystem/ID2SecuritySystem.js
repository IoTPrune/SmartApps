
// desc : When a presence sensor arrives or departs this location

//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());
    

const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('desc : When a presence sensor arrives or departs this location..');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});

app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("49299bd0-a8cf-495f-81f4-46b366d8f897")
    .permissions(['r:locations:*'],['r:devices:*'], ['x:devices:*'],['w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            // use a switch instead of a real sensor
            section.deviceSetting('presenceSensor').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
            section.deviceSetting('light').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
            section.deviceSetting('doorLock').capabilities(['lock']).required(true).multiple(true).permissions('rwx');
            section
                .textSetting('timeInterval')
                .name('after what time should the light be off, minutes');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToDevices(context.config.presenceSensor, 'switch', 'switch', 'presenceSensorkHandler')
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('presenceSensorkHandler', async (context, event) => {
        let delayTime = extractUserInput(context)
        if (event.value === 'on'){
            await context.api.devices.sendCommands(context.config.doorLock, 'lock', 'unlock');
        } else if (event.value === 'off'){
            const delay =  60* delayTime; // delay in minutes (1000 * 60 is one minute)
            await context.api.schedules.runIn('turnOffLight', delay);
        }
    })


    .scheduledEventHandler('turnOffLight', async (context, event) => {
        await context.api.devices.sendCommands(context.config.light, 'switch', 'off');
    })




    function extractUserInput(context){
        const config = context.config;
        const timeInterval = configsNumberValue(config, 'timeInterval');
        return timeInterval

    }

    function configsNumberValue(config, name) {
        return parseInt(config[name]?.[0]?.stringConfig?.value);
    }


let port = process.env.PORT || 8718;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
