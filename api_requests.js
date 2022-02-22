const got = require("got");

module.exports = {

    webexAPI : async function(path, token, data){
        url = `https://webexapis.com/v1/${path}`;
        let obj = {
            headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
            },
            method:"GET"
        }
        if(data !== undefined){
            obj.json = data;
            obj.method = "POST";
        }
        console.log(url);
        console.log(obj);
        return got(url, obj).json().catch((e)=>{
            console.log('webex API error');
            console.log(e);
        });
        //return result;
    },

    webexAPIDelete : async function(path, token){
        try {
            url = `https://webexapis.com/v1/${path}`;
            let obj = {
                headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
                },
                method:"DELETE"
            }
            console.log(url);
            console.log(obj);
            return got(url, obj).json();
        } catch(e) {
            console.log('webexAPIDelete Error:')
            console.log(e);
        }
    }

}