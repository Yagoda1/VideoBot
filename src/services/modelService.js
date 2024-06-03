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
    getModelById,
    updateModel,
    deleteModel,
    readModels, // Exporting for potential external usage,
    findModelImages
};
