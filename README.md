<p align="center">
  <h2 align="center">IMI Demo</h2>

  <p align="center">
    Send SMS to and from Webex spaces using a Webex bot.  Powered by Cisco's IMIMobile acquisition.
    <br />
    <a href="https://github.com/WXSD-Sales/imidemo/issues"><strong>Report Bug</strong></a>
    ·
    <a href="https://github.com/WXSD-Sales/imidemo/issues"><strong>Request Feature</strong></a>
  </p>
</p>

## About The Project

[![SMS to/from Webex Video Demo](https://img.youtube.com/vi/NY-_RQHKcsY/0.jpg)](https://youtu.be/NY-_RQHKcsY, "SMS to/from Webex")


### Walkthrough

To begin using the production version of this bot, **send a Webex message to imidemo@webex.bot**  
_(You can send a Webex message to a bot the same way you send a message to a person)_  

**Configuring a Team**  
1. If you have no teams configured, you should add a team first with the add team button.
2. You can enter any team name (i.e. your name)
3. And any US/Canadian, or Irish mobile number that is SMS enabled. (i.e. your cell/mobile number)  
_Note: a team in the bot's context is currently just a single SMS number_  

**Sending an SMS**  
1. Once a team has been configured, you can select the team from the dropdown in the card.
2. With a team selected, enter the text you want to send to the SMS number.
3. Click send, and the mobile number configured as the team should receive the SMS.
4. With your mobile device, you can reply one time to the message received by your mobile device.
5. Both the sent and received messages should appear in the Webex chat with the bot.

**Configuring a Custom Bot**  
This bot can be themed to look more like a given org or customer's brand.  
To get started, click the customize button of the card returned by imidemo@webex.bot. Then,
1. [Create a Webex bot](https://developer.webex.com/my-apps/new/bot).  The bot's name and icon should fit the desired look and feel.  For example, if you are creating the bot to look like a bot for a specific retail store, consider naming the bot something like, "My Retail Store Notification Bot," and using the logo of the retailer as the bot's icon.
2. Once you've created the bot, enter the bot's auth token in the corresponding card field.
3. Use an image for the card header.  This can be the same image you used as the bot's logo, or a different image, but the image will need to be a public link to a .jpg or .png file.
4. Optionally, uncheck or check "Show Instructions"
5. Optionally change the name of the card header
6. Click "Add bot"

**Once you've created a custom bot, our code will automatically configure webhooks to use for your new bot.  You can then interact with the bot similar to how imidemo@webex.bot works, and use the new bot to send/receive SMS!**



### Built With
node v14.5.0  
npm 7.24.2  

npm dependencies:  
```
dotenv: ^8.2.0
express: ^4.17.1" 
got: ^11.8.3
mongodb: ^4.2.1
```


### Installation

After you clone this repo, you will need to configure a .env file (you can copy from sample.env to get started.  However, this code relies on an imiconnect flow to send and receive SMS.  Please reach out to wxsd@external.cisco.com for help configuring your own installation.  Once you've setup the .env file and imiconnect flows, you can simply:
```
npm init
npm install
npm start
```

## License

Distributed under the MIT License.

<!-- CONTACT -->

## Contact
Please contact us at wxsd@external.cisco.com
