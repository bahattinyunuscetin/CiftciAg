/**
 * AI Model Client
 * 
 * Wrapper for interacting with Python-based AI models via child process.
 * Provides error handling and fallback strategies.
 */

const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const os = require('os');
const crypto = require('crypto');

class AIModelClient {
  constructor(config = {}) {
    this.pythonPath = config.pythonPath || process.env.PYTHON_PATH || 'python';
    this.modelPath = config.modelPath || process.env.IRRIGATION_MODEL_PATH || path.join(__dirname, '../ai_models/irrigation_model.pkl');
    this.scriptPath = config.scriptPath || path.join(__dirname, '../ai_models/irrigationPredictor.py');
    this.timeout = config.timeout || 5000; // 5 second timeout for model prediction
    
    // Verify script exists on startup
    this.checkScriptExists();
  }
  
  /**
   * Check if the Python script exists
   * @private
   */
  async checkScriptExists() {
    try {
      await fs.access(this.scriptPath);
      console.log(`AI model script found at ${this.scriptPath}`);
    } catch (error) {
      console.warn(`AI model script not found at ${this.scriptPath}. AI predictions will be unavailable.`);
    }
  }
  
  /**
   * Get irrigation prediction from AI model
   * @param {Object} weatherData - Current and forecast weather data
   * @param {string} cropType - Type of crop (rice, chili, banana, etc.)
   * @param {string} soilType - Type of soil (clay, loam, sandy, etc.)
   * @returns {Promise<Object>} Model prediction
   */
  async getIrrigationPrediction(weatherData, cropType = 'default', soilType = 'default') {
    try {
      // Check if the script exists
      await fs.access(this.scriptPath);
      
      // Create a temporary file to store weather data
      const tempFile = path.join(os.tmpdir(), `weather-${crypto.randomBytes(8).toString('hex')}.json`);
      await fs.writeFile(tempFile, JSON.stringify(weatherData), 'utf8');
      
      // Spawn Python process
      const result = await this.runPythonScript(tempFile, cropType, soilType);
      
      // Clean up temp file
      await fs.unlink(tempFile).catch(err => console.warn('Failed to delete temp file:', err));
      
      return result;
    } catch (error) {
      console.error('AI model prediction failed:', error.message);
      
      // Return null to indicate model failure (service should use rule-based fallback)
      return null;
    }
  }
  
  /**
   * Run the Python script as a child process
   * @private
   */
  runPythonScript(weatherFile, cropType, soilType) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(this.pythonPath, [
        this.scriptPath,
        '--weather', weatherFile,
        '--crop', cropType,
        '--soil', soilType,
        '--model', this.modelPath
      ]);
      
      let output = '';
      let errorOutput = '';
      const timeoutId = setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('AI model prediction timed out'));
      }, this.timeout);
      
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        
        if (code !== 0) {
          console.error(`Python process exited with code ${code}`);
          console.error('Error output:', errorOutput);
          return reject(new Error(`AI model exited with code ${code}: ${errorOutput}`));
        }
        
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          console.error('Failed to parse AI model output:', e);
          console.error('Raw output:', output);
          reject(new Error('Invalid output from AI model'));
        }
      });
      
      pythonProcess.on('error', (err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
    });
  }
}

// Export a singleton instance by default
const defaultClient = new AIModelClient();

module.exports = {
  AIModelClient,
  defaultClient
}; 