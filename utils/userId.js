const { v4: uuidv4 } = require("uuid");

function generateUserId() {

    return "CRA-" + uuidv4().replace(/-/g, "").substring(0, 10).toUpperCase();

}

module.exports = generateUserId;