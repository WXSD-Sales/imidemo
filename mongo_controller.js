var mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;
const MongoClient = mongodb.MongoClient;
const url = process.env.MONGO_URL;
let db;
let teamsCol;
let botsCol;
const client = MongoClient.connect(url, { useNewUrlParser: true })
                     .catch(err => { console.log(err); }).then((client) => {
                        //console.log(client);
                        db = client.db(process.env.MONGO_DB);
                        teamsCol = db.collection("teams");
                        botsCol = db.collection("bots");
                        console.log("Mongo Client Connected.")
                     });
//console.log(client);
//const db = 


module.exports = {
    findTeams : async function(personId, botId) {
        let res = null;
        try {
            let query = { person_id: personId, "$or": [{bot_id:null}, {bot_id:botId}] };
            res = await teamsCol.find(query);
        } catch (err) {
            console.log('findTeams error:');
            console.log(err);
        }
        return res
    },

    addTeam : async function(personId, title, number, botId) {
        let res = null;
        try {
            let doc = { person_id: personId, title: title, number:number, bot_id:botId };
            res = await teamsCol.insertOne(doc);
        } catch (err) {
            console.log('addTeam error:');
            console.log(err);
        }
        return res
    },

    deleteTeam : async function(_id) {
        let res = null;
        try {
            res = await teamsCol.deleteOne({_id: ObjectId(_id)});
        } catch (err) {
            console.log('deleteTeam error:');
            console.log(err);
        }
        return res
    },

    getBotByWebhook : async function(webhookId, resource) {
        let res = null;
        try {
            if(resource == "messages"){
                res = await botsCol.findOne({messages_webhook : webhookId});
            } else {
                res = await botsCol.findOne({cards_webhook : webhookId});
            }
        } catch (err) {
            console.log('getBotByWebhook error:');
            console.log(err);
        }
        return res
    },

    getBotByPersonId : async function(id) {
        let res = null;
        try {
            res = await botsCol.findOne({id : id});
        } catch (err) {
            console.log('getBotByPersonId error:');
            console.log(err);
        }
        return res
    },

    findBots : async function(personId) {
        let res = null;
        try {
            let query = { creator_id : personId };
            res = await botsCol.find(query);
        } catch (err) {
            console.log('findBots error:');
            console.log(err);
        }
        return res
    },

    addBot : async function(doc) {
        let res = null;
        try {
            res = await botsCol.insertOne(doc);
        } catch (err) {
            console.log('addBot error:');
            console.log(err);
        }
        return res
    },

    updateBot : async function(id, updateDoc) {
        let res = null;
        try {
            let query = { id: id };
            botsCol.updateOne(query, { $set: updateDoc }, function(err, result) {
              if (err) throw err;
              console.log("1 bot updated");
              res = result;
            });
        } catch (err) {
            console.log('updateBot error:');
            console.log(err);
        }
        return res
    },

    deleteBot : async function(_id) {
        let res = null;
        try {
            res = await botsCol.deleteOne({_id: ObjectId(_id)});
        } catch (err) {
            console.log('deleteBot error:');
            console.log(err);
        }
        return res
    }

}