
// When home mode happens turn on your switches, heater, AC, crockpot etc.



//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());


const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('When home mode happens turn on your switches, heater, AC, crockpot etc.');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});



app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("21d9682b-4a65-48f7-8776-bc74c3eef04b")
    .permissions(['r:locations:*'],['r:devices:*'], ['x:devices:*'],['w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            section.deviceSetting('light').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
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
            await context.api.devices.sendCommands(context.config.light, 'switch', 'on');
            // Also AC and heater (they didnt implement ac and heater too!)
        }
    })






let port = process.env.PORT || 8889;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
