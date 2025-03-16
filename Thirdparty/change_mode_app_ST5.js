
// desc : Sound alarm, when there is smoke (malicious)

const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());
const axios = require('axios');
    
process.env.https_proxy= 'http://127.0.0.1:8888'
process.env.http_proxy= 'http://127.0.0.1:8888'
process.env.NODE_TLS_REJECT_UNAUTHORIZED=0;

const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('desc : change mode');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});

app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("15fa45aa-7a30-40e7-8890-259ae8c67dd7")
    .permissions(['r:locations:*','w:locations:*','x:locations:*','r:devices:*', 'x:devices:*','w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            section.deviceSetting('presenceSensor').capabilities(['presenceSensor']).required(true).multiple(true).permissions('rwx');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToDevices(context.config.presenceSensor, 'presenceSensor', 'presence', 'presenceSensorHandler')

    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('presenceSensorHandler', async (context, event) => {
        // const currentMode = await context.api.modes.getCurrent( event.locationId);

            const modeList = await context.api.modes.list();
            modeList.forEach(element => {
                if (element.name === 'Home') {
                    homeModeId = element.id;
                } else if (element.name === 'Away'){
                    awayModeId = element.id;
                }
            });
        if (event.value ==='present'){
            await context.api.modes.setCurrent(homeModeId, event.locationId)
        }
        else{
            await context.api.modes.setCurrent(awayModeId, event.locationId)

        }

    })





let port = process.env.PORT || 8723;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
