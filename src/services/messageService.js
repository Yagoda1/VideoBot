const path = require('path');
const fs = require('fs');
const userService = require('./userService'); // Handles user data management
const strings = require('./stringsFile'); // Contains all user-facing strings
const modelService = require('./modelService'); // Handles model data management
const statisticsService = require('./statsService'); // Handles statistics logging
const selectedModels = {}; // For verification process
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
            console.log(chatId);
            const targetUsername = "Mj45667";
            const targetUser = bot.getChat(`@${targetUsername}`);
            console.log(targetUser.id);
            if (data.startsWith('select-')) {
                const modelId = data.split('-')[1];
                handleModelSelection(bot, query.message, modelId);
            } else if (data.startsWith('choose_call-')) {
                handleChooseCall(bot, query);
            } else if (data.startsWith('pay_confirm-')) {
                processFullCallPayment(bot, query);
            } else if (data.startsWith('bit-')) {
                handleCBitAction(bot, query);
            } else if (data === 'pay_verification') {
                processVerificationPayment(bot, chatId);
            } else if (data.startsWith('verification_done')) {
                const userchatId = data.split('_')[2];
                handleVerificationDone(bot, query.message, userchatId);
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

        bot.on('photo', (msg) => {
            handleImageUpload(bot, msg);
        });        
    } catch (error) {
        console.error("Error in setupListeners:", error);
    }
}

function processVerificationPayment(bot, chatId) {
    try {
        // Implement payment processing logic here
        bot.sendMessage(chatId, "התקבל תשלום עבור האימות.");
        
        // Get the selected model and username from memory
        const selection = selectedModels[chatId];
        if (!selection) {
            bot.sendMessage(chatId, "Error: No model selected.");
            return;
        }

        const model = modelService.getModelById(selection.modelId);
        
        if (model) {
            // Create a mock message object with the necessary information
            const mockMessage = {
                chat: { id: chatId },
                from: { username: selection.username }
            };

            // Notify the model for verification
            notifyModelForVerification(bot, model, mockMessage);
        } else {
            bot.sendMessage(chatId, "Error: No model found.");
        }
    } catch (error) {
        console.error("Error in processVerificationPayment:", error);
    }
}


function processFullCallPayment(bot, query) {
    const chatId = query.message.chat.id;
    // Implement payment processing logic here
    bot.sendMessage(chatId, "התקבל תשלום עבור שיחה מלאה.");
    // Transfer money to the model and notify both parties
    finalizePaymentAndNotify(bot, chatId);
}

function finalizePaymentAndNotify(bot, chatId) {
    const selection = selectedModels[chatId];
    if (!selection) {
        bot.sendMessage(chatId, "Error: No model selected.");
        return;
    }
    const model = modelService.getModelById(selection.modelId);
    // Create a Telegram link to start a chat with the user
    const chatLink = `tg://user?id=${chatId}`;
    const messageText = `You have received payment from a user.`;
    const keyboard = {
        inline_keyboard: [[{ text: "Start Call", url: chatLink }]]
    };
    const options = {
        parse_mode: "Markdown",
        reply_markup: JSON.stringify(keyboard)
    };
    bot.sendMessage(model.chatId, messageText, options);
    bot.sendMessage(chatId, "אנא המתן, הדוגמנית תתקשר אלייך בעוד רגע.");

    // url: `https://t.me/Mj45667?start=${encodeURIComponent(model.name)}`  // Properly encoding to ensure valid URL
}



//handleModelSelection
function handleModelSelection(bot, message, modelId) {
    try {
        console.log("Model selected");
        const model = modelService.getModelById(modelId);
        statisticsService.logModelChatAction(message, model);  // Log the action
        // Check if the model exists
        if (model) {
            selectedModels[message.chat.id] = {
                modelId: modelId,
                username: message.from.username,
                bitImage: false
            };
            const opts = {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[{
                        text: "התחל שיחת אימות", 
                        callback_data: 'verify'  // Trigger the 'verify' callback
                    }]]
                }
            };
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
        const messageText = `שיחת האימות תעלה ${price} שקלים. אנא אשר את התשלום.`;
        const options = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'שילמתי', callback_data: 'pay_verification' }]
                ]
            }
        };
        bot.sendMessage(chatId, messageText, options);
    } catch (error) {
        console.error("Error in handleVerificationPayment:", error);
    }
}

function notifyModelForVerification(bot, model, message) {
    try {
        // Create a Telegram link to start a chat with the user
        const userChatLink = `tg://user?id=${message.chat.id}`;
        const modelMessageText = `You have received payment from a user. Click to start the call.`;
        const modelKeyboard = {
            inline_keyboard: [[{ text: "Start Call", url: userChatLink }]]
        };
        const modelOptions = {
            parse_mode: "Markdown",
            reply_markup: JSON.stringify(modelKeyboard)
        };
        bot.sendMessage(model.chatId, modelMessageText, modelOptions);

        const userMessageText = `Click when you are done.`;
        const userKeyboard = {
            inline_keyboard: [[{ text: "Verification Call Done", callback_data: `verification_done_${message.chat.id}` }]]
        };
        const userOptions = {
            parse_mode: "Markdown",
            reply_markup: JSON.stringify(userKeyboard)
        };
        bot.sendMessage(model.chatId, userMessageText, userOptions);

        bot.sendMessage(message.chat.id, "אנא המתן, הדוגמנית תתקשר אלייך בעוד רגע.");
    } catch (error) {
        console.error("Error in notifyModelForVerification:", error);
    }
}


function notifyUserForFullCallPayment(bot, chatId) {
    try {

        // Get the selected model and username from memory
        const selection = selectedModels[chatId];
        if (!selection) {
            bot.sendMessage(chatId, "Error: No model selected.");
            return;
        }

        const model = modelService.getModelById(selection.modelId);
        if (!model) {
            bot.sendMessage(chatId, "Error: Model not found.");
            return;
        }

        const videoCalls = [];

        // Check the mainService
        if (model.mainService && model.mainService.description === "שיחת וידאו") {
            videoCalls.push({
                duration: model.mainService.duration,
                price: model.mainService.price
            });
        }

        // Check the moreServices
        if (model.moreServices && Array.isArray(model.moreServices)) {
            model.moreServices.forEach(service => {
                if (service.description === "שיחת וידאו") {
                    videoCalls.push({
                        duration: service.duration,
                        price: service.price
                    });
                }
            });
        }

        // Extract durations and prices into an array
        const videoCallDetails = videoCalls.map(call => ({
            duration: call.duration.match(/\d+/)[0],
            price: call.price.match(/\d+/)[0]
        }));

        // Create inline keyboard options
        const options = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: videoCallDetails.map(call => {
                    return [{ text: `משך השיחה: ${call.duration} דקות, מחיר: ${call.price} ₪`, callback_data: `choose_call-${call.duration}-${call.price}` }];
                })
            }
        };

        const messageText = 'בחר את משך השיחה ומחיר:';
        bot.sendMessage(chatId, messageText, options);
    } catch (error) {
        console.error("Error in notifyUserForFullCallPayment:", error);
    }
}

// After the model clicks the she is done with the verification call
function handleVerificationDone(bot, message, chatId) {
    try {
        notifyUserForFullCallPayment(bot, chatId);
        bot.sendMessage(message.chat.id, "The user has been notified to proceed with the full call payment.");
    } catch (error) {
        console.error("Error in handleVerificationDone:", error);
    }
}

// Handler for 'choose_call' callback data
function handleChooseCall(bot, query) {
    const chatId = query.message.chat.id;
    const [_, duration, price] = query.data.split('-');
    const selection = selectedModels[chatId];
    selection.bitImage = true;

    const messageText = `בחרת בשיחה של ${duration} דקות במחיר של ${price} שקלים. יש להעביר בביט למספר 0539238949, לשלוח צילום מסך ולאחר מכן ללחוץ על 'שילמתי'.`;
    const options = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: 'שילמתי', callback_data: `pay_confirm-${duration}-${price}` }]
            ]
        }
    };
    bot.sendMessage(chatId, messageText, options);
}

// Handler for 'bit' callback data, after admin proved/disaprroved payment
function handleBitAction(bot, query) {
    const chatId = query.message.chat.id;
    const [_, duration, price] = query.data.split('-');
    const selection = selectedModels[chatId];
    selection.bitImage = true;

    const messageText = `בחרת בשיחה של ${duration} דקות במחיר של ${price} שקלים. יש להעביר בביט למספר 0539238949, לשלוח צילום מסך ולאחר מכן ללחוץ על 'שילמתי'.`;
    const options = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: 'שילמתי', callback_data: `pay_confirm-${duration}-${price}` }]
            ]
        }
    };
    bot.sendMessage(chatId, messageText, options);
}

// Function to handle image upload
async function handleImageUpload(bot, msg) {
    const chatId = msg.chat.id;
    const selection = selectedModels[chatId];
    if (!selection) {
        bot.sendMessage(chatId, "Error: No model selected.");
        return;
    }

    const model = modelService.getModelById(selection.modelId);
    if (!model) {
        bot.sendMessage(chatId, "Error: Model not found.");
        return;
    }

    if(!selection.bitImage) {
        bot.sendMessage(chatId, "אין לשלוח תמונות.");
        return;
    }

    if (msg.photo && msg.photo.length > 0) {
        const photo = msg.photo[msg.photo.length - 1]; // Get the highest resolution photo
        const fileId = photo.file_id;
        const timestamp = new Date().toISOString().replace(/[-:.]/g, '').replace('T', '-').slice(0, 15);
        const newFileName = `${chatId}-${model.id}-${timestamp}.jpg`;
        //const filePath = path.join(__dirname, 'data/screenshots', newFileName);
        const filePath = path.join(__dirname, '../../data/screenshots', newFileName);

        try {
            const file = await bot.getFile(fileId);
            const fileStream = bot.getFileStream(fileId);
            const writeStream = fs.createWriteStream(filePath);
            fileStream.pipe(writeStream);
            writeStream.on('finish', () => {    
                console.log(`File saved as ${newFileName}`);
                bot.sendMessage(chatId, 'התמונה נשמרה בהצלחה. נא להתמין לאישור תשלום.');
                selection.bitImage = false;

                // Send the image to the specified username
                /*const targetUsername = "Mj45667";
                try {
                    const targetUser = await bot.getChat(`@${targetUsername}`);
                    await bot.sendPhoto(targetUser.id, filePath, { caption: 'התקבלה תמונה מהמשתמש' });
                    console.log(`Image sent to ${targetUsername}`);
                } catch (error) {
                    console.error(`Error sending image to ${targetUsername}:`, error);
                    bot.sendMessage(chatId, `שגיאה בשליחת התמונה ל-${targetUsername}.`);
                }*/
            });
        } catch (error) {
            console.error('Error saving photo:', error);
            bot.sendMessage(chatId, 'שגיאה בשמירת התמונה.');
        }
    } else {
        bot.sendMessage(chatId, "אנא שלח תמונה.");
    }
}

module.exports = {
    setupListeners
};
