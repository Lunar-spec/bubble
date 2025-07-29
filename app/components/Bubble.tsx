"use client";
import { useEffect, useRef, useState } from "react";

interface Bubble {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  phase: number;
  speed: number;
  amplitude: number;
}

const SiriAudioVisualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Bubble parameters
  const bubbles = useRef<Bubble[]>([]);
  const baseRadius = 60;
  const maxRadius = 120;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize bubbles
    const initBubbles = () => {
      bubbles.current = [];
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Create multiple overlapping bubbles for liquid effect
      for (let i = 0; i < 8; i++) {
        bubbles.current.push({
          x: centerX + (Math.random() - 0.5) * 40,
          y: centerY + (Math.random() - 0.5) * 40,
          baseX: centerX + (Math.random() - 0.5) * 40,
          baseY: centerY + (Math.random() - 0.5) * 40,
          radius: baseRadius + Math.random() * 20,
          phase: Math.random() * Math.PI * 2,
          speed: 0.008 + Math.random() * 0.012, // Slowed down from 0.02-0.05 to 0.008-0.02
          amplitude: 10 + Math.random() * 15,
        });
      }
    };

    initBubbles();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.0003; // Slowed down from 0.001 to 0.0003

      // Create gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) / 2
      );
      gradient.addColorStop(0, "rgba(10, 10, 30, 0.8)");
      gradient.addColorStop(1, "rgba(5, 5, 15, 0.95)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate audio-responsive parameters
      const responsiveRadius =
        baseRadius + audioLevel * (maxRadius - baseRadius);
      const waveIntensity = audioLevel * 25; // Reduced from 50 to 25 for slower response

      // Draw liquid bubbles with metaball effect
      ctx.save();
      ctx.globalCompositeOperation = "screen";

      bubbles.current.forEach((bubble, index) => {
        // Update bubble position with audio responsiveness (slower)
        const audioOffset = audioLevel * bubble.amplitude * 0.5; // Reduced audio responsiveness
        bubble.x =
          bubble.baseX +
          Math.sin(time * bubble.speed + bubble.phase) *
            (bubble.amplitude + audioOffset);
        bubble.y =
          bubble.baseY +
          Math.cos(time * bubble.speed * 0.7 + bubble.phase) *
            (bubble.amplitude * 0.8 + audioOffset);

        // Dynamic radius based on audio (slower response)
        const dynamicRadius =
          bubble.radius +
          audioLevel * 20 +
          Math.sin(time * 1 + index) * (3 + audioLevel * 5); // Reduced multipliers

        // Create bubble gradient
        const bubbleGradient = ctx.createRadialGradient(
          bubble.x,
          bubble.y,
          0,
          bubble.x,
          bubble.y,
          dynamicRadius
        );

        // Color changes based on audio level
        const hue = 200 + audioLevel * 60 + index * 20;
        const saturation = 60 + audioLevel * 40;
        const lightness = 40 + audioLevel * 30;

        bubbleGradient.addColorStop(
          0,
          `hsla(${hue}, ${saturation}%, ${lightness + 20}%, 0.8)`
        );
        bubbleGradient.addColorStop(
          0.6,
          `hsla(${hue}, ${saturation}%, ${lightness}%, 0.4)`
        );
        bubbleGradient.addColorStop(
          1,
          `hsla(${hue}, ${saturation}%, ${lightness - 10}%, 0.1)`
        );

        ctx.fillStyle = bubbleGradient;
        ctx.beginPath();

        // Create organic, wavy circle (slower wave motion)
        const segments = 32;
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          const waveOffset =
            Math.sin(angle * 4 + time * 1.5) * (2 + waveIntensity * 0.1) +
            Math.sin(angle * 8 + time * 1) * (1 + waveIntensity * 0.05); // Slowed down wave speeds
          const radius = dynamicRadius + waveOffset;
          const x = bubble.x + Math.cos(angle) * radius;
          const y = bubble.y + Math.sin(angle) * radius;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.closePath();
        ctx.fill();

        // Add inner glow
        if (audioLevel > 0.1) {
          ctx.shadowColor = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.6)`;
          ctx.shadowBlur = 20 + audioLevel * 30;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      ctx.restore();

      // Add center highlight
      if (audioLevel > 0.05) {
        const centerGradient = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          0,
          canvas.width / 2,
          canvas.height / 2,
          40 + audioLevel * 60
        );
        centerGradient.addColorStop(
          0,
          `rgba(255, 255, 255, ${audioLevel * 0.3})`
        );
        centerGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = centerGradient;
        ctx.beginPath();
        ctx.arc(
          canvas.width / 2,
          canvas.height / 2,
          40 + audioLevel * 60,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioLevel]);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current =
        audioContextRef.current.createMediaStreamSource(stream);

      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      sourceRef.current.connect(analyserRef.current);

      setIsListening(true);

      const updateAudioData = () => {
        if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);

          // Calculate average audio level
          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            sum += dataArrayRef.current[i];
          }
          const average = sum / dataArrayRef.current.length;
          const normalizedLevel = average / 255;

          // Smooth the audio level more aggressively for slower response
          setAudioLevel((prev) => prev * 0.9 + normalizedLevel * 0.1); // Changed from 0.8/0.2 to 0.9/0.1

          requestAnimationFrame(updateAudioData);
        }
      };

      updateAudioData();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Please allow microphone access to use the visualizer");
    }
  };

  const stopListening = () => {
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsListening(false);
    setAudioLevel(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl aspect-square relative mb-8">
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-3xl border border-white/10 shadow-2xl bg-black/20 backdrop-blur-sm"
          style={{ filter: "drop-shadow(0 0 30px rgba(59, 130, 246, 0.3))" }}
        />

        {/* Audio level indicator */}
        <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isListening ? "bg-green-400 animate-pulse" : "bg-gray-400"
              }`}
            ></div>
            <span className="text-white text-sm">
              {isListening ? `${Math.round(audioLevel * 100)}%` : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`px-8 py-3 rounded-full font-medium text-white transition-all duration-300 ${
            isListening
              ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25"
              : "bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/25"
          }`}
        >
          {isListening ? "Stop Listening" : "Start Listening"}
        </button>

        <p className="text-white/70 text-center max-w-md">
          {isListening
            ? "Speak or make sounds to see the liquid visualizer respond to your voice!"
            : 'Click "Start Listening" to begin the audio visualization experience.'}
        </p>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-2xl p-6 max-w-md">
        <h3 className="text-white font-semibold mb-2">How it works:</h3>
        <ul className="text-white/70 text-sm space-y-1">
          <li>• Grant microphone permission when prompted</li>
          <li>• The bubbles will respond to your voice and ambient sound</li>
          <li>• Louder sounds create more dynamic liquid motion</li>
          <li>• Colors shift based on audio intensity</li>
        </ul>
      </div>
    </div>
  );
};

export default SiriAudioVisualizer;
