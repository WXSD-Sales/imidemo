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
