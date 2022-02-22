require('dotenv').config();

const got = require("got");

const { readFileSync } = require('fs');
const mainCard = readFileSync('./cards/main.json', 'utf8');
const customizeCard = readFileSync('./cards/customize.json', 'utf8');
const addTeamCard = readFileSync('./cards/add_team.json', 'utf8');

const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const { cardbuilder } = require("./cardbuilder");
const { webexAPI, webexAPIDelete } = require("./api_requests");
const { findTeams, addTeam, deleteTeam, findBots, getBotByWebhook, getBotByPersonId, addBot, deleteBot, updateBot } = require("./mongo_controller");
const { resourceLimits } = require('worker_threads');
const { triggerAsyncId } = require('async_hooks');


async function sendWebexMessage(roomId, message, token, card){
  let payload = {
                 "roomId":roomId,
                 "markdown":message
                }
  if(card !== undefined){
    payload.attachments = [
      {
        "contentType": "application/vnd.microsoft.card.adaptive",
        "content": card
      }
    ]
  }
  //console.log(JSON.stringify(payload));
  let result = await webexAPI('messages', token, payload);
  return result;
}


async function finalizeCard(roomId, cardData, cardType){
  let formattedCard;
  if(cardType == "main"){
    formattedCard = mainCard;
  } else {
    formattedCard = addTeamCard;
  }
  formattedCard = formattedCard.replace("$(useImageUrl)", cardData.url);
  formattedCard = formattedCard.replace("$(useTitle)", cardData.title);
  if(cardType == "main"){
    formattedCard = formattedCard.replace("$(showInstructions)", cardData.instructions);
    console.log(cardData.teams);
    let teamSelection = "";
    if(cardData.teams != ""){
      teamSelection = JSON.stringify({
        "type": "Input.ChoiceSet",
        "placeholder": "Select Team",
        "choices": cardData.teams,
        "id": "team"
      }) + ",";
    } else {
      teamSelection = JSON.stringify({
        "type": "TextBlock",
        "text": "You do not yet have any teams. Please add one below.",
        "wrap": true,
        "spacing": "Small"
      }) + ",";
    }
    formattedCard = formattedCard.replace("$(teamSelection)", teamSelection);
    formattedCard = formattedCard.replace("$(teamInstructions)", cardData.teamInstructions);
    let formattedCustomizeCard = "";
    if(cardData.token == process.env.WEBEX_ACCESS_TOKEN){
      formattedCustomizeCard = customizeCard;
      //console.log(formattedCustomizeCard)
      formattedCustomizeCard = formattedCustomizeCard.replace("$(defaultCardTitle)", process.env.DEFAULT_CARD_TITLE);
      formattedCustomizeCard = formattedCustomizeCard.replace("$(botChoices)", cardData.choices);
      formattedCustomizeCard = formattedCustomizeCard.replace("$(editBotButton)", cardData.editButton);
      formattedCustomizeCard = formattedCustomizeCard.replace("$(deleteBotButton)", cardData.deleteButton);
      formattedCustomizeCard = "," + formattedCustomizeCard;
    }
    formattedCard = formattedCard.replace("$(customize)", formattedCustomizeCard);
  }
  console.log('formattedCard:');
  console.log(formattedCard);
  await sendWebexMessage(roomId, `${cardData.title} - Adaptive Card Payload`, cardData.token, JSON.parse(formattedCard)).catch(async(e)=>{
    console.log('finalizeCard error:');
    console.log(e);
    await sendWebexMessage(roomId, `There was an error sending the adaptive card for this bot.  Please confirm the image url is valid and try again.`, cardData.token);
  });
}


async function sendCard(webhook, cardData){
  let roomId = webhook.data.roomId;
  cardData = await prepareTeamsForCard(webhook.actorId, cardData);
  if(cardData.teams === "" && cardData.id != null){
    console.log('sending addTeam card');
    //await sendWebexMessage(roomId, `IMI Mobile - Add Team - Adaptive Card Payload`, cardData.token, addTeamCard);
    await finalizeCard(roomId, cardData, "addTeam"); 
  } else {
    cardData = await prepareBotsForCard(webhook.actorId, cardData);
    console.log('cardData');
    console.log(cardData);
    await finalizeCard(roomId, cardData, "main"); 
  }
}


async function prepareCard(webhook){
  let botData = await getBotByWebhook(webhook.id, webhook.resource);
  return buildCardData(botData);
}

async function prepareTeamsForCard(actorId, cardData){
  let cursor = await findTeams(actorId, cardData.id);
  let teamsArray = [];
  await cursor.forEach(doc => {
    console.log(doc)
    teamsArray.push({
        "title": doc.title, "value": JSON.stringify({
            "value": doc.number, "id": doc._id, "name": doc.title
        })
    });
  });
  if(teamsArray.length > 0){
    cardData.teams = teamsArray;//JSON.stringify(teamsArray);
  }
  if(cardData.id == null){
    cardData.teamInstructions = JSON.stringify({
      "type": "TextBlock",
      "text": "Please note that teams added to this bot will be global (you will see them as options in all of your custom bots).",
      "wrap": true,
      "spacing": "Small"
    }) + ",";
  }
  return cardData;
}

async function prepareBotsForCard(actorId, cardData){
  let personalBots = await findBots(actorId);
  cardData = await buildPersonalCardData(personalBots, cardData);
  return cardData;
}

function buildCardData(doc){
  let cardData = cardbuilder();
  if (doc !== null) {
    for(let key of Object.keys(doc)){
      cardData[key] = doc[key];
    }
  }
  return cardData;
}

async function buildPersonalCardData(cursor, cardData){
  let finalArray = [];
  await cursor.forEach(doc => {
    //let botName = payload[botKeys[i]].name.replace(/\$apos\$/g, "'").replace(/\$quot\$/g, '"');
    finalArray.push({
        "title": doc.name, "value": doc.id
    });
  });
  if(finalArray.length > 0){
    cardData.choices = JSON.stringify({
      "type": "Input.ChoiceSet",
      "id": "bot_select",
      "placeholder": "Select Bot",
      "spacing": "Large",
      "choices": finalArray
    }) + ",";
    cardData.editButton = "," + JSON.stringify({
        "type": "Action.Submit",
        "title": "Edit Bot",
        "id": "edit_bot",
        "data": {
            "submit": "edit_bot"
        }
    }) + ",";
    cardData.deleteButton = JSON.stringify({
        "type": "Action.Submit",
        "title": "Delete Bot",
        "style": "destructive",
        "id": "delete_bot",
        "data": {
            "submit": "delete_bot"
        }
    });
  }
  return cardData;
}


function validatePhoneNumber(inputNumber){
  phoneNumber = inputNumber.replace(/\D/g, '');
  if (phoneNumber.length == 10 || (phoneNumber.length == 11 && phoneNumber[0] == '1')) {
      if (phoneNumber.length == 10) {
          phoneNumber = "1" + phoneNumber;
      }
      return phoneNumber;
  } else {
      return null;
  }
}


router.post(`/cards`, async(request,response) => {
  let webhook = request.body;
  console.log('attachment action event:');
  console.log(webhook);
  try{
    let roomId = webhook.data.roomId;
    let cardData = await prepareCard(webhook);
    await webexAPI(`attachment/actions/${webhook.data.id}`, cardData.token).then(async(attachmentAction) => {
      console.log(attachmentAction);
      let inputs = attachmentAction.inputs
      if(inputs.submit == 'add_team'){
        if([inputs.name, inputs.number].indexOf('') >= 0){
          await sendWebexMessage(roomId, 'You must enter a team name and phone number when adding a team.', cardData.token);
        } else {
          let phoneNumber = validatePhoneNumber(inputs.number);
          if(phoneNumber !== null){
            //cleanName = inputs.name.replace(/"/g, '$apos$').replace(/'/g, '$apos$');
            let newTeam = await addTeam(webhook.actorId, inputs.name, phoneNumber, cardData.id);
            console.log('newTeam');
            console.log(newTeam);
            await webexAPIDelete(`messages/${webhook.data.messageId}`, cardData.token);
            await sendCard(webhook, cardData);
          } else {
            await sendWebexMessage(roomId, 'The phone number entered must be a 10 digit US/Canadian number.', cardData.token);
          }
        }
      } else if(['add_bot', 'edit_bot', 'delete_bot'].indexOf(inputs.submit) >= 0){
        let cleanCardTitle = '';
        if(inputs.hasOwnProperty('card_title')){
          cleanCardTitle = inputs.card_title//.replace(/"/g, '$apos$').replace(/'/g, '$apos$');
        }
        if('add_bot' == inputs.submit){
          if([inputs.token, inputs.image_url].indexOf('') >= 0){
            await sendWebexMessage(roomId, 'You must enter an access token and an image URL when adding a new bot.', cardData.token);
          } else {
            await webexAPI('people/me', inputs.token).then(async(botPerson) => {
              console.log('botPerson:');  
              console.log(botPerson);
              if(cleanCardTitle === ''){
                cleanCardTitle = process.env.DEFAULT_CARD_TITLE;
              }
              await getBotByPersonId(botPerson.id).then(async(doc) => {
                console.log("botExists")
                console.log(doc);
                if(doc !== null){
                  await sendWebexMessage(roomId, `**${botPerson.displayName}** already exists in our records.`, cardData.token); 
                } else {
                  await got(inputs.image_url).then(async() => {
                    let failMsg = `Failed to create webhooks for **${botPerson.displayName}**.  Please use the bot token to check the bot's [existing webhooks](https://developer.webex.com/docs/api/v1/webhooks/list-webhooks) and ensure there are no conflicts.`;
                    let messagesWebhookUrl = new URL('/messages', process.env.WEBHOOK_ROOT_URL).href;
                    let webhookInitData = {"name":"IMI Demo Messages Webhook", "targetUrl":messagesWebhookUrl, "resource":"messages", "event":"created"};
                    await webexAPI('webhooks', inputs.token, webhookInitData).then(async(messagesWebhook) => {
                      let cardsWebhookUrl = new URL('/cards', process.env.WEBHOOK_ROOT_URL).href;
                      let webhookInitData = {"name":"IMI Demo Cards Webhook", "targetUrl":cardsWebhookUrl, "resource":"attachmentActions", "event":"created"};
                      await webexAPI('webhooks', inputs.token, webhookInitData).then(async(cardsWebhook) => {
                        mongoBotObj = {"token": inputs.token, "url": inputs.image_url, 
                                          "name":botPerson.displayName, "title":cleanCardTitle, 
                                          "instructions":inputs.show_instructions == 'true', 
                                          "messages_webhook":messagesWebhook.id, "cards_webhook":cardsWebhook.id, 
                                          "id":botPerson.id, "creator_id":webhook.actorId}
                        await addBot(mongoBotObj).then(async(result) => {
                          console.log('addBot result');
                          console.log(result);
                          await sendWebexMessage(roomId, `**${botPerson.displayName}** has been successfully added.`, cardData.token); 
                          await webexAPIDelete(`messages/${webhook.data.messageId}`, cardData.token);
                          await sendCard(webhook, cardData);
                        }).catch((e) => {
                          console.log('addBot error:');
                          console.log(e);
                        });
                      }).catch(async(we) => {
                        console.log('cards webhook creation error:');
                        console.log(we);
                        await sendWebexMessage(roomId, failMsg, cardData.token); 
                      });
                    }).catch(async(we) => {
                      console.log('messages webhook creation error:');
                      console.log(we);
                      await sendWebexMessage(roomId, failMsg, cardData.token); 
                    });
                  }).catch(async(e)=> {
                    await sendWebexMessage(roomId, 'The image URL you entered cannot be reached.  Please try again with a different image URL.', cardData.token); 
                  })
                }
              })
            }).catch(async(err)=> {
              await sendWebexMessage(roomId, `Invalid access token or error retrieving bot's information.`, cardData.token);
            });
          }
        } else { //edit_bot or delete_bot
          console.log(inputs.bot_select);
          let mongoBot = await getBotByPersonId(inputs.bot_select);
          updateDoc = {}
          if(inputs.submit == "edit_bot"){
              if (cleanCardTitle !== '') {
                updateDoc.title = cleanCardTitle;
              }
              if (inputs.token !== '') {
                updateDoc.token = inputs.token;
              }
              if (inputs.image_url !== '') {
                updateDoc.url = inputs.image_url;
              }
              updateDoc.instructions = inputs.show_instructions == 'true';
              await updateBot(mongoBot.id, updateDoc);
              await sendWebexMessage(roomId, `**${mongoBot.name}** has been edited.`, cardData.token);
          } else if(inputs.submit == "delete_bot") {
            let failMsg = `Failed to delete the bot's webhooks.  As a result, this bot has not been deleted.`;
            await webexAPIDelete(`webhooks/${mongoBot.messages_webhook}`, mongoBot.token).then(async()=>{
              await webexAPIDelete(`webhooks/${mongoBot.cards_webhook}`, mongoBot.token).then(async()=>{
                await deleteBot(mongoBot._id);
                await webexAPIDelete(`messages/${webhook.data.messageId}`, cardData.token);
                await sendWebexMessage(roomId, `**${mongoBot.name}** has been deleted from these records.`, cardData.token);
                await sendCard(webhook, cardData);
              }).catch(async(e) => {
                console.log('cards webhook delete failed:');
                console.log(e);
                await sendWebexMessage(roomId, failMsg, cardData.token);
              });
            }).catch(async(e) => {
              console.log('messages webhook delete failed:');
              console.log(e);
              await sendWebexMessage(roomId, failMsg, cardData.token);
            });
            
          }
        }
      } else {
        if(inputs.team == ''){
          await sendWebexMessage(roomId, 'You must select a team.', cardData.token);
        } else {
          teamData = JSON.parse(inputs.team);
          console.log('teamData:');
          console.log(teamData);
          if(inputs.submit == "delete_team"){
            await deleteTeam(teamData.id);
            await sendWebexMessage(roomId, `Team **'${teamData.name}'** deleted.`, cardData.token);
            await webexAPIDelete(`messages/${webhook.data.messageId}`, cardData.token);
            await sendCard(webhook, cardData);
          } else {
            if(inputs.message == ""){
              await sendWebexMessage(roomId, `You must enter a message.`, cardData.token);
            } else {
              imi_data = {"token": cardData.token, "number": teamData.value,
                          "message": inputs.message, "team_name": teamData.name,
                          "room_id": roomId};
              got(process.env.IMI_INIT_URL, {json: imi_data, method:"POST"}).then(() => {
                console.log('imi init flow launched with data:')
                console.log(imi_data);
              }).catch((e)=> {
                console.log('IMI Send error:')
                console.log(e);
              });
            }
          }
        }
      }
    }).catch((ex) => {
      console.log(`Error w/ attachment/actions/${webhook.data.id}:`)
      console.log(ex);
    });
  } catch (e){
    console.log('/cards main exception:');
    console.log(e);
  }
});


router.post(`/messages`, async(request,response) => {
  let message = request.body;
  let personEmail = message.data.personEmail;
  if(personEmail.indexOf('@webex.bot') < 0 && personEmail.indexOf('@sparkbot.io') < 0){
    console.log('message created event:');
    console.log(message);
    let cardData = await prepareCard(message);
    if(message.data.roomType == "direct"){
      await sendCard(message, cardData);
    } else {
      let msg = 'For security reasons, this bot can only be used in a direct message space.'
      await sendWebexMessage(message.data.roomId, msg, cardData.token);
    }
  }
});


app.use("/", router);
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
