"use client";

import React, { useEffect, useRef, useState } from "react";
import {
    FaceLandmarker,
    FilesetResolver,
    DrawingUtils,
} from "@mediapipe/tasks-vision";

const FaceMesh: React.FC = () => {
    // Suppress MediaPipe's informational "errors" that trigger Next.js overlay
    useEffect(() => {
        const originalError = console.error;
        console.error = (...args: any[]) => {
            if (args[0]?.includes?.("INFO: Created TensorFlow Lite XNNPACK delegate")) return;
            originalError.apply(console, args);
        };
        return () => { console.error = originalError; };
    }, []);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("Initializing AI Model...");
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        let faceLandmarker: FaceLandmarker;
        let animationFrameId: number;
        let lastVideoTime = -1;

        const initialize = async () => {
            try {
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
                );

                faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "GPU",
                    },
                    outputFaceBlendshapes: true,
                    runningMode: "VIDEO",
                    numFaces: 1,
                });

                setStatus("Accessing Camera...");
                await startCamera();
            } catch (err) {
                console.error("Initialization error:", err);
                setError("Failed to initialize AI model. Please check your connection.");
                setLoading(false);
            }
        };

        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadeddata = () => {
                        setLoading(false);
                        predict();
                    };
                }
            } catch (err) {
                console.error("Camera error:", err);
                setError("Webcam access denied. Please enable camera permissions.");
                setLoading(false);
            }
        };

        const predict = () => {
            if (!videoRef.current || !canvasRef.current || !faceLandmarker) return;

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            if (!ctx) return;

            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

            const startTimeMs = performance.now();
            if (lastVideoTime !== video.currentTime) {
                lastVideoTime = video.currentTime;
                const results = faceLandmarker.detectForVideo(video, startTimeMs);

                ctx.save();
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Mirror the canvas coordinate system horizontally
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);

                if (results.faceLandmarks) {
                    for (const landmarks of results.faceLandmarks) {
                        // Draw Landmarks with a premium look (glow effect)
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = "#00f2fe";
                        ctx.fillStyle = "#00f2fe";

                        for (const l of landmarks) {
                            ctx.beginPath();
                            ctx.arc(l.x * canvas.width, l.y * canvas.height, 1.5, 0, 2 * Math.PI);
                            ctx.fill();
                        }

                        // Calculate bounding box for "FACE DETECTED" label
                        let minX = 1, minY = 1, maxX = 0, maxY = 0;
                        for (const l of landmarks) {
                            if (l.x < minX) minX = l.x;
                            if (l.x > maxX) maxX = l.x;
                            if (l.y < minY) minY = l.y;
                            if (l.y > maxY) maxY = l.y;
                        }

                        const padding = 0.05;
                        const bx = Math.max(0, minX - padding) * canvas.width;
                        const by = Math.max(0, minY - padding) * canvas.height;
                        const bw = (Math.min(1, maxX + padding) - Math.max(0, minX - padding)) * canvas.width;
                        const bh = (Math.min(1, maxY + padding) - Math.max(0, minY - padding)) * canvas.height;

                        // Draw Stylized Bounding Box
                        ctx.save();
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = "rgba(0, 242, 254, 0.5)";
                        ctx.strokeStyle = "rgba(0, 242, 254, 0.3)";
                        ctx.lineWidth = 1;
                        ctx.strokeRect(bx, by, bw, bh);

                        // Draw Corner Accents
                        ctx.strokeStyle = "#00f2fe";
                        ctx.lineWidth = 3;
                        const cornerSize = 20;

                        // Top Left
                        ctx.beginPath(); ctx.moveTo(bx, by + cornerSize); ctx.lineTo(bx, by); ctx.lineTo(bx + cornerSize, by); ctx.stroke();
                        // Top Right
                        ctx.beginPath(); ctx.moveTo(bx + bw - cornerSize, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cornerSize); ctx.stroke();
                        // Bottom Left
                        ctx.beginPath(); ctx.moveTo(bx, by + bh - cornerSize); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cornerSize, by + bh); ctx.stroke();
                        // Bottom Right
                        ctx.beginPath(); ctx.moveTo(bx + bw - cornerSize, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cornerSize); ctx.stroke();
                        ctx.restore();

                        // Draw Label with back-flip
                        ctx.save();
                        ctx.translate(bx, by);
                        ctx.scale(-1, 1);
                        ctx.shadowBlur = 0;
                        ctx.fillStyle = "rgba(0, 242, 254, 0.9)";
                        ctx.font = "600 14px Inter, system-ui, sans-serif";
                        ctx.fillText("SCANNING ACTIVE", -bw, -10);
                        ctx.restore();
                    }
                }
                ctx.restore();
            }

            animationFrameId = requestAnimationFrame(predict);
        };

        initialize();

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
        };
    }, [mounted]);

    if (!mounted) {
        return (
            <div className="w-full h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#00f2fe22] border-t-[#00f2fe] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center font-sans">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#00f2fe22] via-black to-[#4facfe22] opacity-50" />

            {/* Container */}
            <div className="relative w-full h-full max-w-[1280px] max-h-[720px] shadow-2xl rounded-2xl overflow-hidden border border-white/10">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover scale-x-[-1]"
                    autoPlay
                    playsInline
                    muted
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />

                {/* Loading Overlay */}
                {loading && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl transition-all duration-700">
                        <div className="relative w-24 h-24 mb-6">
                            <div className="absolute inset-0 border-4 border-[#00f2fe22] rounded-full" />
                            <div className="absolute inset-0 border-4 border-t-[#00f2fe] rounded-full animate-spin" />
                        </div>
                        <p className="text-[#00f2fe] font-medium tracking-widest text-sm uppercase animate-pulse">
                            {status}
                        </p>
                    </div>
                )}

                {/* Error Overlay */}
                {error && (
                    <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-3xl px-6 text-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 border border-red-500/50">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Access Interrupted</h2>
                        <p className="text-zinc-400 max-w-sm mb-6">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
                        >
                            Retry Connection
                        </button>
                    </div>
                )}

                {/* HUD Elements */}
                {!loading && !error && (
                    <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 transition-all duration-500">
                                <div className="text-[10px] text-[#00f2fe] font-bold uppercase tracking-[0.2em] mb-1">System Status</div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
                                    <span className="text-white text-sm font-medium tracking-wide">AI CORE ONLINE</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2">
                                    <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Resolution</div>
                                    <div className="text-white text-xs font-mono tracking-wider">1280x720</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl px-8 py-3 flex items-center gap-12">
                                <div className="flex flex-col items-center">
                                    <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Latency</span>
                                    <span className="text-[#00f2fe] text-xs font-mono">16MS</span>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="flex flex-col items-center">
                                    <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Detection</span>
                                    <span className="text-[#00f2fe] text-xs font-mono">STABLE</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FaceMesh;
