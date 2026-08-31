function generateUserId() {
    const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
    return `CRA-${randomNumber}`;
}

module.exports = generateUserId;
