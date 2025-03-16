
// desc : Turn your lights off when the SmartApp is tapped or when the location mode is changed

//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());
    

const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('Turn your lights off when the SmartApp is tapped or when the location mode is changed');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});



app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("da7b1e83-c11a-4340-83cd-66ee6ed81cb2")
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

    // when location mode changes, light being off
    .subscribedEventHandler('undefined', async (context, event) => {
        await context.api.devices.sendCommands(context.config.light, 'switch', 'on');
    })


let port = process.env.PORT || 8709;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
