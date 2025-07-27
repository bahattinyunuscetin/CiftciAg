"""
Enhanced Irrigation Prediction Model

Features:
- Hybrid AI + rule-based predictions
- Weather data validation
- Detailed error handling
- Configurable crop/soil parameters
- Confidence scoring
"""

import os
import sys
import json
import argparse
import numpy as np
from datetime import datetime
import logging
from typing import Dict, Optional, Union

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('irrigation_model.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Constants
DEFAULT_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models/irrigation_model.pkl')
CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config/crop_params.json')

class IrrigationModel:
    def __init__(self, model_path: str = DEFAULT_MODEL_PATH):
        """Initialize the irrigation prediction model"""
        self.model_path = model_path
        self.model = None
        self.crop_params = self._load_crop_parameters()
        self.soil_params = {
            'clay': {'infiltration': 5, 'water_holding': 0.4},
            'loam': {'infiltration': 15, 'water_holding': 0.3},
            'sandy': {'infiltration': 25, 'water_holding': 0.15},
            'default': {'infiltration': 15, 'water_holding': 0.25}
        }
        
        try:
            self._load_model()
        except Exception as e:
            logger.warning(f"Model loading failed: {str(e)}. Using rule-based fallback.")

    def _load_crop_parameters(self) -> Dict:
        """Load crop-specific parameters from config file"""
        default_params = {
            'rice': {'water_req': 6.0, 'temp_range': (20, 35)},
            'chili': {'water_req': 4.5, 'temp_range': (18, 32)},
            'banana': {'water_req': 5.5, 'temp_range': (22, 38)},
            'default': {'water_req': 5.0, 'temp_range': (15, 35)}
        }
        
        try:
            if os.path.exists(CONFIG_PATH):
                with open(CONFIG_PATH, 'r') as f:
                    return json.load(f)
            return default_params
        except Exception as e:
            logger.error(f"Error loading crop parameters: {str(e)}")
            return default_params

    def _load_model(self):
        """Attempt to load the trained model"""
        try:
            # Placeholder for actual model loading
            # from joblib import load
            # self.model = load(self.model_path)
            logger.info("Model loading placeholder - using rule-based fallback")
            self.model = None
        except Exception as e:
            raise RuntimeError(f"Model loading failed: {str(e)}")

    def validate_weather_data(self, weather_data: Dict) -> bool:
        """Validate the structure of weather data"""
        required_fields = {
            'current': ['temperature', 'humidity', 'precipitation'],
            'daily': [['maxTemperature', 'minTemperature']]
        }
        
        try:
            if not isinstance(weather_data, dict):
                return False
                
            for section, fields in required_fields.items():
                if section not in weather_data:
                    return False
                    
                if isinstance(fields[0], list):
                    for subfields in fields:
                        if not any(f in weather_data[section][0] for f in subfields):
                            return False
                else:
                    for field in fields:
                        if field not in weather_data[section]:
                            return False
                            
            return True
        except Exception:
            return False

    def predict(self, weather_data: Dict, crop_type: str = 'default', soil_type: str = 'default') -> Dict:
        """
        Make irrigation prediction with hybrid approach
        
        Args:
            weather_data: Dictionary containing weather observations and forecast
            crop_type: Type of crop (e.g., 'rice', 'chili')
            soil_type: Type of soil (e.g., 'clay', 'loam')
            
        Returns:
            Dictionary containing prediction results
        """
        if not self.validate_weather_data(weather_data):
            logger.error("Invalid weather data structure")
            return self._rule_based_prediction(weather_data, crop_type, soil_type)
            
        try:
            # Try AI prediction first if model is available
            if self.model is not None:
                result = self._ai_prediction(weather_data, crop_type, soil_type)
                if result['confidence_score'] > 0.7:  # Only use if confident
                    return result
                    
            # Fall back to rule-based if AI not available or low confidence
            return self._rule_based_prediction(weather_data, crop_type, soil_type)
            
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            return self._emergency_fallback(crop_type)

    def _ai_prediction(self, weather_data: Dict, crop_type: str, soil_type: str) -> Dict:
        """Placeholder for actual AI prediction"""
        # In a real implementation, this would use the loaded model
        current = weather_data['current']
        daily = weather_data['daily'][0] if weather_data.get('daily') else current
        
        # Simulate AI prediction with environmental factors
        temp_factor = max(0, current['temperature'] / 30)
        rain_factor = max(0, 1 - (current['precipitation'] / 10))
        humidity_factor = 1 + ((50 - current['humidity']) / 100)
        
        crop = self.crop_params.get(crop_type, self.crop_params['default'])
        soil = self.soil_params.get(soil_type, self.soil_params['default'])
        
        base_duration = 30 * crop['water_req'] / 5.0
        adjusted_duration = base_duration * temp_factor * rain_factor * humidity_factor
        adjusted_duration *= (15 / soil['infiltration'])  # Adjust for soil
        
        return {
            'duration_minutes': max(0, round(adjusted_duration)),
            'confidence_score': 0.85,  # Simulated confidence
            'prediction_basis': 'AI_model',
            'algorithm_version': '1.0'
        }

    def _rule_based_prediction(self, weather_data: Dict, crop_type: str, soil_type: str) -> Dict:
        """Rule-based prediction fallback"""
        current = weather_data['current']
        daily = weather_data['daily'][0] if weather_data.get('daily') else current
        
        # Get parameters
        crop = self.crop_params.get(crop_type, self.crop_params['default'])
        soil = self.soil_params.get(soil_type, self.soil_params['default'])
        
        # Base duration calculation
        duration = 30 * (crop['water_req'] / 5.0)
        
        # Temperature adjustment
        temp = current['temperature']
        if temp > 32:
            duration *= 1.3
        elif temp < 20:
            duration *= 0.7
            
        # Precipitation adjustment
        if current['precipitation'] > 5:
            duration = 0
        elif current['precipitation'] > 2:
            duration *= 0.5
            
        # Humidity adjustment
        if current['humidity'] > 80:
            duration *= 0.8
        elif current['humidity'] < 40:
            duration *= 1.3
            
        # Soil adjustment
        duration *= (15 / soil['infiltration'])
        
        return {
            'duration_minutes': max(0, round(duration)),
            'confidence_score': 0.65,  # Lower confidence than AI
            'prediction_basis': 'rule_based',
            'algorithm_version': '1.0'
        }

    def _emergency_fallback(self, crop_type: str) -> Dict:
        """Emergency fallback when all else fails"""
        crop = self.crop_params.get(crop_type, self.crop_params['default'])
        duration = 30 * (crop['water_req'] / 5.0)
        
        return {
            'duration_minutes': max(0, round(duration)),
            'confidence_score': 0.5,
            'prediction_basis': 'emergency_fallback',
            'algorithm_version': '1.0'
        }

def main():
    parser = argparse.ArgumentParser(description='Irrigation Prediction System')
    parser.add_argument('--weather', required=True, help='Weather data JSON file or string')
    parser.add_argument('--crop', default='default', help='Crop type')
    parser.add_argument('--soil', default='default', help='Soil type')
    parser.add_argument('--output', help='Output file path')
    
    args = parser.parse_args()
    
    # Initialize model
    model = IrrigationModel()
    
    # Load weather data
    try:
        if os.path.exists(args.weather):
            with open(args.weather, 'r') as f:
                weather_data = json.load(f)
        else:
            weather_data = json.loads(args.weather)
    except Exception as e:
        logger.error(f"Weather data loading failed: {str(e)}")
        sys.exit(1)
    
    # Make prediction
    result = model.predict(weather_data, args.crop, args.soil)
    
    # Add timestamp
    result['timestamp'] = datetime.now().isoformat()
    
    # Output results
    output = json.dumps(result, indent=2)
    if args.output:
        with open(args.output, 'w') as f:
            f.write(output)
    else:
        print(output)

if __name__ == '__main__':
    main()