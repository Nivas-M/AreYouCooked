"use client";
import { useState, useEffect, useCallback } from "react";
import { nodes } from "./data/flowchart";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

export default function Home() {
  const [answer, setAnswer] = useState("root");
  const [endingCount, setEndingCount] = useState(null);
  
  // Roast Mode States
  const [showFoolBlink, setShowFoolBlink] = useState(false);
  const [isAggressive, setIsAggressive] = useState(false);
  const [showCowardModal, setShowCowardModal] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState(0); 
  const [clickedBadBtn, setClickedBadBtn] = useState(null);
  
  // Gloat Finale States
  const [isFlickering, setIsFlickering] = useState(false);
  const [showFinale, setShowFinale] = useState(false);

  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);
  
  const qns = nodes[answer];

  const handleStartOver = () => {
    setAnswer("root");
    setEndingCount(null);
    setShowFoolBlink(false);
    setIsAggressive(false);
    setShowCowardModal(false);
    setWrongAnswers(0);
    setIsFlickering(false);
    setShowFinale(false);
  };

  const playBuzzer = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(120, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.8);
      gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.error(e);
    }
  };

  const triggerFinale = () => {
     setIsFlickering(true);
     setTimeout(() => {
        setIsFlickering(false);
        setShowFinale(true);
     }, 500); // 0.5s glitch flicker transition
  }

  const handleAnswer = (nextAnswer, choiceType) => {
    // Determine if it was a "bad" answer (leads closer to a roast)
    if (nextAnswer !== 'nope' && nextAnswer !== 'root') {
        setClickedBadBtn(choiceType);
        setTimeout(() => setClickedBadBtn(null), 400); // duration of giggle
        setWrongAnswers(prev => prev + 1);
    }

    if (
      (answer === 'burn_not' && choiceType === 'no') || 
      (answer === 'broke' && choiceType === 'no') ||
      (answer === 'exam_fail' && choiceType === 'yes') || 
      (answer === 'assign_done' && choiceType === 'yes') ||
      (answer === 'att_math' && choiceType === 'yes')
    ) {
       setIsAggressive(true);
       playBuzzer();
       setTimeout(() => {
         setIsAggressive(false);
         if(nodes[nextAnswer]?.answer) {
             triggerFinale();
             setAnswer(nextAnswer);
         } else {
             setAnswer(nextAnswer);
         }
       }, 3500);
       return;
    }
    
    // Check if next node is a terminal node (an answer)
    const isTerminal = nodes[nextAnswer]?.answer;

    // Give time for the giggle animation to play before navigating if bad button clicked
    if (nextAnswer !== 'nope' && nextAnswer !== 'root') {
        setTimeout(() => {
            if (isTerminal) {
                triggerFinale();
            }
            setAnswer(nextAnswer);
        }, 400);
    } else {
        if (isTerminal) triggerFinale();
        setAnswer(nextAnswer);
    }
  };

  useEffect(() => {
    if (!qns?.answer) return;
    async function recordEnding() {
      try {
        const res = await fetch("/api/endings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endingId: answer }),
        });
        if (res.ok) {
           const data = await res.json();
           setEndingCount(data.count);
        } else {
           console.error("Failed to record ending:", res.status);
        }
      } catch (err) {
        console.error("Error recording ending:", err);
      }
    }
    recordEnding();
  }, [answer, qns]);

  // The 'Fool' Timer Hook
  useEffect(() => {
    setShowFoolBlink(false);
    if (qns?.answer || isAggressive || showFinale || isFlickering) return;

    const timer = setTimeout(() => {
      setShowFoolBlink(true);
      playBuzzer(); // Optional audio cue for the blink
      setTimeout(() => setShowFoolBlink(false), 3000); // 3-second blink override
    }, 5000);

    return () => clearTimeout(timer);
  }, [answer, qns, isAggressive, showFinale, isFlickering]);

  // Back Button Trap
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      if (answer !== 'root' && !qns?.answer && !showFinale) {
        window.history.pushState(null, "", window.location.href);
        setShowCowardModal(true);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [answer, qns, showFinale]);

  // AGGRESSIVE STATE RENDER
  if (isAggressive) {
    return (
      <div className="w-screen h-screen flex flex-col overflow-hidden bg-[#8B0000] screen-shake relative justify-center items-center">
        <div className="absolute inset-0 bg-[url('/images/angry-chef-cyberpunk-v2.png')] bg-cover bg-center opacity-80 mix-blend-multiply"></div>
        <div className="vignette-overlay"></div>
        <div className="z-50 flex flex-col items-center top-10 absolute w-full pointer-events-none">
           <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-[34vw] md:text-[20vw] leading-[0.85] md:leading-none tracking-tighter md:tracking-tight w-full text-center whitespace-normal md:whitespace-nowrap overflow-hidden text-[#FBE9D0] opacity-30">
             ARE YOU COOKED?
           </h1>
        </div>
        <div className="z-50 flex flex-col items-center justify-center h-full mix-blend-screen px-4">
          <p className="chromatic-text text-3xl md:text-6xl text-center text-white font-mono font-bold leading-tight max-w-4xl tracking-tighter">
            YOUR BROWSER HISTORY SAYS OTHERWISE.<br/>DON'T LIE TO THE CHEF.<br/><br/><span className="text-[#E64833]">YOU ARE THE GREATEST FOOL THESE PEOPLE HAVE EVER SEEN.</span>
          </p>
        </div>
      </div>
    );
  }

  // FOOL BLINK RENDER
  if (showFoolBlink) {
      return (
        <div className="w-screen h-screen flex flex-col overflow-hidden bg-[#8B0000] screen-shake relative justify-center items-center px-4">
          <div className="vignette-overlay"></div>
          <div className="z-50 flex flex-col items-center top-10 absolute w-full pointer-events-none">
           <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-[34vw] md:text-[20vw] leading-[0.85] md:leading-none tracking-tighter md:tracking-tight w-full text-center whitespace-normal md:whitespace-nowrap overflow-hidden text-[#FBE9D0] opacity-30">
             ARE YOU COOKED?
           </h1>
        </div>
          <div className="z-50 flex flex-col items-center justify-center h-full">
            <p className="text-4xl md:text-7xl text-center text-[#E64833] font-mono font-bold leading-tight max-w-4xl tracking-tighter animate-pulse">
              You're making me wait, child.<br/><br/>Thinking is clearly not your strong suit, is it?<br/><br/><span className="text-white opacity-80 text-2xl md:text-4xl">Did you need me to read it slower for you?</span>
            </p>
          </div>
        </div>
      );
  }

  // FUN CHAOS GLOAT CELEBRATION
  if (showFinale) {
      let roastLevelText = "";
      let roastHeadline = "";
      let brutalRoast = "";
      
      if (wrongAnswers === 0) {
          roastHeadline = "AWKWARD SILENCE";
          roastLevelText = "ROAST LEVEL 0: MIRACLE EXCEPTION";
          brutalRoast = "Don't mistake luck for logic. You stumbled to the end without failing, but you're still a localized failure. My compiler is genuinely annoyed it couldn't cook you more. Leave.";
      } else if (wrongAnswers <= 3) {
          roastHeadline = "PATHETIC EFFORT";
          roastLevelText = "ROAST LEVEL 1: LUKEWARM TRASH";
          brutalRoast = "You're barely competent. Watching you navigate this simple logic was like watching a toddler bypass a firewall. Slowly burning, but mostly just sad and confused. Go sit in the corner.";
      } else {
          roastHeadline = "ABSOLUTE DISASTER";
          roastLevelText = "ROAST LEVEL " + wrongAnswers + ": COMPLETELY CHARRED";
          brutalRoast = "A statistical anomaly of stupidity. Your decision-making is so consistently catastrophic that I'm recommending your Wi-Fi router file for a restraining order. You are a breathtaking monument to human incompetence.";
      }

      return (
         <div className="w-screen h-screen flex flex-col overflow-hidden bg-[#111] relative justify-center items-center px-4 sm:px-10 animate-in fade-in duration-500">
             
             {/* System Fault Sticker */}
             <div className="system-fault-sticker hidden sm:flex z-50">
                <div className="sticker-tape"></div>
                <div className="w-11/12 h-11/12 bg-[url('/images/angry-chef-cyberpunk-v2.png')] bg-cover bg-center retro-dither -scale-x-100"></div>
             </div>

             {/* Explosion of Emoji Confetti & Errors */}
             <Particles
                 id="tsparticles"
                 init={particlesInit}
                 className="absolute inset-0 z-0 pointer-events-none"
                 options={{
                     fullScreen: { enable: false, zIndex: 0 },
                     particles: {
                         number: { value: 35, density: { enable: true, value_area: 800 } },
                         color: { value: ["#00F5FF", "#B22222"] },
                         shape: { 
                             type: ["character", "edge"], 
                             character: {
                                value: ["👹", "🍳", "💥", "🤡", "💨", "🤖", "😭", "404", "ERROR"],
                                font: "Verdana",
                                style: "",
                                weight: "400"
                             }
                         },
                         opacity: { value: 0.9, random: true, anim: { enable: true, speed: 2, opacity_min: 0.2, sync: false } },
                         size: { value: 30, random: true, anim: { enable: true, speed: 10, size_min: 15, sync: false } },
                         move: { enable: true, speed: 8, direction: "top", random: true, straight: false, out_mode: "out", bounce: false }
                     },
                     interactivity: { events: { onhover: { enable: false } } },
                     retina_detect: true
                 }}
             />

             {/* Swiss Grid Content layer */}
             <div className="z-30 w-full max-w-7xl h-full flex flex-col justify-center py-6 md:py-12 relative text-[#FBE9D0]">
                 
                 {/* Top Navigation / Status Bar */}
                 <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-[#00F5FF] pb-4 mb-6">
                     <h1 style={{ fontFamily: "var(--font-bebas)" }} className="text-6xl md:text-8xl lg:text-[10vw] leading-[0.8] tracking-tighter flashing-gradient-text break-words">
                         {roastHeadline}
                     </h1>
                     <div className="flex flex-col text-right font-mono text-xs md:text-sm tracking-[0.2em] opacity-70 uppercase mt-4 md:mt-0">
                         <span className="text-[#B22222] font-bold">Status: Roasted</span>
                         <span>System: Superior</span>
                         <span>User: Inadequate</span>
                     </div>
                 </div>

                 {/* The Humiliation Grid */}
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 flex-grow h-full items-start">
                     
                     {/* Left Column: The Brutal Roast */}
                     <div className="lg:col-span-8 font-mono h-full flex flex-col justify-start">
                         <div className="bg-black/60 p-6 md:p-8 border-l-[12px] border-[#B22222] shadow-[8px_8px_0px_rgba(178,34,34,0.3)]">
                             <h2 className="text-[#00F5FF] text-2xl md:text-3xl font-bold mb-4 jitter-text tracking-widest uppercase">
                                 {roastLevelText}
                             </h2>
                             <p className="text-lg md:text-2xl lg:text-3xl font-bold max-w-4xl leading-relaxed text-white">
                                 {brutalRoast}
                             </p>
                         </div>
                     </div>

                     {/* Right Column: System Diagnostics & CTA */}
                     <div className="lg:col-span-4 flex flex-col justify-start gap-4 md:gap-6 mt-6 lg:mt-0 h-full">
                         
                         {/* Stats Box */}
                         <div className="bg-[#B22222] p-6 text-[#111] font-mono shadow-[6px_6px_0px_#FBE9D0]">
                             <h3 className="text-xl font-black mb-2 uppercase tracking-widest border-b-2 border-[#111] pb-2">Diagnostic Data</h3>
                             <div className="flex justify-between items-center py-2 text-lg font-bold">
                                 <span>FAILURES:</span>
                                 <span className="text-2xl">{wrongAnswers}</span>
                             </div>
                             <div className="flex justify-between items-center py-2 text-sm font-bold opacity-80 border-t border-[#111]/30 mt-2 pt-2">
                                 <span>FOOL ID:</span>
                                 <span>
                                    {endingCount === null ? "CALCULATING..." : endingCount.toLocaleString()}
                                 </span>
                             </div>
                         </div>

                         {/* Action CTA */}
                         <button 
                           onClick={handleStartOver}
                           className="w-full text-left bg-black p-6 text-[#00F5FF] font-mono border-4 border-[#00F5FF] electric-glow transition-all hover:translate-x-2 hover:-translate-y-2 hover:shadow-[-8px_8px_0px_#00F5FF] mt-auto md:mt-0 group"
                         >
                           <span className="block text-2xl md:text-3xl font-bold uppercase mb-2 group-hover:text-white transition-colors">Okay, You Win.</span>
                           <span className="block text-sm opacity-70 group-hover:opacity-100 transition-opacity">Sadistic algorithm. Roast me again. →</span>
                         </button>
                         
                     </div>

                 </div>

             </div>
         </div>
      );
  }

  return (
    <div className={`w-screen h-screen flex flex-col overflow-x-hidden relative transition-opacity duration-200 ${isFlickering ? 'opacity-20 flex-col-reverse filter blur-sm grayscale' : 'opacity-100'}`}>

      {/* Coward Modal */}
      {showCowardModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="bg-[#111] p-8 rounded-2xl flex flex-col items-center text-center shadow-[0_0_40px_rgba(230,72,51,0.6)] border border-[#E64833] max-w-md mx-4">
             <p style={{ fontFamily: "var(--font-bebas)" }} className="text-6xl text-[#E64833] tracking-wider mb-4 chromatic-text">COWARD.</p>
             <p className="font-mono text-xl text-white mb-8 font-semibold">Giving up already? Pathetic.<br/>Finish the roast.</p>
             <button 
               onClick={() => setShowCowardModal(false)}
               className="px-8 py-3 bg-[#8B0000] text-white font-mono font-bold rounded-lg border border-red-500 transition-all hover:scale-105 hover:bg-red-600"
             >
               I SUBMIT
             </button>
          </div>
        </div>
      )}

      {/* logo */}
      <div className="flex flex-col items-end mt-4"> 
        <h1
          style={{ fontFamily: "var(--font-bebas)" }}
          className={`text-[34vw] md:text-[20vw] leading-[0.85] md:leading-none tracking-tighter md:tracking-tight w-full text-center whitespace-normal md:whitespace-nowrap overflow-hidden px-0 ${wrongAnswers > 2 ? 'triumphant-text' : 'text-[#E64833]'}`}
        >
          ARE YOU COOKED?
        </h1>
        <p className={`text-sm md:text-2xl tracking-[0.1em] md:tracking-[0.2em] uppercase font-mono mt-[-1rem] md:mt-[-2rem] pl-1 z-10 transition-colors ${wrongAnswers > 2 ? 'triumphant-text opacity-100' : 'text-[#244855]'}`}>
          100% accurate. 0% helpful.
        </p>
        <p className="fixed bottom-4 right-4 text-sm opacity-50 z-10 font-bold transition-colors">By U76_98</p>
      </div>

      {/* body */}
      <div className="flex flex-col px-[5%] md:px-[10%] mt-10 md:mt-16 z-10 relative">
          
        {/* I Told You So mark */}
        {qns?.answer && wrongAnswers > 0 && (
           <div className="absolute -top-10 -right-5 md:-right-10 text-[8rem] text-red-500/20 font-bold rotate-12 pointer-events-none select-none">
             ✗
           </div>
        )}

        {qns?.answer ? (
           <div className="text-center font-mono opacity-50">
               {/* This view should minimally flash during initialization since we transition to Gloat */}
               PROCESSING SYSTEM CALCULATION...
           </div>
        ) : (
          <>
            <p className="font-mono text-2xl md:text-5xl text-[#244855] tracking-wide mb-8">
              {qns?.question}
            </p>
            <div className="flex gap-3 text-xl md:text-3xl space-x-2 md:space-x-5">
              <button 
                 className={`btn-yes transition-colors ${clickedBadBtn === 'yes' ? 'bg-red-600 giggle-anim text-white' : 'hover:scale-105'}`} 
                 onClick={() => handleAnswer(qns?.yes, 'yes')}
              >
                Yes
              </button>
              <button 
                 className={`btn-no transition-colors ${clickedBadBtn === 'no' ? 'bg-red-600 giggle-anim text-white' : 'hover:scale-105'}`} 
                 onClick={() => handleAnswer(qns?.no, 'no')}
              >
                No
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
