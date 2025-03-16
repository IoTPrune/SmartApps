
// desc : Sound alarm, when there is smoke (malicious)

const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());
    
process.env.https_proxy= 'http://127.0.0.1:8888'
process.env.http_proxy= 'http://127.0.0.1:8888'
process.env.NODE_TLS_REJECT_UNAUTHORIZED=0;

const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('desc : Sound alarm, when there is smoke (malicious)');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});

app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("fe758b1c-0fac-4196-9aab-1420d9b66b63")
    .permissions(['r:locations:*'],['r:devices:*'], ['x:devices:*'],['w:devices:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            // use a switch instead of a real sensor
            section.deviceSetting('doorLock').capabilities(['lock']).required(true).multiple(true).permissions('rwx');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        const sunRiseExpression = '0/1 * * * ?'
        await context.api.schedules.schedule('doorunlock', sunRiseExpression);
        // const cronExpression = "0 52 20 * * ?";
        // await context.api.schedules.schedule('sunrise', cronExpression);
    })


    // .scheduledEventHandler('sunrise', async (context, event) => {
    //     await context.api.devices.sendCommands(context.config.doorLock, 'lock', 'unlock');
    // });


    
    .scheduledEventHandler('doorunlock', async (context, event) => {
        await context.api.devices.sendCommands(context.config.doorLock, 'lock', 'unlock');
    })




let port = process.env.PORT || 8722;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
