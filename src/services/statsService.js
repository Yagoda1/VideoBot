// statisticsService.js
const fs = require('fs');
const path = require('path');
const statsFilePath = path.join(__dirname, '../data/stats.json');
const { readModels } = require('./modelService');

function initStats() {
    if (!fs.existsSync(statsFilePath)) {
        fs.writeFileSync(statsFilePath, JSON.stringify([]));
    }
}

function logAction(actionType, userId, details = {}) {
    const stats = readStats();
    const timestamp = new Date().toISOString();
    stats.push({ actionType, userId, timestamp, details });
    fs.writeFileSync(statsFilePath, JSON.stringify(stats, null, 2));
}

function readStats() {
    if (!fs.existsSync(statsFilePath)) {
        fs.writeFileSync(statsFilePath, JSON.stringify([]));
    }
    const data = fs.readFileSync(statsFilePath, 'utf8');
    return JSON.parse(data);
}

function getFormattedStats() {
    const stats = readStats();
    return stats.map(stat => `Action: ${stat.actionType}, User ID: ${stat.userId}, Time: ${stat.timestamp}, Details: ${JSON.stringify(stat.details)}`).join('\n');
}

// ------------------------------------------ LOG FUNCTIONS --------------------------------------


// Example specific action logs
function logModelChatAction(message, model) { // DONE
    // get model details by ID
    console.log("model", model.name);
    const userInfo = message.from;
    logAction('model_chat', userInfo, { model });
}

function logCatalogAction(message) { // DONE
    // Get user 
    const username = message.from.username;
    console.log(" logCatalogAction username", username);
    logAction('catalog', username);
}

// log user start action

function logUserStartAction(msg) { // DONE
    const username = msg.from.username;
    console.log("logUserStartAction user", username);
    logAction('user_start', username);
}


// -----------------------------------------------------------------------------------

// Example for more specific analytical functions
function getMostActiveUser() {
    const stats = readStats();
    const userActivity = stats.reduce((acc, stat) => {
        acc[stat.userId] = acc[stat.userId] ? acc[stat.userId] + 1 : 1;
        return acc;
    }, {});
    const mostActiveUserId = Object.keys(userActivity).reduce((a, b) => userActivity[a] > userActivity[b] ? a : b);
    return mostActiveUserId;
}


// Get General Stats like total actions, unique users, etc.
function getGeneralStats() {
    const stats = readStats();
    const totalActions = stats.length;
    const uniqueUsers = new Set(stats.map(stat => stat.userId)).size;
    return { totalActions, uniqueUsers };
}

// Get Most Active User
function getMostActiveUser() {
    const stats = readStats();
    const userCounts = stats.reduce((acc, stat) => {
        acc[stat.userId] = (acc[stat.userId] || 0) + 1;
        return acc;
    }, {});
    const mostActiveUserId = Object.keys(userCounts).reduce((a, b) => userCounts[a] > userCounts[b] ? a : b);
    return mostActiveUserId;
}

// Get Most Active Time
function getMostActiveTime() {
    const stats = readStats();
    const hourCounts = stats.reduce((acc, stat) => {
        const hour = new Date(stat.timestamp).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
    }, {});
    const mostActiveHour = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b);
    return mostActiveHour;
}

// Get Most Active Day
function getMostActiveDay() {
    const stats = readStats();
    const dayCounts = stats.reduce((acc, stat) => {
        const day = new Date(stat.timestamp).getDay();
        acc[day] = (acc[day] || 0) + 1;
        return acc;
    }, {});
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mostActiveDayIndex = Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b);
    return daysOfWeek[mostActiveDayIndex];
}

// Get Detailed Action Stats
function getDetailedActionStats() {
    const stats = readStats();
    const actionDetails = stats.reduce((acc, stat) => {
        // Initialize the action type array if it doesn't exist
        if (!acc[stat.actionType]) {
            acc[stat.actionType] = [];
        }
        acc[stat.actionType].push(stat);
        return acc;
    }, {});

    // Construct a detailed and formatted string from the actionDetails object
    let formattedMessage = "Detailed Action Stats:\n";
    Object.keys(actionDetails).forEach(actionType => {
        formattedMessage += `\nAction Type: ${actionType}\n`;
        // Sort actions by timestamp
        actionDetails[actionType].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        // Add each action's details
        actionDetails[actionType].forEach(action => {
            formattedMessage += `   - At: ${action.timestamp}, User ID: ${action.userId}\n`;
        });
    });

    return formattedMessage;
}

// Most chosen model
function getMostChosenModel() {
    const stats = readStats();
    const modelCounts = stats.reduce((acc, stat) => {
        if (stat.actionType === 'model_chat') {
            acc[stat.details.model.id] = (acc[stat.details.model.id] || 0) + 1;
        }
        return acc;
    }, {});
    const mostChosenModelId = Object.keys(modelCounts).reduce((a, b) => modelCounts[a] > modelCounts[b] ? a : b);
    // return the model details
    const models = readModels();
    const mostChosenModel = models.find(model => model.id == mostChosenModelId);
    return mostChosenModel;
}

// General Stats for models
function getModelStats() {
    const stats = readStats();
    const modelStats = stats.reduce((acc, stat) => {
        if (stat.actionType === 'model_chat') {
            const modelId = stat.details.model.id;
            acc[modelId] = acc[modelId] ? acc[modelId] + 1 : 1;
        }
        return acc;
    }, {});
    // Get the model name for each model ID
    const models = readModels();
    Object.keys(modelStats).forEach(modelId => {
        const model = models.find(m => m.id == modelId);
        modelStats[model.name] = modelStats[modelId];
        delete modelStats[modelId];
    });
    // Sort the models by the number of times they were chosen
    const sortedModels = Object.keys(modelStats).sort((a, b) => modelStats[b] - modelStats[a]);
    // Construct a formatted message
    let formattedMessage = "Model Stats:\n";
    sortedModels.forEach(modelName => {
        formattedMessage += `   - ${modelName}: ${modelStats[modelName]}\n`;
    });

    return formattedMessage;
}

module.exports = {
    initStats,
    logAction,
    getFormattedStats,
    getMostActiveUser,
    getDetailedActionStats,
    logModelChatAction,
    logCatalogAction,
    getGeneralStats,
    getMostActiveTime,
    getMostActiveDay,
    getDetailedActionStats, logUserStartAction, getMostChosenModel, getModelStats

};
