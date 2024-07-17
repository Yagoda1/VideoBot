const fs = require('fs');
const path = require('path');

// Define the path to the JSON file
const filePath = path.join(__dirname, '../data/models.json');

// Read models from the JSON file
function readModels() {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data).models;
    } catch (err) {
        console.error('Error reading models from file:', err);
        return [];
    }
}

function isModel(chat_id) {
    try {
        const models = readModels();
        // Convert chat_id to string and check against stringified model.chatId
        const model = models.find(model => String(model.chatId) === String(chat_id));
        if (model) {
            console.log(`Chat ID ${chat_id} is a model.`);
            return true;
        } else {
            console.log(`Chat ID ${chat_id} is not a model.`);
            return false;
        }
    } catch (err) {
        console.error('Error checking if chat_id is a model:', err);
        return false;
    }
}


// Write models to the JSON file
function writeModels(models) {
    try {
        const data = JSON.stringify({ models }, null, 2);
        fs.writeFileSync(filePath, data, 'utf8');
    } catch (err) {
        console.error('Error writing models to file:', err);
    }
}

// Create a new model
function createModel(newModel) {
    const models = readModels();
    models.push(newModel);
    writeModels(models);
}

// Get a model by ID
function getModelById(id) {
    const models = readModels();
    return models.find(model => model.id == id);
}

// Get a model by chat_id
function getModelByChatId(chat_id) {
    const models = readModels();
    return models.find(model => model.chatId == chat_id);
}

// Update a model by ID
function updateModel(id, updatedModel) {
    let models = readModels();
    const index = models.findIndex(model => model.id === id);
    if (index !== -1) {
        models[index] = updatedModel;
        writeModels(models);
        return true;
    }
    return false;
}

// Delete a model by ID
function deleteModel(id) {
    let models = readModels();
    const filteredModels = models.filter(model => model.id !== id);
    if (models.length !== filteredModels.length) {
        writeModels(filteredModels);
        return true;
    }
    return false;
}

// Update the isAvailable field for a model by chatid
function updateModelAvailability(chat_id, isAvailable) {
    try {
        let models = readModels();
        const index = models.findIndex(model => String(model.chatId) === String(id));
        if (index !== -1) {
            models[index].isAvailable = isAvailable;
            writeModels(models);
            console.log(`Model ID ${id} availability updated to ${isAvailable}.`);
            return true;
        } else {
            console.log(`Model ID ${id} not found.`);
            return false;
        }
    } catch (err) {
        console.error('Error updating model availability:', err);
        return false;
    }
}

function findModelImages(modelId, basePath) {

    // This assumes you know the structure and number of images per model.
    let imagePaths = [];
    try {
        // List all files in the directory and filter out those that match the modelId
        fs.readdirSync(basePath).forEach(file => {
            if (file.startsWith(`model-${modelId}-`) && file.endsWith('.jpg')) {
                imagePaths.push(path.join(basePath, file));
            }
        });
    } catch (error) {
        console.error("Error reading images directory:", error);
    }

    return imagePaths;
}
module.exports = {
    createModel,
    isModel,
    getModelById,
    updateModel,
    deleteModel,
    readModels, // Exporting for potential external usage,
    findModelImages
};
