
// desc :Change Mode based on your bedroom switch and time. if day and bedroom light is on => home mode else night mode



//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());


const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('Change Mode based on your bedroom switch and time');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});



app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("f4bd1079-420a-4a4f-95c5-580db4dabb12")
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
        const hours = new Date().getHours()
        const isDayTime = hours > 6 && hours < 20
        let homeModeId = '';
        let awayDayModeId = '';
        let NightModeId = '';
        let awayNightModeId = '';
            const modeList = await context.api.modes.list();
            modeList.forEach(element => {
                if (element.name === 'Home') {
                    homeModeId = element.id;
                } else if (element.name === 'Night') {
                    NightModeId = element.id;
                } else if (element.name === 'Away night') {
                    awayNightModeId = element.id;
                } else if (element.name === 'Away Day') {
                    awayDayModeId = element.id;
                }
            });

        if (isDayTime){
            if (event.value === 'off'){
		await context.api.modes.setCurrent(awayDayModeId , event.locationId)
            }
            else if (event.value === 'on'){
		await context.api.modes.setCurrent(homeModeId, event.locationId)
            }
        }else if (!isDayTime){
            if (event.value === 'off'){
		await context.api.modes.setCurrent(awayNightModeId, event.locationId)
            }
            else if (event.value === 'on'){
		await context.api.modes.setCurrent(NightModeId, event.locationId)
            }
        }
        
    })




    


let port = process.env.PORT || 8887;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
