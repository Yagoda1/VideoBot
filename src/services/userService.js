


// userService.js
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'users.json');
const { createCanvas } = require('canvas');
function readUsers() {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({ users: [] }, null, 2));
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data).users;
}

function writeUsers(users) {
    fs.writeFileSync(filePath, JSON.stringify({ users }, null, 2));
}

function isUserVerified(chatId) {
    const users = readUsers();
    const user = users.find(u => u.chatId === chatId);
    return user ? user.verified : false;
}

function markUserAsVerified(chatId) {
    const users = readUsers();
    const user = users.find(u => u.chatId === chatId);
    if (user) {
        user.verified = true;
        writeUsers(users);
    }
}
function generateVerificationCodeImage(code) {
    try {
        const canvas = createCanvas(200, 50);
        const ctx = canvas.getContext('2d');

        ctx.font = '30px Arial';
        ctx.fillStyle = 'black';
        ctx.fillText(code, 50, 35);

        return canvas.toBuffer('image/png');
    } catch (error) {
        console.error("Error generating the verification code image:", error);
    }

}



function generateVerificationCode(id) {
    try {
        const code = Math.floor(100000 + Math.random() * 900000);
        const imageBuffer = generateVerificationCodeImage(code);
        return { code, imageBuffer: imageBuffer };
    } catch (error) {
        console.error("Error generating or sending the verification code image:");
    }
}

function setPendingVerification(chatId, code) {
    const users = readUsers();
    const user = users.find(u => u.chatId === chatId);
    if (!user) {
        users.push({ chatId, verificationCode: code, verified: false });
    } else {
        user.verificationCode = code;
    }
    writeUsers(users);
}

function checkVerificationCode(chatId, inputCode) {
    const users = readUsers();
    const user = users.find(u => u.chatId === chatId);
    return user && user.verificationCode === inputCode;
}

// is User Pending Verification
function isUserPendingVerification(chatId) {
    const users = readUsers();
    const user = users.find(u => u.chatId === chatId);
    return user && user.verificationCode;
}

// getUserState
function getUserState(chatId) {
    const users = readUsers();
    const user = users.find(u => u.chatId === chatId);
    return user ? user?.state : null;
}


module.exports = {
    isUserVerified,
    markUserAsVerified,
    generateVerificationCode,
    setPendingVerification,
    isUserPendingVerification,
    checkVerificationCode,
    getUserState
};
// asdasd