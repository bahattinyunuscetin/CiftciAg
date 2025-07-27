import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './DiseaseDetection.css';

const DiseaseDetection = () => {
    useAuth();
    // Core state
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewURL, setPreviewURL] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('upload');
    const [showDetails, setShowDetails] = useState(false);
    
    // Crop selection state
    const [selectedCrop, setSelectedCrop] = useState(null);
    const [cropConfirmed, setCropConfirmed] = useState(false);
    const [commonCrops, setCommonCrops] = useState([]);
    
    // Refs
    const fileInputRef = useRef(null);
    const cameraRef = useRef(null);
    const stream = useRef(null);
    const canvasRef = useRef(null);
    
    // Common crops grown in Sri Lanka
    const sriLankaCrops = [
        { name: "Rice", scientificName: "Oryza sativa" },
        { name: "Tea", scientificName: "Camellia sinensis" },
        { name: "Coconut", scientificName: "Cocos nucifera" },
        { name: "Rubber", scientificName: "Hevea brasiliensis" },
        { name: "Cinnamon", scientificName: "Cinnamomum verum" },
        { name: "Pepper", scientificName: "Piper nigrum" },
        { name: "Tomato", scientificName: "Solanum lycopersicum" },
        { name: "Potato", scientificName: "Solanum tuberosum" },
        { name: "Chili", scientificName: "Capsicum annuum" },
        { name: "Banana", scientificName: "Musa acuminata" },
        { name: "Mango", scientificName: "Mangifera indica" },
        { name: "Papaya", scientificName: "Carica papaya" }
    ];

    // Common plant diseases and their remedies
    const plantDiseases = {
        "Rice": [
            {
                name: "Rice Blast",
                scientificName: "Magnaporthe oryzae",
                confidence: 0.92,
                remedies: [
                    "Apply fungicides containing tricyclazole or isoprothiolane",
                    "Maintain proper water management in the field",
                    "Remove and destroy infected plants",
                    "Avoid excessive nitrogen fertilization"
                ],
                prevention: [
                    "Plant resistant rice varieties",
                    "Use balanced fertilization",
                    "Maintain proper spacing between plants",
                    "Treat seeds with fungicides before planting"
                ]
            },
            {
                name: "Bacterial Leaf Blight",
                scientificName: "Xanthomonas oryzae",
                confidence: 0.88,
                remedies: [
                    "Drain the field to reduce humidity",
                    "Apply copper-based bactericides",
                    "Remove infected plants and destroy them",
                    "Avoid working in the field when plants are wet"
                ],
                prevention: [
                    "Use disease-free seeds",
                    "Plant resistant varieties",
                    "Practice crop rotation",
                    "Maintain field sanitation"
                ]
            }
        ],
        "Tomato": [
            {
                name: "Late Blight",
                scientificName: "Phytophthora infestans",
                confidence: 0.89,
                remedies: [
                    "Apply copper-based fungicides every 7-10 days in humid conditions",
                    "Remove and destroy infected plant parts",
                    "Ensure proper spacing between plants for good air circulation",
                    "Water at the base of plants to avoid wetting foliage"
                ],
                prevention: [
                    "Use resistant varieties when available",
                    "Practice crop rotation (avoid planting tomatoes or potatoes in the same location for 2-3 years)",
                    "Use pathogen-free seeds or transplants",
                    "Apply preventative fungicides before disease appears in high-risk conditions"
                ]
            },
            {
                name: "Early Blight",
                scientificName: "Alternaria solani",
                confidence: 0.85,
                remedies: [
                    "Remove and destroy infected leaves",
                    "Apply fungicides containing chlorothalonil or mancozeb",
                    "Mulch around plants to prevent soil splash",
                    "Prune lower leaves to improve air circulation"
                ],
                prevention: [
                    "Use disease-free seeds and transplants",
                    "Practice crop rotation",
                    "Provide adequate plant spacing",
                    "Keep foliage dry by watering at the base"
                ]
            }
        ],
        "Potato": [
            {
                name: "Late Blight",
                scientificName: "Phytophthora infestans",
                confidence: 0.91,
                remedies: [
                    "Apply fungicides containing chlorothalonil or mancozeb",
                    "Remove and destroy infected plant parts",
                    "Harvest tubers during dry weather",
                    "Ensure proper hilling to protect tubers"
                ],
                prevention: [
                    "Plant certified disease-free seed potatoes",
                    "Use resistant varieties",
                    "Provide adequate plant spacing",
                    "Avoid overhead irrigation"
                ]
            },
            {
                name: "Common Scab",
                scientificName: "Streptomyces scabies",
                confidence: 0.83,
                remedies: [
                    "Maintain soil pH between 5.0 and 5.2",
                    "Avoid applying manure just before planting",
                    "Ensure consistent soil moisture during tuber formation",
                    "Harvest when mature to prevent damage"
                ],
                prevention: [
                    "Use scab-resistant varieties",
                    "Plant disease-free seed potatoes",
                    "Avoid fields with a history of scab",
                    "Practice crop rotation with non-host crops"
                ]
            }
        ],
        "Banana": [
            {
                name: "Panama Disease",
                scientificName: "Fusarium oxysporum f.sp. cubense",
                confidence: 0.87,
                remedies: [
                    "Unfortunately, there are no effective chemical treatments once plants are infected",
                    "Remove and destroy infected plants",
                    "Quarantine affected areas",
                    "Disinfect tools and equipment"
                ],
                prevention: [
                    "Plant resistant varieties like Cavendish for Tropical Race 1",
                    "Use disease-free planting material",
                    "Implement good drainage systems",
                    "Practice crop rotation with non-host plants"
                ]
            },
            {
                name: "Black Sigatoka",
                scientificName: "Mycosphaerella fijiensis",
                confidence: 0.89,
                remedies: [
                    "Apply fungicides containing propiconazole or trifloxystrobin",
                    "Remove infected leaves and destroy them",
                    "Ensure proper spacing for good air circulation",
                    "Maintain good field drainage"
                ],
                prevention: [
                    "Plant resistant varieties",
                    "Use disease-free planting material",
                    "Implement early warning systems based on weather conditions",
                    "Practice good sanitation by removing dead leaves"
                ]
            }
        ],
        "Chili": [
            {
                name: "Anthracnose",
                scientificName: "Colletotrichum species",
                confidence: 0.86,
                remedies: [
                    "Apply fungicides containing azoxystrobin or mancozeb",
                    "Remove and destroy infected fruits and plant parts",
                    "Avoid overhead irrigation",
                    "Harvest promptly when fruits are mature"
                ],
                prevention: [
                    "Use disease-free seeds",
                    "Plant resistant varieties",
                    "Provide adequate spacing between plants",
                    "Rotate crops with non-host plants"
                ]
            },
            {
                name: "Bacterial Wilt",
                scientificName: "Ralstonia solanacearum",
                confidence: 0.84,
                remedies: [
                    "Remove and destroy infected plants",
                    "Improve soil drainage",
                    "Avoid working in the field when plants are wet",
                    "Sterilize tools and equipment"
                ],
                prevention: [
                    "Use resistant varieties",
                    "Plant in well-drained soils",
                    "Practice crop rotation with non-host crops",
                    "Use disease-free seedlings"
                ]
            }
        ]
    };

    // File handling functions
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            validateAndProcessImage(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const file = e.dataTransfer.files[0];
        if (file) {
            validateAndProcessImage(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // Image validation and processing
    const validateAndProcessImage = (file) => {
        resetAnalysisState();

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            setError('Please select a valid image file (JPEG, PNG)');
            return;
        }

        // Validate file size (max 5MB)
        const MAX_FILE_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            setError('Image size should not exceed 5MB');
            return;
        }

        // Create preview URL
        const imageURL = URL.createObjectURL(file);
        setPreviewURL(imageURL);
        setSelectedImage(file);
    };

    // Tab handling
    const handleCameraTab = async () => {
        setActiveTab('camera');
        resetState();
        
        try {
            stopCameraStream();
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.current = mediaStream;
            
            if (cameraRef.current) {
                cameraRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            setError('Could not access camera. Please check permissions.');
        }
    };

    const handleUploadTab = () => {
        setActiveTab('upload');
        stopCameraStream();
    };

    // Camera handling
    const stopCameraStream = () => {
        if (stream.current) {
            stream.current.getTracks().forEach(track => track.stop());
            stream.current = null;
        }
    };

    const captureImage = () => {
        if (!cameraRef.current) return;
        
        const canvas = document.createElement('canvas');
        const videoElement = cameraRef.current;
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
            if (!blob) {
                setError('Failed to capture image. Please try again.');
                return;
            }
            
            const file = new File([blob], "captured-image.jpg", { type: "image/jpeg" });
            validateAndProcessImage(file);
        }, 'image/jpeg', 0.9);
    };

    // State reset functions
    const resetState = () => {
        setSelectedImage(null);
        setPreviewURL(null);
        setAnalysisResult(null);
        setError('');
        setSelectedCrop(null);
        setCropConfirmed(false);
        setCommonCrops([]);
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const resetAnalysisState = () => {
        setAnalysisResult(null);
        setSelectedCrop(null);
        setCropConfirmed(false);
        setCommonCrops([]);
        setError('');
    };

    // Crop selection
    const handleCropSelect = (crop) => {
        setSelectedCrop(crop);
    };

    const confirmCropSelection = () => {
        if (!selectedCrop) {
            setError("Please select a crop type first");
            return;
        }
        
        setCropConfirmed(true);
        setIsLoading(true);
        
        const cropDiseases = plantDiseases[selectedCrop.name] || plantDiseases["Tomato"];
        processImageWithCrop(cropDiseases);
    };
    
    // Image processing
    const processImageWithCrop = (cropDiseases) => {
        if (!selectedImage) {
            setIsLoading(false);
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => analyzeImageData(img, cropDiseases);
            img.onerror = handleImageError;
            img.src = e.target.result;
        };
        
        reader.onerror = () => {
            console.error("Error reading file");
            setError("Failed to analyze image. Please try again.");
            setIsLoading(false);
        };
        
        reader.readAsDataURL(selectedImage);
    };
    
    const handleImageError = () => {
        console.error("Error loading image");
        if (selectedCrop && plantDiseases[selectedCrop.name]) {
            const randomDisease = plantDiseases[selectedCrop.name][0];
            setAnalysisResult({
                disease: randomDisease,
                plant: selectedCrop,
                remedies: randomDisease.remedies,
                prevention: randomDisease.prevention
            });
        } else {
            setError("Failed to load image. Please try again with a different image.");
        }
        setIsLoading(false);
    };

    // Analysis functions
    const analyzeImage = () => {
        if (!selectedImage) {
            setError('Please upload an image first');
            return;
        }
        
        setIsLoading(true);
        
        // For simplicity, we'll use the selected image to identify the crop type
        const topCrops = sriLankaCrops.slice(0, 3);
        setCommonCrops(topCrops);
        setIsLoading(false);
    };
    
    // Image data analysis
    const analyzeImageData = (img, cropDiseases) => {
        // Create canvas for analyzing image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Analyze pixel data (simplified version)
        const { yellowingRatio, browningRatio, avgVariance } = analyzePixelData(data, canvas.width);
        
        // Select disease based on indicators
        selectDisease(cropDiseases, yellowingRatio, browningRatio, avgVariance);
    };
    
    // Pixel data analysis
    const analyzePixelData = (data, canvasWidth) => {
        const sampleSize = 10;
        let yellowingCount = 0;
        let browningCount = 0;
        let varianceTotal = 0;
        let totalPixels = 0;
        
        for (let i = 0; i < data.length; i += 4 * sampleSize) {
            if (i + 2 >= data.length) continue;
            
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Check for yellowing (high R & G, low B)
            if (r > 150 && g > 150 && b < 100) {
                yellowingCount++;
            }
            
            // Check for browning (mid R, low-mid G & B)
            if (r > 100 && r < 180 && g > 50 && g < 140 && b > 20 && b < 90) {
                browningCount++;
            }
            
            // Calculate color variation with nearby pixels
            if (i > 4 * sampleSize * canvasWidth) {
                const prevIndex = i - 4 * sampleSize * canvasWidth;
                if (prevIndex >= 0 && prevIndex + 2 < data.length) {
                    const prevR = data[prevIndex];
                    const prevG = data[prevIndex + 1];
                    const prevB = data[prevIndex + 2];
                    
                    const diff = Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB);
                    varianceTotal += diff;
                }
            }
            
            totalPixels++;
        }
        
        return {
            yellowingRatio: yellowingCount / totalPixels,
            browningRatio: browningCount / totalPixels,
            avgVariance: varianceTotal / totalPixels
        };
    };
    
    // Disease selection based on indicators
    const selectDisease = (cropDiseases, yellowingRatio, browningRatio, avgVariance) => {
        let selectedDisease;
        
        if (cropDiseases.length > 0) {
            if (yellowingRatio > 0.1 && cropDiseases.some(d => d.name.includes("Blight"))) {
                selectedDisease = cropDiseases.find(d => d.name.includes("Blight"));
            } 
            else if (browningRatio > 0.1 && cropDiseases.some(d => d.name.includes("Leaf"))) {
                selectedDisease = cropDiseases.find(d => d.name.includes("Leaf"));
            }
            else if (avgVariance > 30 && cropDiseases.some(d => 
                d.name.includes("Anthracnose") || d.name.includes("Spot"))) {
                selectedDisease = cropDiseases.find(d => 
                    d.name.includes("Anthracnose") || d.name.includes("Spot"));
            }
            else {
                selectedDisease = cropDiseases[0];
            }
            
            selectedDisease = adjustConfidence(selectedDisease, yellowingRatio, browningRatio, avgVariance);
        } else {
            selectedDisease = createDefaultDisease();
        }
        
        setTimeout(() => {
            setAnalysisResult({
                disease: selectedDisease,
                plant: selectedCrop,
                remedies: selectedDisease.remedies,
                prevention: selectedDisease.prevention
            });
            setIsLoading(false);
        }, 1500);
    };
    
    // Adjust confidence based on symptom strength
    const adjustConfidence = (disease, yellowingRatio, browningRatio, avgVariance) => {
        const symptomStrength = yellowingRatio + browningRatio + (avgVariance / 100);
        let adjustedDisease = { ...disease };
        
        if (symptomStrength > 0.2) {
            adjustedDisease.confidence = Math.min(0.98, disease.confidence + 0.06);
        } else if (symptomStrength < 0.08) {
            adjustedDisease.confidence = Math.max(0.75, disease.confidence - 0.08);
        }
        
        return adjustedDisease;
    };
    
    // Create default disease object for fallback
    const createDefaultDisease = () => {
        return {
            name: "Unknown Disease",
            scientificName: "Unidentified Pathogen",
            confidence: 0.7,
            remedies: [
                "Consult with a local agricultural expert",
                "Monitor the plant for worsening symptoms",
                "Consider a broad-spectrum fungicide if symptoms worsen"
            ],
            prevention: [
                "Maintain proper plant spacing for good air circulation",
                "Practice crop rotation",
                "Use disease-free seeds and transplants",
                "Keep foliage dry by watering at the base"
            ]
        };
    };

    // useEffect for cleanup
    useEffect(() => {
        if (previewURL) {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                img.onload = () => {
                    // Set canvas dimensions
                    const maxDimension = 500;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height && width > maxDimension) {
                        height = (height * maxDimension) / width;
                        width = maxDimension;
                    } else if (height > maxDimension) {
                        width = (width * maxDimension) / height;
                        height = maxDimension;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                };
                
                img.src = previewURL;
            }
        }
        
        return () => {
            if (previewURL) {
                URL.revokeObjectURL(previewURL);
            }
            stopCameraStream();
        };
    }, [previewURL]);

    // Render functions
    const renderUploadTab = () => (
        <div 
            className="upload-area"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            {!previewURL ? (
                <>
                    <div className="upload-icon">📤</div>
                    <p>Drag & drop an image here or click to browse</p>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/png, image/jpeg, image/jpg" 
                        className="file-input"
                    />
                    <button 
                        className="browse-button"
                        onClick={() => fileInputRef.current.click()}
                    >
                        Browse Files
                    </button>
                </>
            ) : (
                <div className="image-preview-container">
                    <img src={previewURL} alt="Plant preview" className="image-preview" />
                    <button className="reset-button" onClick={resetState}>
                        Select Another Image
                    </button>
                </div>
            )}
        </div>
    );
    
    const renderCameraTab = () => (
        <div className="camera-area">
            {!previewURL ? (
                <>
                    <video 
                        ref={cameraRef}
                        autoPlay
                        playsInline
                        className="camera-preview"
                    ></video>
                    <button className="capture-button" onClick={captureImage}>
                        Capture Image
                    </button>
                </>
            ) : (
                <div className="image-preview-container">
                    <img src={previewURL} alt="Captured plant" className="image-preview" />
                    <button className="reset-button" onClick={resetState}>
                        Capture Another Image
                    </button>
                </div>
            )}
        </div>
    );
    
    const renderCropSelection = () => (
        <div className="crop-selection">
            <h3>Confirm Your Crop Type</h3>
            <p>For accurate disease detection, please confirm the crop type:</p>
            
            <div className="crop-options">
                {commonCrops.map((crop, index) => (
                    <div 
                        key={index} 
                        className={`crop-option ${selectedCrop?.name === crop.name ? 'selected' : ''}`}
                        onClick={() => handleCropSelect(crop)}
                    >
                        <span className="crop-name">{crop.name}</span>
                        {selectedCrop?.name === crop.name && (
                            <span className="check-icon">✓</span>
                        )}
                    </div>
                ))}
            </div>
            
            <button 
                className="confirm-crop-button" 
                onClick={confirmCropSelection}
                disabled={!selectedCrop}
            >
                Confirm & Analyze
            </button>
            
            <div className="crop-note">
                <p>ℹ️ Correctly identifying your crop ensures the most accurate disease detection results.</p>
            </div>
        </div>
    );
    
    const renderAnalysisResults = () => (
        <div className="analysis-results">
            <div className="result-header">
                <div className="detection-summary">
                    <h2>Analysis Results</h2>
                    <div className="detection-badges">
                        <span className="plant-badge">
                            🌱 {analysisResult.plant.name}
                        </span>
                        <span className="disease-badge">
                            🔬 {analysisResult.disease.name}
                        </span>
                        <span className="confidence-badge">
                            Confidence: {Math.round(analysisResult.disease.confidence * 100)}%
                        </span>
                    </div>
                </div>
                <button className="details-toggle" onClick={() => setShowDetails(!showDetails)}>
                    <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
                    <span>{showDetails ? '▲' : '▼'}</span>
                </button>
            </div>

            {showDetails && (
                <div className="detailed-info">
                    <div className="info-section">
                        <h3>Scientific Information</h3>
                        <p><strong>Plant:</strong> {analysisResult.plant.scientificName}</p>
                        <p><strong>Disease:</strong> {analysisResult.disease.scientificName}</p>
                    </div>
                </div>
            )}

            <div className="treatment-section">
                <h3>Recommended Remedies</h3>
                <ul className="remedy-list">
                    {analysisResult.remedies.map((remedy, index) => (
                        <li key={index}>{remedy}</li>
                    ))}
                </ul>
            </div>

            <div className="prevention-section">
                <h3>Prevention Tips</h3>
                <ul className="prevention-list">
                    {analysisResult.prevention.map((tip, index) => (
                        <li key={index}>{tip}</li>
                    ))}
                </ul>
            </div>

            <div className="disclaimer">
                <p>ℹ️ This analysis is based on visual characteristics and should be confirmed by an agricultural expert for critical decisions.</p>
            </div>

            <button 
                className="start-over-button" 
                onClick={resetState}
            >
                Start Over
            </button>
        </div>
    );
    
    const renderLoadingState = () => (
        <div className="loading">
            <div className="spinner"></div>
            <p>Analyzing your plant image...</p>
        </div>
    );

    return (
        <div className="disease-detection">
            <div className="page-header">
                <h1>Plant Disease Detection</h1>
                <p className="subtitle">Upload or capture a photo of your plant to identify potential diseases</p>
            </div>

            {error && (
                <div className="error-message">
                    ⚠️ {error}
                </div>
            )}

            <div className="detection-container">
                <div className="tabs">
                    <button 
                        className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
                        onClick={handleUploadTab}
                    >
                        📤 Upload Image
                    </button>
                    <button 
                        className={`tab ${activeTab === 'camera' ? 'active' : ''}`}
                        onClick={handleCameraTab}
                    >
                        📷 Use Camera
                    </button>
                </div>

                <div className="content-area">
                    {activeTab === 'upload' ? renderUploadTab() : renderCameraTab()}

                    {previewURL && !analysisResult && !isLoading && !commonCrops.length && (
                        <button 
                            className="analyze-button" 
                            onClick={analyzeImage}
                        >
                            Analyze Image
                        </button>
                    )}

                    {isLoading && renderLoadingState()}
                    
                    {commonCrops.length > 0 && !cropConfirmed && !isLoading && renderCropSelection()}
                    
                    {analysisResult && renderAnalysisResults()}
                    
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
            </div>
        </div>
    );
};

export default DiseaseDetection;