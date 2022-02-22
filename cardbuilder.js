module.exports = {
    cardbuilder : function () {
        return {
            "id":null,
            "token":process.env.WEBEX_ACCESS_TOKEN, 
            "url":process.env.DEFAULT_IMAGE_URL,
            "title":process.env.DEFAULT_CARD_TITLE,
            "instructions":true,
            "choices": "",
            "editButton": "",
            "deleteButton": "",
            "teams":"",
            "teamInstructions":""
           }
    }
  };
  