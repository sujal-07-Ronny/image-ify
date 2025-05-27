import { useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';

const ImageGenerator = () => {
    const {
        credit,
        generateImage,
        generatedImage,
        generationPrompt,
        generationHistory,
        isGenerating,
    } = useContext(AppContext);

    const [prompt, setPrompt] = useState('');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [activeTab, setActiveTab] = useState('generate');
    const [stylePreset, setStylePreset] = useState('realistic');
    const [aspectRatio, setAspectRatio] = useState('square');
    const [activeFilter, setActiveFilter] = useState('none');
    const [showPromptWizard, setShowPromptWizard] = useState(false);
    const [promptCategory, setPromptCategory] = useState('landscape');
    const [promptAttributes, setPromptAttributes] = useState([]);
    const [enhancement, setEnhancement] = useState('none');

    const imageRef = useRef(null);
    const baseEditImageSrcRef = useRef(null);
    const liveCanvasRef = useRef(null);
    const tempCanvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const debounceTimerRef = useRef(null);
    const adjustmentsStateRef = useRef({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        temperature: 0,
        highlights: 0,
        shadows: 0,
        clarity: 0,
        vignette: 0,
        flipHorizontal: false,
        flipVertical: false
    });

    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [temperature, setTemperature] = useState(0);
    const [highlights, setHighlights] = useState(0);
    const [shadows, setShadows] = useState(0);
    const [clarity, setClarity] = useState(0);
    const [vignette, setVignette] = useState(0);
    const [flipHorizontal, setFlipHorizontal] = useState(false);
    const [flipVertical, setFlipVertical] = useState(false);

    const [isProcessing, setIsProcessing] = useState(false);
    const [historySearchTerm, setHistorySearchTerm] = useState('');
    const [historySortOrder, setHistorySortOrder] = useState('date_desc');
    const [historyFilterStyle, setHistoryFilterStyle] = useState('all');

    const stylePresets = [
        { id: 'realistic', name: 'Photorealistic 🖼️', prompt: 'hyper realistic, 8k, ultra detailed' },
        { id: 'anime', name: 'Anime 🎌', prompt: 'anime style, vibrant colors, detailed background' },
        { id: 'oil-painting', name: 'Oil Painting 🎨', prompt: 'oil painting, brush strokes visible, artistic' },
        { id: 'cyberpunk', name: 'Cyberpunk 🌆', prompt: 'cyberpunk style, neon lights, futuristic city' },
        { id: 'fantasy', name: 'Fantasy 🏰', prompt: 'fantasy art, magical, ethereal lighting' },
        { id: 'watercolor', name: 'Watercolor 🌊', prompt: 'watercolor painting, soft edges, pastel colors' },
    ];

    const aspectRatios = [
        { id: 'square', name: 'Square (1:1)', width: 512, height: 512 },
        { id: 'portrait', name: 'Portrait (3:4)', width: 512, height: 682 },
        { id: 'landscape', name: 'Landscape (16:9)', width: 1024, height: 576 },
        { id: 'ultrawide', name: 'Ultrawide (21:9)', width: 1024, height: 438 },
    ];

    const promptCategories = [
        { id: 'landscape', name: 'Landscape' },
        { id: 'portrait', name: 'Portrait' },
        { id: 'animal', name: 'Animal' },
        { id: 'fantasy', name: 'Fantasy' },
        { id: 'cars', name: 'Car' },
        { id: 'food', name: 'Food' },
    ];

    const promptAttributesByCategory = {
        landscape: ['mountains', 'beach', 'forest', 'desert', 'waterfall', 'sunset', 'night', 'autumn', 'winter'],
        portrait: ['elderly', 'child', 'warrior', 'scientist', 'cyborg', 'viking', 'royalty', 'punk', 'mystical'],
        animal: ['lion', 'dragon', 'wolf', 'eagle', 'octopus', 'butterfly', 'dinosaur', 'cat', 'unicorn'],
        fantasy: ['castle', 'wizard', 'fairy', 'dungeon', 'magic portal', 'enchanted forest', 'sky city', 'underwater kingdom'],
        cars: ['BMW M5', 'Lamborghini', 'Mercedes', 'Porsche', 'Aston Martin', 'Rolls-Royce', 'Pagani', 'Bugatti','Ferrari'],
        food: ['cake', 'sushi', 'pizza', 'burger', 'fruit', 'chocolate', 'steak', 'red sauce paasta', 'breakfast']
    };

    const promptSuggestions = [
        "A futuristic city at night 🌃 with neon lights and flying cars",
        "A majestic dragon 🐉 flying over snow-capped mountains at sunset",
        "Surreal forest 🌳 with glowing trees and floating islands",
        "Cyberpunk street scene 🤖 with rain reflections and holograms",
    ];

    // Get current aspect ratio dimensions
    const getCurrentAspectRatioDimensions = useCallback(() => {
        const selectedRatio = aspectRatios.find(r => r.id === aspectRatio) || aspectRatios[0];
        return {
            width: selectedRatio.width,
            height: selectedRatio.height,
            ratio: selectedRatio.width / selectedRatio.height
        };
    }, [aspectRatio]);

    // Initialize canvases on mount
    useEffect(() => {
        liveCanvasRef.current = document.createElement('canvas');
        tempCanvasRef.current = document.createElement('canvas');
        
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const applyFilter = useCallback((filter) => {
        const imgElement = document.getElementById('generated-image-display');
        if (!imgElement) return;
        
        let filterStyle = 'none';
        switch (filter) {
            case 'vintage': filterStyle = 'sepia(0.7) contrast(1.2) brightness(0.9) saturate(1.3)'; break;
            case 'blackwhite': filterStyle = 'grayscale(100%) contrast(1.2)'; break;
            case 'sepia': filterStyle = 'sepia(1)'; break;
            case 'clarendon': filterStyle = 'contrast(1.2) saturate(1.35) brightness(1.1)'; break;
            case 'moon': filterStyle = 'grayscale(100%) contrast(1.1) brightness(1.1)'; break;
            case 'lark': filterStyle = 'contrast(0.9) brightness(1.1) saturate(1.1)'; break;
            case 'reyes': filterStyle = 'sepia(0.4) contrast(1.1) brightness(1.1) saturate(1.1)'; break;
            default: filterStyle = 'none';
        }
        imgElement.style.filter = filterStyle;
    }, []);

    const applyEnhancement = useCallback((enhance) => {
        const imgElement = document.getElementById('generated-image-display');
        if (!imgElement) return;
        
        let filterStyle = 'none';
        switch (enhance) {
            case 'sharpen': filterStyle = 'contrast(1.2)'; break;
            case 'brighten': filterStyle = 'brightness(1.2)'; break;
            case 'contrast': filterStyle = 'contrast(1.5)'; break;
            case 'warm': filterStyle = 'sepia(0.3) saturate(1.2)'; break;
            case 'cool': filterStyle = 'hue-rotate(180deg) brightness(1.1)'; break;
            default: filterStyle = 'none';
        }
        imgElement.style.filter = filterStyle;
    }, []);

    const generatePromptFromWizard = useCallback(() => {
        if (promptAttributes.length === 0) {
            toast.warn("Please select at least one attribute.");
            return;
        }
        
        const styleEnhancers = {
    landscape: "ultra-detailed, 8K, HDR, golden hour lighting, cinematic composition",
    portrait: "studio lighting, 85mm lens, bokeh background, hyper-detailed skin texture",
    animal: "wildlife photography, telephoto lens, shallow depth of field, dynamic action shot",
    fantasy: "concept art style, digital painting, intricate details, unreal engine 5",
    cars: "photorealistic, glossy finish, studio lighting or natural reflections, low angle shot, ultra-detailed, cinematic background, 8K resolution, car magazine style",
    food: "commercial photography, soft diffused lighting, high detail texture, appetizing"
};

        
        const qualityBoosters = ["award-winning", "highest quality", "masterpiece", "ultra-realistic", "4K resolution"];
        let basePrompt = '';
        const selectedCategoryDetails = promptCategories.find(c => c.id === promptCategory) || promptCategories[0];
        const attributesString = promptAttributes.join(', ');
        const currentEnhancer = styleEnhancers[promptCategory] || styleEnhancers.landscape;
        const currentBooster = qualityBoosters[Math.floor(Math.random() * qualityBoosters.length)];
        basePrompt = `A breathtaking ${attributesString} ${selectedCategoryDetails.name.toLowerCase()}, ${currentEnhancer}, ${currentBooster}`;
        const artisticStyles = ["in the style of Studio Ghibli", "Pixar animation style", "photorealistic CGI", "oil painting technique"];
        const randomStyle = artisticStyles[Math.floor(Math.random() * artisticStyles.length)];
        
        setPrompt(`${basePrompt}, ${randomStyle}`);
        setShowPromptWizard(false);
        //toast.success("Prompt generated and applied!");
    }, [promptAttributes, promptCategory]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!prompt.trim()) {
            //toast.error("Prompt cannot be empty.");
            return;
        }
        if (credit <= 0) {
            //toast.error("You are out of credits!");
            return;
        }
        
        let finalPrompt = prompt;
        const selectedPreset = stylePresets.find(p => p.id === stylePreset);
        if (selectedPreset && stylePreset !== 'realistic') {
            finalPrompt = `${selectedPreset.prompt}, ${prompt}`;
        }
        const selectedRatio = aspectRatios.find(r => r.id === aspectRatio);
        await generateImage(finalPrompt, selectedRatio);
    }, [prompt, credit, stylePreset, aspectRatio, generateImage]);

    const enterFullscreen = useCallback(() => {
        const imgElement = document.getElementById('generated-image-display');
        if (imgElement && imgElement.requestFullscreen) {
            imgElement.requestFullscreen();
        } else if (imageRef.current && imageRef.current.requestFullscreen) {
            imageRef.current.requestFullscreen();
        }
    }, []);

    const printImage = useCallback(async () => {
        const imageToPrint = activeTab === 'edit' && imageRef.current ? imageRef.current.src : generatedImage;
        if (!imageToPrint || imageToPrint.startsWith('data:image/gif')) {
           // toast.error("No image to print.");
            return;
        }
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`<html><head><title>Print Image</title></head><body style="display:flex;justify-content:center;align-items:center;margin:0;height:100vh;"><img src="${imageToPrint}" style="max-width:100%;max-height:100vh;object-fit:contain;" /></body></html>`);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 500);
    }, [activeTab, generatedImage]);

    const openLightbox = useCallback((imageSrc) => {
        setSelectedImage(imageSrc);
        setLightboxOpen(true);
    }, []);

    const exportHistory = useCallback(() => {
        if (!generationHistory || generationHistory.length === 0) {
            //toast.warn("No history to export.");
            return;
        }
        
        const dataStr = JSON.stringify(generationHistory, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `generation-history-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
        //toast.success("History exported!");
    }, [generationHistory]);

    const formatDate = useCallback((dateString) => {
        if (!dateString) return //'Unknown date';
        try {
            const date = new Date(dateString);
            return date.toLocaleString();
        } catch (e) {
           // return 'Unknown date';
        }
    }, []);

    const applyAllAdjustmentsToContext = useCallback((ctx, canvasWidth, canvasHeight, adjustments) => {
        const bcstFilter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`;
        
        if (bcstFilter !== 'brightness(100%) contrast(100%) saturate(100%)') {
            const tempCtx = tempCanvasRef.current.getContext('2d');
            tempCanvasRef.current.width = canvasWidth;
            tempCanvasRef.current.height = canvasHeight;
            
            tempCtx.filter = bcstFilter;
            tempCtx.drawImage(ctx.canvas, 0, 0);
            tempCtx.filter = 'none';
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.drawImage(tempCanvasRef.current, 0, 0);
        }

        const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        const data = imageData.data;

        if (adjustments.temperature !== 0) {
            const tempShift = adjustments.temperature;
            for (let i = 0; i < data.length; i += 4) {
                if (tempShift > 0) {
                    data[i] = Math.min(255, data[i] + tempShift * 0.30);
                    data[i+1] = Math.min(255, data[i+1] + tempShift * 0.15);
                } else {
                    data[i+2] = Math.min(255, data[i+2] - tempShift * 0.30);
                }
            }
        }

        if (adjustments.highlights !== 0 || adjustments.shadows !== 0) {
            const hFactor = adjustments.highlights / 100;
            const sFactor = adjustments.shadows / 100;

            for (let i = 0; i < data.length; i += 4) {
                let r = data[i], g = data[i+1], b = data[i+2];
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

                if (hFactor !== 0) {
                    const highlightBoost = hFactor * (luminance / 255) * 100;
                    r += highlightBoost; g += highlightBoost; b += highlightBoost;
                }
                if (sFactor !== 0) {
                    const shadowBoost = sFactor * (1 - luminance / 255) * 100;
                    r += shadowBoost; g += shadowBoost; b += shadowBoost;
                }
                
                data[i] = Math.max(0, Math.min(255, r));
                data[i+1] = Math.max(0, Math.min(255, g));
                data[i+2] = Math.max(0, Math.min(255, b));
            }
        }
        
        ctx.putImageData(imageData, 0, 0);

        if (adjustments.clarity !== 0) {
            const clarityAmount = adjustments.clarity / 100;
            const tempCtx = tempCanvasRef.current.getContext('2d');
            tempCanvasRef.current.width = canvasWidth;
            tempCanvasRef.current.height = canvasHeight;
            
            if (clarityAmount > 0) {
                tempCtx.filter = `contrast(${1 + clarityAmount * 0.25}) brightness(${1 + clarityAmount * 0.01})`;
            } else {
                tempCtx.filter = `blur(${Math.abs(clarityAmount) * 0.75}px)`;
            }
            
            tempCtx.drawImage(ctx.canvas, 0, 0);
            tempCtx.filter = 'none';
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.drawImage(tempCanvasRef.current, 0, 0);
        }
        
        if (adjustments.vignette > 0) {
            const vigAmount = adjustments.vignette / 100;
            const centerX = canvasWidth / 2;
            const centerY = canvasHeight / 2;
            const outerRadius = Math.sqrt(centerX * centerX + centerY * centerY);
            const innerRadiusRatio = 1 - vigAmount * 0.85;
            const innerRadius = outerRadius * Math.max(0.05, innerRadiusRatio);

            const radialGradient = ctx.createRadialGradient(
                centerX, centerY, innerRadius,
                centerX, centerY, outerRadius
            );
            radialGradient.addColorStop(0, 'rgba(0,0,0,0)');
            radialGradient.addColorStop(0.5, `rgba(0,0,0,${vigAmount * 0.35})`);
            radialGradient.addColorStop(1, `rgba(0,0,0,${vigAmount * 0.75})`);
            
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = radialGradient;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.globalCompositeOperation = 'source-over';
        }
    }, []);

    // Optimized to reduce lag by using a state reference and batching updates
    const applyLiveAdjustmentsToPreview = useCallback(() => {
        if (!imageRef.current || !baseEditImageSrcRef.current || baseEditImageSrcRef.current.startsWith('data:image/gif')) {
            if (imageRef.current) {
                imageRef.current.src = baseEditImageSrcRef.current || generatedImage || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                imageRef.current.style.filter = '';
                imageRef.current.style.transform = '';
                imageRef.current.style.boxShadow = '';
            }
            return;
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
            const baseImage = new Image();
            baseImage.crossOrigin = "Anonymous";
            
            baseImage.onload = () => {
                const liveCanvas = liveCanvasRef.current;
                const liveCtx = liveCanvas.getContext('2d');
                liveCanvas.width = baseImage.naturalWidth;
                liveCanvas.height = baseImage.naturalHeight;

                liveCtx.save();
                if (adjustmentsStateRef.current.flipHorizontal || adjustmentsStateRef.current.flipVertical) {
                    liveCtx.translate(liveCanvas.width / 2, liveCanvas.height / 2);
                    liveCtx.scale(
                        adjustmentsStateRef.current.flipHorizontal ? -1 : 1, 
                        adjustmentsStateRef.current.flipVertical ? -1 : 1
                    );
                    liveCtx.translate(-liveCanvas.width / 2, -liveCanvas.height / 2);
                }
                liveCtx.drawImage(baseImage, 0, 0);
                liveCtx.restore();

                applyAllAdjustmentsToContext(liveCtx, liveCanvas.width, liveCanvas.height, adjustmentsStateRef.current);
                
                if (imageRef.current) {
                    imageRef.current.src = liveCanvas.toDataURL('image/png');
                    imageRef.current.style.filter = '';
                    imageRef.current.style.transform = '';
                    imageRef.current.style.boxShadow = '';
                }
            };
            
            baseImage.onerror = () => {
                console.error("Failed to load base image for live preview adjustments.");
                if (imageRef.current) {
                    imageRef.current.src = baseEditImageSrcRef.current || generatedImage || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                }
            };
            
            baseImage.src = baseEditImageSrcRef.current;
        });
    }, [applyAllAdjustmentsToContext, generatedImage]);

    // Optimized slider change handler to reduce lag
    const handleSliderChange = useCallback((setter, value, property) => {
        setter(value);
        
        // Update the reference immediately to avoid stale values
        adjustmentsStateRef.current[property] = value;
        
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        
        // Use a longer debounce time for smoother performance
        debounceTimerRef.current = setTimeout(() => {
            applyLiveAdjustmentsToPreview();
        }, 150); // Increased debounce time to reduce lag
    }, [applyLiveAdjustmentsToPreview]);

    const resetAllAdjustments = useCallback((triggerPreviewUpdate = true) => {
        // Reset all state values
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setTemperature(0);
        setHighlights(0);
        setShadows(0);
        setClarity(0);
        setVignette(0);
        setFlipHorizontal(false);
        setFlipVertical(false);
        
        // Reset the reference object
        adjustmentsStateRef.current = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            temperature: 0,
            highlights: 0,
            shadows: 0,
            clarity: 0,
            vignette: 0,
            flipHorizontal: false,
            flipVertical: false
        };
        
        //toast.info("Manual adjustments reset.");
        if (triggerPreviewUpdate) {
            applyLiveAdjustmentsToPreview();
        }
    }, [applyLiveAdjustmentsToPreview]);

    const resetAIToolsAndAdjustments = useCallback(() => {
        if (generatedImage) {
            baseEditImageSrcRef.current = generatedImage;
        } else {
            baseEditImageSrcRef.current = null;
            if (imageRef.current) {
                imageRef.current.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            }
        }
        resetAllAdjustments(true);
        //toast.info("AI tools and all adjustments have been reset to the original generated image.");
    }, [generatedImage, resetAllAdjustments]);

    const applyAITool = useCallback(async (toolName, processFunction) => {
        const currentSrcForAI = baseEditImageSrcRef.current;
        if (!currentSrcForAI || currentSrcForAI.startsWith('data:image/gif')) {
            //toast.error("Base image not available. Please generate an image first.");
            return;
        }
        
        setIsProcessing(true);
        
        try {
            const baseImage = new Image();
            baseImage.crossOrigin = "Anonymous";
            
            await new Promise((resolve, reject) => {
                baseImage.onload = resolve;
                baseImage.onerror = reject;
                baseImage.src = currentSrcForAI;
            });
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            processFunction(baseImage, canvas, ctx);
            
            const newSrc = canvas.toDataURL('image/png');
            baseEditImageSrcRef.current = newSrc;
            resetAllAdjustments(true);
            //toast.success(`${toolName} applied! Manual adjustments reset.`);
        } catch (error) {
            console.error(`Error applying ${toolName}:`, error);
           // toast.error(`Failed to apply ${toolName}.`);
        } finally {
            setIsProcessing(false);
        }
    }, [resetAllAdjustments]);

    const applyAISuperResolution = useCallback(() => applyAITool("AI Super Resolution", (img, canvas, ctx) => {
    // Use a more sophisticated upscaling approach
    const scaleFactor = 2;
    canvas.width = img.naturalWidth * scaleFactor;
    canvas.height = img.naturalHeight * scaleFactor;
    
    // Initial upscale
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Apply edge-preserving sharpening
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Simple edge-aware sharpening (more advanced would use proper ML)
    for (let y = 1; y < canvas.height-1; y++) {
        for (let x = 1; x < canvas.width-1; x++) {
            const i = (y * canvas.width + x) * 4;
            // Get neighboring pixels
            const neighbors = [
                (y-1)*canvas.width*4 + x*4,    // top
                (y+1)*canvas.width*4 + x*4,    // bottom
                y*canvas.width*4 + (x-1)*4,    // left
                y*canvas.width*4 + (x+1)*4     // right
            ];
            
            // Calculate edge strength
            let edgeStrength = 0;
            neighbors.forEach(ni => {
                edgeStrength += Math.abs(data[i] - data[ni]) + 
                                Math.abs(data[i+1] - data[ni+1]) + 
                                Math.abs(data[i+2] - data[ni+2]);
            });
            
            // Apply sharpening based on edge strength
            if (edgeStrength > 50) { // Edge detected
                const sharpness = Math.min(1, edgeStrength/300);
                data[i] = Math.min(255, data[i] * (1 + 0.3 * sharpness));
                data[i+1] = Math.min(255, data[i+1] * (1 + 0.3 * sharpness));
                data[i+2] = Math.min(255, data[i+2] * (1 + 0.3 * sharpness));
            }
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}), [applyAITool]);

    const applyAICartoonify = useCallback(() => applyAITool("AI Cartoonify", (img, canvas, ctx) => {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    // Step 1: Edge detection (simplified)
    ctx.filter = 'grayscale(100%) brightness(1.1) contrast(1.5)';
    ctx.drawImage(img, 0, 0);
    const edgeData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Step 2: Reset and apply color quantization
    ctx.filter = 'none';
    ctx.drawImage(img, 0, 0);
    
    // Apply bilateral filter simulation (simplified)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Color quantization with adaptive palette
    for (let i = 0; i < data.length; i += 4) {
        // More sophisticated quantization based on local color distribution
        const quantLevels = 8; // Reduced color palette
        data[i] = Math.round(data[i] / (255/quantLevels)) * (255/quantLevels);
        data[i+1] = Math.round(data[i+1] / (255/quantLevels)) * (255/quantLevels);
        data[i+2] = Math.round(data[i+2] / (255/quantLevels)) * (255/quantLevels);
    }
    
    // Step 3: Combine with edge detection (black outlines)
    for (let i = 0; i < data.length; i += 4) {
        // If edge is detected in this area, darken the pixel
        if (edgeData.data[i] < 100) { // Edge pixel
            data[i] *= 0.6;
            data[i+1] *= 0.6;
            data[i+2] *= 0.6;
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Final touch: boost saturation
    ctx.filter = 'saturate(1.5) contrast(1.1)';
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
}), [applyAITool]);

    const applyAIColorize = useCallback(() => applyAITool("AI Colorize", (img, canvas, ctx) => {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    // Convert to grayscale first
    ctx.filter = 'grayscale(100%)';
    ctx.drawImage(img, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Simulate colorization based on luminance
    for (let i = 0; i < data.length; i += 4) {
        const luminance = data[i]; // Grayscale value
        
        // Simulate color hints based on luminance
        if (luminance < 60) { // Dark areas - blue/purple tones
            data[i] = luminance * 0.7;       // R
            data[i+1] = luminance * 0.5;    // G
            data[i+2] = luminance * 1.2;     // B
        } 
        else if (luminance < 160) { // Midtones - warm tones
            data[i] = luminance * 1.3;       // R
            data[i+1] = luminance * 0.9;     // G
            data[i+2] = luminance * 0.7;     // B
        } 
        else { // Highlights - warm but desaturated
            data[i] = luminance * 1.1;       // R
            data[i+1] = luminance * 0.95;    // G
            data[i+2] = luminance * 0.8;     // B
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Apply final adjustments
    ctx.filter = 'sepia(0.2) saturate(1.3) contrast(1.1) hue-rotate(-5deg)';
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
}), [applyAITool]);

    const applyAISketch = useCallback(() => applyAITool("AI Sketch (Sim)", (img, canvas, ctx) => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.filter = 'grayscale(1) contrast(200%) brightness(1.1)';
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';
    }), [applyAITool]);

    const downloadEditedImage = useCallback(() => {
        const sourceForDownload = baseEditImageSrcRef.current;
        if (!sourceForDownload || sourceForDownload.startsWith('data:image/gif')) {
            //toast.error('No valid image available to download');
            return;
        }

        const imgToDownload = new Image();
        imgToDownload.crossOrigin = "Anonymous";
        
        imgToDownload.onload = () => {
            const workingCanvas = document.createElement('canvas');
            const workingCtx = workingCanvas.getContext('2d');
            workingCanvas.width = imgToDownload.naturalWidth;
            workingCanvas.height = imgToDownload.naturalHeight;

            workingCtx.save();
            if (flipHorizontal || flipVertical) {
                workingCtx.translate(workingCanvas.width / 2, workingCanvas.height / 2);
                workingCtx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
                workingCtx.translate(-workingCanvas.width / 2, -workingCanvas.height / 2);
            }
            workingCtx.drawImage(imgToDownload, 0, 0);
            workingCtx.restore();
            
            const currentAdjustments = { brightness, contrast, saturation, temperature, highlights, shadows, clarity, vignette };
            applyAllAdjustmentsToContext(workingCtx, workingCanvas.width, workingCanvas.height, currentAdjustments);

            const link = document.createElement('a');
            link.download = `ai-edited-${Date.now()}.png`;
            link.href = workingCanvas.toDataURL('image/png', 1.0);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            //toast.success('Edited image downloaded successfully!');
        };
        
        imgToDownload.onerror = () => {
            //toast.error("Failed to load image for download.");
        };
        
        imgToDownload.src = sourceForDownload;
    }, [applyAllAdjustmentsToContext, brightness, contrast, saturation, temperature, highlights, shadows, clarity, vignette, flipHorizontal, flipVertical]);

    // Optimized to use the state reference
    useEffect(() => {
        if (activeTab === 'edit') {
            applyLiveAdjustmentsToPreview();
        }
    }, [activeTab, applyLiveAdjustmentsToPreview]);

    useEffect(() => {
        if (activeTab === 'edit') {
            if (generatedImage && (!baseEditImageSrcRef.current || baseEditImageSrcRef.current !== generatedImage)) {
                baseEditImageSrcRef.current = generatedImage;
                resetAllAdjustments(true);
            } else if (!generatedImage && !baseEditImageSrcRef.current && imageRef.current) {
                imageRef.current.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                baseEditImageSrcRef.current = null;
                resetAllAdjustments(true);
            }
        }
    }, [activeTab, generatedImage, resetAllAdjustments]);

    const getFilteredAndSortedHistory = useCallback(() => {
        let items = [...generationHistory];
        if (historySearchTerm) {
            items = items.filter(item => item.prompt.toLowerCase().includes(historySearchTerm.toLowerCase()));
        }
        if (historyFilterStyle !== 'all') {
            items = items.filter(item => (item.style || 'realistic') === historyFilterStyle);
        }
        items.sort((a, b) => {
            switch (historySortOrder) {
                case 'date_asc': return new Date(a.date) - new Date(b.date);
                case 'prompt_asc': return a.prompt.localeCompare(b.prompt);
                case 'prompt_desc': return b.prompt.localeCompare(a.prompt);
                case 'date_desc':
                default: return new Date(b.date) - new Date(a.date);
            }
        });
        return items;
    }, [generationHistory, historySearchTerm, historyFilterStyle, historySortOrder]);

    const allStylePresetsForFilter = useMemo(() => ['all', ...stylePresets.map(p => p.id)], [stylePresets]);

    useEffect(() => {
        if (activeTab === 'generate' && generatedImage) {
            const generateTabImagePreview = document.getElementById('generated-image-display');
            if (generateTabImagePreview) {
                if (activeFilter !== 'none') applyFilter(activeFilter);
                else if (enhancement !== 'none') applyEnhancement(enhancement);
                else generateTabImagePreview.style.filter = 'none';
            }
        }
    }, [activeFilter, enhancement, activeTab, generatedImage, applyFilter, applyEnhancement]);

    // Update state reference when individual adjustment values change
    useEffect(() => {
        adjustmentsStateRef.current.brightness = brightness;
    }, [brightness]);
    
    useEffect(() => {
        adjustmentsStateRef.current.contrast = contrast;
    }, [contrast]);
    
    useEffect(() => {
        adjustmentsStateRef.current.saturation = saturation;
    }, [saturation]);
    
    useEffect(() => {
        adjustmentsStateRef.current.temperature = temperature;
    }, [temperature]);
    
    useEffect(() => {
        adjustmentsStateRef.current.highlights = highlights;
    }, [highlights]);
    
    useEffect(() => {
        adjustmentsStateRef.current.shadows = shadows;
    }, [shadows]);
    
    useEffect(() => {
        adjustmentsStateRef.current.clarity = clarity;
    }, [clarity]);
    
    useEffect(() => {
        adjustmentsStateRef.current.vignette = vignette;
    }, [vignette]);
    
    useEffect(() => {
        adjustmentsStateRef.current.flipHorizontal = flipHorizontal;
    }, [flipHorizontal]);
    
    useEffect(() => {
        adjustmentsStateRef.current.flipVertical = flipVertical;
    }, [flipVertical]);

    // Get aspect ratio class for preview container
    const getAspectRatioClass = useCallback(() => {
        switch (aspectRatio) {
            case 'portrait': return 'aspect-[3/4]';
            case 'landscape': return 'aspect-[16/9]';
            case 'ultrawide': return 'aspect-[21/9]';
            case 'square':
            default: return 'aspect-square';
        }
    }, [aspectRatio]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-4 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    {[...Array(5)].map((_, i) => ( 
                        <motion.div
                            key={i}
                            className="absolute rounded-full bg-indigo-200/30"
                            initial={{
                                x: Math.random() * window.innerWidth,
                                y: Math.random() * window.innerHeight,
                                width: Math.random() * 60 + 20, 
                                height: Math.random() * 60 + 20,
                                opacity: Math.random() * 0.15 + 0.05,
                            }}
                            animate={{
                                y: [null, Math.random() * 80 - 40 + (window.innerHeight / 2)],
                                x: [null, Math.random() * 80 - 40 + (window.innerWidth / 2)],
                                scale: [1, 1.15, 1],
                            }}
                            transition={{
                                duration: Math.random() * 18 + 12,
                                repeat: Infinity,
                                repeatType: 'mirror',
                                ease: 'easeInOut'
                            }}
                        />
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/30 relative z-10"
                >
                    <div className="border-b border-gray-200/80">
                        <div className="flex justify-between items-center px-6 py-4">
                            <motion.h1
                                className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                Imagine<span className="text-purple-500">AI</span>
                            </motion.h1>
                            <div className="flex items-center space-x-4">
                                <motion.div
                                    className="flex items-center bg-indigo-100/80 px-3 py-1.5 rounded-full shadow-sm"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <span className="text-indigo-700 text-sm font-medium">Credits: {credit}</span>
                                </motion.div>
                            </div>
                        </div>
                        <div className="flex border-t border-gray-200/80">
                            {[
                                {id: 'generate', label: 'Generate'},
                                {id: 'edit', label: 'Edit'},
                                {id: 'history', label: 'History'}
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 px-4 py-3 font-medium text-sm transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50 
                                        ${activeTab === tab.id 
                                            ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/70'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50 border-b-2 border-transparent'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6">
                        {activeTab === 'generate' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 space-y-6">
                                        <motion.form onSubmit={handleSubmit} className="space-y-6">
                                            <div>
                                                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Describe your masterpiece ✨
                                                </label>
                                                <div className="relative">
                                                    <textarea
                                                        id="prompt"
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none shadow-sm bg-white/90 backdrop-blur-sm text-gray-800 placeholder-gray-400"
                                                        value={prompt}
                                                        onChange={(e) => setPrompt(e.target.value)}
                                                        placeholder="e.g., A serene bioluminescent forest at twilight..."
                                                        rows={4}
                                                        disabled={isGenerating}
                                                    />
                                                    <div className="absolute bottom-3 right-3 flex space-x-2">
                                                        <motion.button
                                                            type="button"
                                                            onClick={() => setShowPromptWizard(true)}
                                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className="p-2 bg-indigo-100 hover:bg-indigo-200 rounded-lg text-indigo-600 shadow-sm"
                                                            title="Prompt Wizard"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                            </svg>
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Art Style 🎨</label>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {stylePresets.map((preset) => (
                                                        <motion.button
                                                            type="button"
                                                            key={preset.id}
                                                            whileHover={{ y: -3, boxShadow: "0px 4px 10px rgba(0,0,0,0.1)" }}
                                                            whileTap={{ scale: 0.98 }}
                                                            className={`p-3 rounded-lg border cursor-pointer transition-all duration-150 text-left w-full 
                                                                ${stylePreset === preset.id 
                                                                    ? 'border-indigo-500 bg-indigo-50 shadow-md ring-2 ring-indigo-400'
                                                                    : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm bg-white/80'}`}
                                                            onClick={() => setStylePreset(preset.id)}
                                                        >
                                                            <div className="flex items-center">
                                                                <div className={`w-3.5 h-3.5 rounded-full mr-2.5 border-2 ${stylePreset === preset.id ? 'bg-indigo-500 border-indigo-300' : 'bg-gray-300 border-gray-200'}`}></div>
                                                                <span className={`text-sm font-medium ${stylePreset === preset.id ? 'text-indigo-700' : 'text-gray-700'}`}>{preset.name}</span>
                                                            </div>
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Aspect Ratio 📐</label>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    {aspectRatios.map((ratio) => (
                                                        <motion.button
                                                            type="button"
                                                            key={ratio.id}
                                                            whileHover={{ y: -3, boxShadow: "0px 4px 10px rgba(0,0,0,0.1)" }}
                                                            whileTap={{ scale: 0.98 }}
                                                            className={`p-3 rounded-lg border cursor-pointer transition-all duration-150 
                                                                ${aspectRatio === ratio.id 
                                                                    ? 'border-indigo-500 bg-indigo-50 shadow-md ring-2 ring-indigo-400'
                                                                    : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm bg-white/80'}`}
                                                            onClick={() => setAspectRatio(ratio.id)}
                                                        >
                                                            <div className="flex items-center justify-center">
                                                                <span className={`text-sm font-medium ${aspectRatio === ratio.id ? 'text-indigo-700' : 'text-gray-700'}`}>{ratio.name}</span>
                                                            </div>
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="pt-2">
                                                <motion.button
                                                    type="submit"
                                                    disabled={isGenerating || !prompt.trim() || credit <= 0}
                                                    whileHover={!(isGenerating || !prompt.trim() || credit <= 0) ? { scale: 1.02, boxShadow: "0px 5px 15px rgba(96, 165, 250, 0.4)"} : {}}
                                                    whileTap={!(isGenerating || !prompt.trim() || credit <= 0) ? { scale: 0.98 } : {}}
                                                    className={`w-full py-3.5 px-6 rounded-xl font-semibold transition-all duration-300 relative overflow-hidden text-base
                                                        ${
                                                            isGenerating || !prompt.trim() || credit <= 0
                                                                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50'
                                                        }`}
                                                >
                                                    {isGenerating ? (
                                                        <span className="flex items-center justify-center space-x-2">
                                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            <span>Creating...</span>
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center justify-center space-x-2">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                            </svg>
                                                            <span>Generate Image ({credit > 0 ? '1 Credit' : 'No Credits'})</span>
                                                        </span>
                                                    )}
                                                </motion.button>
                                                {credit <= 0 && (
                                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-center text-sm text-red-600 bg-red-100/70 py-2.5 px-4 rounded-lg border border-red-200">
                                                        You're out of credits!
                                                    </motion.div>
                                                )}
                                            </div>
                                        </motion.form>
                                        <div className="mt-8">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-medium text-gray-700">Inspiration:</h3>
                                                <button
                                                    type="button"
                                                    onClick={() => setPrompt(promptSuggestions[Math.floor(Math.random() * promptSuggestions.length)])}
                                                    className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded-lg hover:bg-indigo-200 transition-colors shadow-sm"
                                                >
                                                    Random Prompt
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {promptSuggestions.slice(0, 4).map((suggestion, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        whileHover={{ y: -2, borderColor: 'rgb(129 140 248)' }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => setPrompt(suggestion)}
                                                        className="text-sm bg-white/80 border border-gray-200 p-3 rounded-lg cursor-pointer hover:shadow-sm transition-all h-full flex items-center"
                                                    >
                                                        {suggestion}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="lg:col-span-1">
                                        <div className="sticky top-6 space-y-4">
                                            <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/70 shadow-inner">
                                                <h3 className="text-base font-semibold text-gray-700 mb-3 text-center">Preview</h3>
                                                <div className={`${getAspectRatioClass()} bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden flex items-center justify-center shadow-md relative`}>
                                                    {generatedImage ? (
                                                        <motion.img
                                                            id="generated-image-display"
                                                            key={generatedImage} 
                                                            src={generatedImage}
                                                            alt={generationPrompt || "Generated image"}
                                                            className="w-full h-full object-contain"
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ duration: 0.5 }}
                                                        />
                                                    ) : (
                                                        <div className="text-center p-6 text-gray-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <p className="text-sm">Your image will appear here</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {generatedImage && (
                                                <div className="flex items-center justify-around mt-3 space-x-2">
                                                    {[ 
                                                        { label: 'Download', action: () => { const link = document.createElement('a'); link.href = generatedImage; link.download = `ai-image-${Date.now()}.png`; link.click(); }, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> },
                                                        { label: 'Fullscreen', action: enterFullscreen, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" /></svg> },
                                                        { label: 'Print', action: printImage, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg> },
                                                    ].map(btn => (
                                                        <motion.button
                                                            key={btn.label}
                                                            whileHover={{ scale: 1.05, backgroundColor: 'rgb(99 102 241)' }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={btn.action}
                                                            className="flex items-center justify-center space-x-1.5 bg-indigo-600 text-white py-2 px-3 rounded-lg text-xs hover:bg-indigo-700 transition-colors shadow-sm flex-1"
                                                            title={btn.label}
                                                        >
                                                            {btn.icon}
                                                            <span>{btn.label}</span>
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'edit' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
                                {(baseEditImageSrcRef.current || generatedImage) ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div className="lg:col-span-1 space-y-5">
                                            <div className="bg-white/80 rounded-xl p-4 border border-gray-200/70 shadow-md">
                                                <h3 className="text-base font-semibold text-gray-700 mb-3">AI Magic Tools ✨</h3>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[ { name: 'Super Res', action: applyAISuperResolution, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>, color: 'blue' },
                                                       { name: 'Cartoonify', action: applyAICartoonify, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>, color: 'purple' },
                                                       { name: 'Colorize Sim', action: applyAIColorize, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>, color: 'pink' },
                                                       { name: 'Sketch Sim', action: applyAISketch, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>, color: 'green' }
                                                    ].map(tool => (
                                                        <motion.button
                                                            key={tool.name}
                                                            whileHover={{ scale: 1.03, y: -2, boxShadow: "0px 3px 8px rgba(0,0,0,0.1)" }}
                                                            whileTap={{ scale: 0.97 }}
                                                            onClick={tool.action}
                                                            disabled={isProcessing}
                                                            className={`flex flex-col items-center justify-center p-3 rounded-lg bg-gradient-to-br from-${tool.color}-50 to-${tool.color}-100 hover:from-${tool.color}-100 hover:to-${tool.color}-200 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                                                        >
                                                            <div className={`w-8 h-8 mb-1.5 flex items-center justify-center bg-${tool.color}-100 rounded-full text-${tool.color}-600`}>
                                                                {tool.icon}
                                                            </div>
                                                            <span className="text-xs font-medium text-center text-gray-700">{tool.name}</span>
                                                        </motion.button>
                                                    ))}
                                                </div>
                                                <motion.button 
                                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} 
                                                    onClick={resetAIToolsAndAdjustments}
                                                    className="mt-3 w-full flex items-center justify-center space-x-1.5 bg-red-500 text-white py-2 px-3 rounded-lg text-sm hover:bg-red-600 transition-colors shadow-sm"
                                                    disabled={!baseEditImageSrcRef.current && !generatedImage}
                                                >
                                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    <span>Reset AI & Adjustments</span>
                                                </motion.button>
                                            </div>
                                            
                                            <div className="bg-white/80 rounded-xl p-4 border border-gray-200/70 shadow-md">
                                                <h3 className="text-base font-semibold text-gray-700 mb-3">Advanced Adjustments</h3>
                                                <div className="space-y-3">
                                                    {[ { label: 'Brightness', value: brightness, setter: setBrightness, min: 0, max: 200, unit: '%', accent: 'blue', property: 'brightness' },
                                                       { label: 'Contrast', value: contrast, setter: setContrast, min: 0, max: 200, unit: '%', accent: 'purple', property: 'contrast' },
                                                       { label: 'Saturation', value: saturation, setter: setSaturation, min: 0, max: 200, unit: '%', accent: 'pink', property: 'saturation' },
                                                       { label: 'Temperature', value: temperature, setter: setTemperature, min: -100, max: 100, unit: '', accent: 'orange', property: 'temperature' },
                                                       { label: 'Highlights', value: highlights, setter: setHighlights, min: -100, max: 100, unit: '', accent: 'yellow', property: 'highlights' },
                                                       { label: 'Shadows', value: shadows, setter: setShadows, min: -100, max: 100, unit: '', accent: 'gray', property: 'shadows' },
                                                       { label: 'Clarity', value: clarity, setter: setClarity, min: -100, max: 100, unit: '', accent: 'green', property: 'clarity' },
                                                       { label: 'Vignette', value: vignette, setter: setVignette, min: 0, max: 100, unit: '', accent: 'indigo', property: 'vignette' },
                                                    ].map((adjustment) => (
                                                        <div key={adjustment.label} className="space-y-1">
                                                            <div className="flex justify-between items-center">
                                                                <label className="text-xs font-medium text-gray-700">{adjustment.label}</label>
                                                                <span className="text-xs text-gray-500">{adjustment.value}{adjustment.unit}</span>
                                                            </div>
                                                            <div className="relative">
                                                                <input
                                                                    type="range"
                                                                    min={adjustment.min}
                                                                    max={adjustment.max}
                                                                    value={adjustment.value}
                                                                    onChange={(e) => handleSliderChange(adjustment.setter, parseInt(e.target.value), adjustment.property)}
                                                                    className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-${adjustment.accent}-500`}
                                                                />
                                                                <div 
                                                                    className={`absolute top-0 left-0 h-2 bg-${adjustment.accent}-500 rounded-l-lg`} 
                                                                    style={{ 
                                                                        width: `${((adjustment.value - adjustment.min) / (adjustment.max - adjustment.min)) * 100}%`,
                                                                        opacity: 0.7
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-between mt-4 space-x-2">
                                                    <motion.button 
                                                        whileHover={{ scale: 1.05 }} 
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => {
                                                            setFlipHorizontal(!flipHorizontal);
                                                            adjustmentsStateRef.current.flipHorizontal = !flipHorizontal;
                                                            applyLiveAdjustmentsToPreview();
                                                        }}
                                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all relative group overflow-hidden ${flipHorizontal ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                                    >
                                                        <motion.span className="flex items-center justify-center space-x-1.5">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 12H3m4 0l4-4m-4 4l4 4M17 4v12m0-12h4m-4 0l-4 4m4-4l-4-4" /></svg>
                                                        </motion.span>
                                                        <span>Flip H</span>
                                                        <AnimatePresence>
                                                        {flipHorizontal && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, width: 0}} 
                                                                animate={{ opacity: 1, width: '100%'}} 
                                                                exit={{ opacity: 0, width: 0}}
                                                                className="absolute bottom-0 left-0 h-0.5 bg-white/70 rounded-full"
                                                            />
                                                        )}
                                                        </AnimatePresence>
                                                    </motion.button>
                                                    <motion.button 
                                                        whileHover={{ scale: 1.05 }} 
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => {
                                                            setFlipVertical(!flipVertical);
                                                            adjustmentsStateRef.current.flipVertical = !flipVertical;
                                                            applyLiveAdjustmentsToPreview();
                                                        }}
                                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all relative group overflow-hidden ${flipVertical ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                                    >
                                                        <motion.span className="flex items-center justify-center space-x-1.5">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 12L3 8m4 4l4-4m-4 4h14m0 0l-4-4m4 4l4 4M12 20l-4-4m4 4l4-4" /></svg>
                                                        </motion.span>
                                                        <span>Flip V</span>
                                                        <AnimatePresence>
                                                        {flipVertical && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, width: 0}} 
                                                                animate={{ opacity: 1, width: '100%'}} 
                                                                exit={{ opacity: 0, width: 0}}
                                                                className="absolute bottom-0 left-0 h-0.5 bg-white/70 rounded-full"
                                                            />
                                                        )}
                                                        </AnimatePresence>
                                                    </motion.button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => resetAllAdjustments(true)} className="flex items-center justify-center space-x-1.5 bg-gray-600 text-white py-2.5 px-3 rounded-lg text-sm hover:bg-gray-700 transition-colors shadow-sm">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                    <span>Reset Adjustments</span>
                                                </motion.button>
                                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={downloadEditedImage} className="flex items-center justify-center space-x-1.5 bg-indigo-600 text-white py-2.5 px-3 rounded-lg text-sm hover:bg-indigo-700 transition-colors shadow-sm">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                    <span>Download</span>
                                                </motion.button>
                                            </div>
                                        </div>
                                        <div className="lg:col-span-2">
                                            <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/70 shadow-inner sticky top-6">
                                                <div className={`relative w-full ${getAspectRatioClass()} min-h-[500px] flex items-center justify-center bg-gray-200 rounded-md overflow-hidden shadow-md`}>
                                                    <img
                                                        ref={imageRef} 
                                                        src={baseEditImageSrcRef.current || generatedImage || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
                                                        alt="Editable image content"
                                                        className="w-full h-full object-contain transition-all duration-100 ease-out"
                                                        onError={(e) => { e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; }}
                                                    />
                                                     {isProcessing && (
                                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-lg">
                                                            <div className="text-white text-center p-4 bg-black/50 rounded-lg">
                                                                <svg className="animate-spin h-8 w-8 mx-auto text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                <p className="mt-2.5 text-sm font-medium">Applying AI magic...</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-16">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                        </svg>
                                        <h3 className="mt-4 text-lg font-medium text-gray-700">No image generated yet</h3>
                                        <p className="mt-1.5 text-gray-500">Generate an image to start editing.</p>
                                        <motion.button whileHover={{ scale: 1.02, boxShadow: "0px 3px 10px rgba(96, 165, 250, 0.3)" }} whileTap={{ scale: 0.98 }} onClick={() => setActiveTab('generate')} className="mt-5 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md">
                                            Go to Generate Tab
                                        </motion.button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                        
                      {activeTab === 'history' && ( 
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">Generation History</h2>
            <button 
                onClick={exportHistory}
                disabled={!generationHistory || generationHistory.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export All History
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50/80 rounded-lg border border-gray-200/70 shadow-sm">
            <div>
                <label htmlFor="historySearch" className="block text-sm font-medium text-gray-700 mb-1">Search by Prompt</label>
                <input
                    type="text"
                    id="historySearch"
                    placeholder="e.g., dragon, castle..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white/90"
                />
            </div>
            <div className="md:col-start-3">
                <label htmlFor="historySort" className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                    id="historySort"
                    value={historySortOrder}
                    onChange={(e) => setHistorySortOrder(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white/90"
                >
                    <option value="prompt_asc">Prompt (A-Z)</option>
                    <option value="prompt_desc">Prompt (Z-A)</option>
                </select>
            </div>
        </div>

        {getFilteredAndSortedHistory().length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {getFilteredAndSortedHistory().map((item) => (
                    <motion.div
                        key={item.date + item.prompt} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white/90 rounded-xl overflow-hidden shadow-lg border flex flex-col group relative transition-all duration-200 border-gray-200/80"
                    >
                        <div className="relative aspect-w-1 aspect-h-1 w-full overflow-hidden cursor-pointer" onClick={(e) => { e.stopPropagation(); openLightbox(item.image); }}>
                            <img
                                src={item.image}
                                alt={`History: ${item.prompt}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                loading="lazy"
                            />
                            <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-md">
                                {item.style || 'realistic'} / {item.ratio || 'square'}
                            </div>
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                            <p className="text-xs text-gray-500 mb-1">{formatDate(item.date)}</p>
                            <p className="text-sm font-medium text-gray-700 line-clamp-3 mb-2 flex-grow" title={item.prompt}>{item.prompt}</p>
                            <div className="mt-auto flex justify-end space-x-2 pt-2">
                                <motion.a
                                    href={item.image}
                                    download={`ai-history-${Date.now()}.png`}
                                    onClick={(e) => e.stopPropagation()}
                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    className="p-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors" title="Download Image"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                </motion.a>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        ) : (
            <div className="text-center py-16">
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, type: "spring" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400/80 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <h3 className="mt-2 text-xl font-semibold text-gray-700">No Generation History</h3>
                    <p className="mt-2 text-gray-500">Generate images to see your history.</p>
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0px 5px 15px rgba(96, 165, 250, 0.4)" }} whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab('generate')}
                        className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md"
                    >
                        Start Generating
                    </motion.button>
                </motion.div>
            </div>
        )}
    </motion.div>
)}
</div>
</motion.div>
</div>

            <AnimatePresence>
                {showPromptWizard && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={() => setShowPromptWizard(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 10 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative overflow-hidden border border-gray-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">Prompt Wizard 🪄</h2>
                                <button 
                                    onClick={() => setShowPromptWizard(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                                    aria-label="Close prompt wizard"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {promptCategories.map((category) => (
                                            <motion.button
                                                key={category.id}
                                                whileHover={{ y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setPromptCategory(category.id)}
                                                className={`p-2 rounded-lg text-xs font-medium transition-all ${promptCategory === category.id ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-400' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                            >
                                                {category.name}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Attributes</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {promptAttributesByCategory[promptCategory].map((attribute) => (
                                            <motion.button
                                                key={attribute}
                                                whileHover={{ y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    if (promptAttributes.includes(attribute)) {
                                                        setPromptAttributes(promptAttributes.filter(a => a !== attribute));
                                                    } else {
                                                        setPromptAttributes([...promptAttributes, attribute]);
                                                    }
                                                }}
                                                className={`p-2 rounded-lg text-xs font-medium transition-all ${promptAttributes.includes(attribute) ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-400' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                            >
                                                {attribute}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={generatePromptFromWizard}
                                        className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                                    >
                                        Generate Prompt
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {lightboxOpen && selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setLightboxOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="relative max-w-4xl max-h-[90vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img 
                                src={selectedImage} 
                                alt="Lightbox view" 
                                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                            />
                            <motion.button
                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.2)' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setLightboxOpen(false)}
                                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ImageGenerator;


