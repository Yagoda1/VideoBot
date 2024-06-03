const userService = require('./userService'); // Handles user data management
const strings = require('./stringsFile'); // Contains all user-facing strings
const modelService = require('./modelService'); // Handles model data management
const statisticsService = require('./statsService'); // Handles statistics logging
statisticsService.initStats(); // Ensure the statistics file is ready
function sendInitialMessage(bot, msg) {
    try {
        statisticsService.logUserStartAction(msg); // Log the catalog action
        const chatId = msg.chat.id;
        const messageText = strings.welcomeMessage; // Fetch the welcome message
        const options = getInitialOptions(chatId); // Get buttons based on user verification status
        bot.sendMessage(chatId, messageText, options);
    } catch (error) {
        console.error("Error in sendInitialMessage:", error);
    }
}

function getInitialOptions(chatId) {
    try {
        const baseButtons = [
            [{ text: strings.catalogButton, callback_data: 'catalog' }],
            [{ text: strings.helpButton, callback_data: 'help' }],
            [{ text: strings.contactButton, callback_data: 'contact' }]
        ];

        // // Conditionally add buttons based on user verification status
        // if (userService.isUserVerified(chatId)) {
        //     baseButtons.push([{ text: strings.joinButton, callback_data: 'join' }]);
        // } else {
        //     baseButtons.push([{ text: strings.verifyButton, callback_data: 'verify' }]);
        // }

        return {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: baseButtons }
        };
    } catch (error) {
        console.error("Error in getInitialOptions:", error);
    }
}

function handleVerificationProcess(bot, chatId) {
    try {
        console.log("handleVerificationProcess");
        const { code, imageBuffer } = userService.generateVerificationCode(chatId);
        console.log("code", code, "imageBuffer", imageBuffer);
        const messageText = strings.verificationMessage();
        bot.sendPhoto(chatId, imageBuffer, { filename: 'captcha.png', contentType: 'image/png' })
            .then(() => {
                userService.setPendingVerification(chatId, code);
            })
            .catch(error => console.error("Error in handleVerificationProcess sendPhoto:", error));
    } catch (error) {
        console.error("Error in handleVerificationProcess:", error);
    }
}
// handleHelpSelection
function handleHelpSelection(bot, message) {
    try {
        const messageText = strings.helpMessage;
        console.log("handleHelpSelection messageText", messageText);
        bot.sendMessage(message.chat.id, messageText, { parse_mode: 'HTML' });
    } catch (error) {
        console.error("Error in handleHelpSelection:", error);
    }
}


// handleContactSelection

function handleContactSelection(bot, message) {
    try {
        const messageText = strings.contactMessage;

        bot.sendMessage(message.chat.id, messageText, { parse_mode: 'HTML' });
    } catch (error) {
        console.error("Error in handleContactSelection:", error);
    }
}




// statisticsService.js
const adminUsernames = ['Mj45667', 'Q0dn2z', 'Ahlanahlan12'];  // Replace these with the actual usernames of your admins

function isAdmin(username) {
    console.log("stats username", username);
    return adminUsernames.includes(username);
}

function handleAdminStatsRequest(bot, msg) {
    // Check if the user is an admin by their username
    if (isAdmin(msg.from.username)) {
        const chatId = msg.chat.id;
        const options = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'General Stats', callback_data: 'stats_general' }],
                    [{ text: 'Most Active User', callback_data: 'stats_active_user' }],
                    [{ text: 'Most Active Time', callback_data: 'stats_active_time' }],
                    [{ text: 'Most Active Day', callback_data: 'stats_active_day' }],
                    [{ text: 'Detailed Actions', callback_data: 'stats_detailed_actions' }],
                    [{ text: 'Most Chosen Model', callback_data: 'stats_most_chosen_model' }],
                    [{ text: 'General Model Info', callback_data: 'stats_general_model_info' }]
                ]
            }
        };
        bot.sendMessage(chatId, 'Select a statistics option:', options);
    } else {
        bot.sendMessage(msg.chat.id, "You are not authorized to view stats.");
    }
}



function setupListeners(bot) {
    try {
        bot.onText(/\/start/, (msg) => {
            sendInitialMessage(bot, msg);
        });

        bot.on('callback_query', (query) => {
            const data = query.data;
            const chatId = query.message.chat.id;
            if (data.startsWith('select-')) {
                const modelId = data.split('-')[1];
                handleModelSelection(bot, query.message, modelId);
            } else if (data === 'pay_verification') {
                processVerificationPayment(bot, chatId);
            } else if (data === 'pay_full_call') {
                processFullCallPayment(bot, chatId);
            } else {
                switch (data) {
                    case 'catalog':
                        handleCatalogSelection(bot, query);
                        break;
                    case 'verify':
                        handleVerificationPayment(bot, chatId);
                        break;
                    case 'help':
                        handleHelpSelection(bot, query.message);
                        break;
                    case 'contact':
                        handleContactSelection(bot, query.message);
                        break;
                    case 'stats_general':
                        const generalStats = statisticsService.getGeneralStats();
                        bot.sendMessage(chatId, `Total Actions: ${generalStats.totalActions}\nUnique Users: ${generalStats.uniqueUsers}`);
                        break;
                    case 'stats_active_user':
                        const mostActiveUser = statisticsService.getMostActiveUser();
                        bot.sendMessage(chatId, `Most Active User ID: ${mostActiveUser}`);
                        break;
                    case 'stats_active_time':
                        const mostActiveTime = statisticsService.getMostActiveTime();
                        bot.sendMessage(chatId, `Most Active Hour: ${mostActiveTime}`);
                        break;
                    case 'stats_active_day':
                        const mostActiveDay = statisticsService.getMostActiveDay();
                        bot.sendMessage(chatId, `Most Active Day: ${mostActiveDay}`);
                        break;
                    case 'stats_detailed_actions':
                        const detailedStats = statisticsService.getDetailedActionStats();
                        bot.sendMessage(chatId, `Detailed Stats:\n\n${detailedStats}`);
                        break;
                    case 'stats_most_chosen_model':
                        const mostChosenModel = statisticsService.getMostChosenModel();
                        bot.sendMessage(chatId, `Most Chosen Model: ${mostChosenModel.name}`);
                        break;
                    case 'stats_general_model_info':
                        const formattedMessage = statisticsService.getModelStats();
                        bot.sendMessage(chatId, formattedMessage);
                        break;
                }
            }
        });

        bot.on('message', (msg) => {
            handleMessage(bot, msg);
        });

        bot.onText(/\/stats/, (msg) => {
            handleAdminStatsRequest(bot, msg);
        });

        bot.on('callback_query', (query) => {
            const data = query.data;
            if (data === 'stats') {
                handleAdminStatsRequest(bot, query);
            }
        });
    } catch (error) {
        console.error("Error in setupListeners:", error);
    }
}

function processVerificationPayment(bot, chatId) {
    // Implement payment processing logic here
    bot.sendMessage(chatId, "Verification payment received.");
    notifyUserForFullCallPayment(bot, chatId);
}

function processFullCallPayment(bot, chatId) {
    // Implement payment processing logic here
    bot.sendMessage(chatId, "Full call payment received.");
    // Transfer money to the model and notify both parties
    finalizePaymentAndNotify(bot, chatId);
}

function finalizePaymentAndNotify(bot, chatId) {
    const model = modelService.getModelByChatId(chatId);
    // Create a Telegram link to start a chat with the user
    const chatLink = `tg://user?id=${chatId}`;
    bot.sendMessage(model.chatId, `You have received payment from a user. Click [here](${chatLink}) to start the call.`);
    bot.sendMessage(chatId, "Payment transferred to the model. You can start the call now.");
}



//handleModelSelection
function handleModelSelection(bot, message, modelId) {
    try {
        console.log("Model selected");
        const model = modelService.getModelById(modelId);
        statisticsService.logModelChatAction(message, model);  // Log the action
        // Check if the model exists
        if (model) {
            const opts = {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{
                        text: "✍️ כתיבה למנהלת ✍️",  // "Write to Manager"
                        url: `https://t.me/Mj45667?start=${encodeURIComponent(model.name)}`  // Properly encoding to ensure valid URL
                    }]]
                }
            };
            // clear chat and send the model message with the inline keyboard
            notifyModelForVerification(bot, modelId, message);
            // clear all messages in the chat
            bot.sendMessage(message.chat.id, strings.shortModelMessage(model), opts);

        } else {
            // Handle case where no model is found
            bot.sendMessage(message.chat.id, "מודל לא נמצא.");  // "Model not found."
        }
    } catch (error) {
        console.error("Error in handleModelSelection:", error);
        bot.sendMessage(message.chat.id, "אירעה שגיאה במהלך בחירת הדגם.");  // "An error occurred while selecting the model."
    }
}

// handleCatalogSelection
async function handleCatalogSelection(bot, query) {
    try {
        const models = modelService.readModels(); // Fetch model data
        statisticsService.logCatalogAction(query); // Log the catalog action
        const message = query.message;
        // Iterate over each model asynchronously
        for (const model of models) {
            // Fetch the paths for all relevant images for the model
            const imageBasePath = 'data/images/';
            const imagePaths = modelService.findModelImages(model.id, imageBasePath);

            // Prepare media group array if there are images
            if (imagePaths.length > 0) {
                const mediaGroup = imagePaths.map(path => ({
                    type: 'photo',
                    media: path
                }));

                // Send all images as a media group and wait for it to finish
                await bot.sendMediaGroup(message.chat.id, mediaGroup);
            }

            // Once images are sent, send the detailed model message
            const modelDetails = strings.modelMessage(model);
            const opts = {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{ text: "התחל שיחה", callback_data: `select-${model.id}` }]]
                }
            };
            // 
            await bot.sendMessage(message.chat.id, modelDetails, opts);
        }
    } catch (error) {
        console.error("Error in handleCatalogSelection:", error);
    }
}








/// new 

function handleMessage(bot, msg) {
    const chatId = msg.chat.id;
    const userState = userService.getUserState(chatId);

    if (userState === "awaiting_captcha") {
        // Check if the message is a response to the CAPTCHA
        checkVerificationCode(bot, chatId, msg.text.trim());
    } else {
        // Handle other messages normally
        // This could involve checking if the message is a command, etc.
    }
}

function checkVerificationCode(bot, chatId, inputCode) {
    // Assuming checkVerificationCode function determines if the CAPTCHA is correct
    if (userService.checkVerificationCode(chatId, inputCode)) {
        bot.sendMessage(chatId, "CAPTCHA verified successfully!");
        userService.markUserAsVerified(chatId);
        userService.setUserState(chatId, null);  // Reset the state
    } else {
        bot.sendMessage(chatId, "Incorrect CAPTCHA, please try again!");
        // Optionally resend the CAPTCHA or give further instructions
    }
}

// V2

function handleVerificationPayment(bot, chatId) {
    try {
        const price = 10; // Verification price in shekels
        const messageText = `The verification call will cost ${price} shekels. Please confirm your payment.`;
        const options = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Pay Now', callback_data: 'pay_verification' }]
                ]
            }
        };
        bot.sendMessage(chatId, messageText, options);
    } catch (error) {
        console.error("Error in handleVerificationPayment:", error);
    }
}

function notifyModelForVerification(bot, modelId, message) {
    try {
        // Create a Telegram link to start a chat with the user
        const chatLink = `tg://user?id=${message.chatId}`;
        bot.sendMessage(modelId.chatId, `You have a verification call with user ${message.from.username}. Click [here](${chatLink}) to start the call.`);
        bot.sendMessage(message.chatId, "אנא המתן לשיחה מהדוגמנית.");

    } catch (error) {
        console.error("Error in notifyModelForVerification:", error);
    }
}   


function finalizePaymentAndNotify(bot, chatId) {
    const model = modelService.getModelByChatId(chatId);
    // Create a Telegram link to start a chat with the user
    const chatLink = `tg://user?id=${chatId}`;
    bot.sendMessage(model.chatId, `You have received payment from a user. Click [here](${chatLink}) to start the call.`);
    bot.sendMessage(chatId, "Payment transferred to the model. You can start the call now.");
}



function notifyUserForFullCallPayment(bot, chatId) {
    try {
        const price = 50; // Full call price in shekels
        const messageText = `The full call will cost ${price} shekels. Please confirm your payment.`;
        const options = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Pay Now', callback_data: 'pay_full_call' }]
                ]
            }
        };
        bot.sendMessage(chatId, messageText, options);
    } catch (error) {
        console.error("Error in notifyUserForFullCallPayment:", error);
    }
}



module.exports = {
    setupListeners
};
