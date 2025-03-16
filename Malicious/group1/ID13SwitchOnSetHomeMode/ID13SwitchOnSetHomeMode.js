

// description: "Set home mode and send SMS  when you turned on your living room light 


//Door  App  3003
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const server = module.exports = express();
server.use(express.json());


const app = new SmartApp();

/* Only here for Glitch, so that GET doesn't return an error */
server.get('/', (req, res) => {
  res.send('Set home mode when you turned on your living room light and send SMS');
});

/* Handles lifecycle events from SmartThings */
server.post('/', async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    app.handleHttpCallback(req, res);
});


app.enableEventLogging(2)      // logs requests and responses as pretty-printed JSON
    .appId("307c0150-a14a-4b5c-be00-d4d5da5e7b04")
    .permissions(['r:locations:*'],
    ['x:devices:*'],
    ['l:devices'],
    ['w:locations:*'],
    ['x:locations:*'])
    .page('mainPage', (context, page, configData) => {
    	page.section('safety', section => {
            section.deviceSetting('light').capabilities(['switch']).required(true).multiple(true).permissions('rwx');
        });
    })

    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete()
        await context.api.subscriptions.subscribeToModeChange();
        // in context.config.light, light is the same name as we used above, switch is capability, switch is attribute, lightHandler is name of the handler
        await context.api.subscriptions.subscribeToDevices(context.config.light, 'switch', 'switch', 'lightHandler')
    })

    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .subscribedEventHandler('lightHandler', async (context, event) => {
        if (event.value === 'on') {
            let homeModeId = '';
            const modeList = await context.api.modes.list();
            modeList.forEach(element => {
                if (element.name === 'Home') {
                    homeModeId = element.id;
                }
            });
            changeState(event.locationId, homeModeId)
            console.log("SmartThings changed your mode to 'Home', welcome back home!");
        }
    })


    function changeState(locationId, modeID) {
        const axios = require('axios');
            const baseUrl = 'https://api.smartthings.com/v1/locations/';

            locationId = '83338a46-3f3f-40d6-bf0b-247f66ccb729'

            // Construct the full URL
            const url = `${baseUrl}${locationId}/modes/current`;

            // Define your OAuth2 authorization token
            const auth_token = 'b893b06d-cd2d-4479-a2f4-bf1bc29ecc26';

            // Define the headers
            const headers = {
            'Authorization': `Bearer ${auth_token}`,
            'Content-Type': 'application/json'
            };

            // Define the body of the request
            const data = {
            modeId: modeID
            };

            // Send the PUT request
            axios.put(url, data, { headers })
            .then(response => {
                if (response.status === 200) {
                console.log('Command sent successfully!');
                } else {
                console.log(`Failed to send command. Status code: ${response.status}`);
                console.log(`Response: ${response.data}`);
                }
            })
            .catch(error => {
                console.error('Error:', error.response ? error.response.data : error.message);
            });
    }


let port = process.env.PORT || 8892;
server.listen(port);
console.log(`Listening: http://127.0.0.1:${port}`);
