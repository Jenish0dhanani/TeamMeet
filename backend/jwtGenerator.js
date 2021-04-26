const jwt = require("jsonwebtoken");

jwtSecret="jenish";

function jwtGenerator(id){
    const payload = {
        user:{
            id:id
        }
    }
    return jwt.sign(payload,jwtSecret);
}

module.exports = jwtGenerator;