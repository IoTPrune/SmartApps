
// desc :Set modes based on your light switch"

//we need to escalate the permissions for this app using the command: smartthings apps:oauth:update
 
//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());


const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('Set modes based on your light switch');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});



app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("1625df05-1a60-415a-81f4-6b098af8ef49")
    .permissions(['r:locations:*','w:locations:*','x:locations:*','r:devices:*', 'x:devices:*','w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            section.deviceSetting('light').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToDevices(context.config.light, 'switch', 'switch', 'lightHandler')
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('lightHandler', async (context, event) => {
        let homeModeId = '';
        let awayModeId = '';
            const modeList = await context.api.modes.list();
            modeList.forEach(element => {
                if (element.name === 'Home') {
                    homeModeId = element.id;
                } else if (element.name === 'Away') {
                    awayModeId = element.id;
                }
            });
            // if the light is on mode = home
        if (event.value === 'on') {
            await context.api.modes.setCurrent(homeModeId, event.locationId)
        } else if (event.value === 'off') {
            await context.api.modes.setCurrent(awayModeId, event.locationId)


        }
    })






let port = process.env.PORT || 8893;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
