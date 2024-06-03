// bot.js
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const messageService = require('./services/messageService');

const token = "7089203875:AAEAmYFKDS4W1EQDRjubZPvY4L5kDr3C1Dw";
var bot = new TelegramBot(token, { polling: true });

messageService.setupListeners(bot);  // Setup all event listeners


// Catch and log any errors
bot.on('polling_error', (error) => {
    console.error(error);  // Logs errors that occur during polling
});

bot.on('webhook_error', (error) => {
    console.error(error);  // Logs errors that occur during webhook operation
});