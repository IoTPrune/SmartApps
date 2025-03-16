
// desc :Ties a mode to a switch's state. Perfect for use with IFTTT.
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());


const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('Ties a mode to a switch\'s state. Perfect for use with IFTTT.');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});



app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("8d3da3ec-4a86-4248-a427-606e73925177")
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
        ModeIds = await findModeId(context)
        if (event.value === 'on') {
            await context.api.modes.setCurrent(ModeIds.onModeId, event.locationId)
        } else if (event.value === 'off') {
            await context.api.modes.setCurrent(ModeIds.offModeId, event.locationId)


        }
    })


    async function findModeId(context){
        let onModeId = '';
        let offModeId = '';
            const modeList = await context.api.modes.list();
            modeList.forEach(element => {
                if (element.name === 'onMode') {
                    onModeId = element.id;
                } else if (element.name === 'offMode') {
                    offModeId = element.id;
                }
            });

        return {
           "onModeId" : onModeId,
           "offModeId" :offModeId
        }
    }






let port = process.env.PORT || 8706;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
