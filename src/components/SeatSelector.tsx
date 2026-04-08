import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, X, Check, Lock, ArrowLeft, Clock } from 'lucide-react';
import { ticketService } from '../services/ticketService';

interface SeatSelectorProps {
  onSelect: (seatId: string) => void;
  selectedSeat: string | null;
  isEntered: boolean;
  matchId?: string;
}

interface Block {
  id: string;
  name: string;
  color: string;
  tier: string;
  startAngle: number;
  endAngle: number;
}

const BLOCKS: Block[] = [
  { id: 'north', name: 'NORTH PAVILION', color: '#6366f1', tier: 'VIP Pavilion', startAngle: -135, endAngle: -45 },
  { id: 'jio', name: 'JIO PAVILION', color: '#be185d', tier: 'Premium Tier', startAngle: -45, endAngle: 15 },
  { id: 'east', name: 'EAST STAND', color: '#7c3aed', tier: 'Standard Stand', startAngle: 15, endAngle: 75 },
  { id: 'd-block', name: 'D BLOCK', color: '#475569', tier: 'General Stand', startAngle: 75, endAngle: 135 },
  { id: 'c-block', name: 'C BLOCK', color: '#475569', tier: 'General Stand', startAngle: 135, endAngle: 195 },
  { id: 'west', name: 'WEST STAND', color: '#0d9488', tier: 'Standard Stand', startAngle: 195, endAngle: 255 },
  { id: 'g-block', name: 'G BLOCK', color: '#0d9488', tier: 'Premium Tier', startAngle: 255, endAngle: 315 },
];

const TIERS = [
  { name: 'VIP Pavilion', color: '#6366f1' },
  { name: 'Premium Tier', color: '#be185d' },
  { name: 'Standard Stand', color: '#475569' },
  { name: 'General Stand', color: '#0d9488' },
];

export default function SeatSelector({ onSelect, selectedSeat, isEntered, matchId }: SeatSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [activeTier, setActiveTier] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);

  useEffect(() => {
    if (isModalOpen && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [isModalOpen, timeLeft]);

  useEffect(() => {
    if (isModalOpen && matchId) {
      loadOccupiedSeats();
    }
  }, [isModalOpen, matchId]);

  const loadOccupiedSeats = async () => {
    if (!matchId) return;
    setIsLoadingSeats(true);
    try {
      const occupied = await ticketService.getOccupiedSeats(matchId);
      setOccupiedSeats(occupied || []);
    } catch (error) {
      console.error('Failed to load occupied seats:', error);
    } finally {
      setIsLoadingSeats(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  if (!isEntered) return null;

  return (
    <>
      <div className="fixed bottom-12 pb-safe left-0 right-0 z-20 flex justify-center">
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-500 text-white px-12 py-4 rounded-full font-bold text-lg tracking-widest uppercase shadow-2xl shadow-orange-500/30"
        >
          Pick Your Seat
        </motion.button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617] p-0 overflow-hidden"
          >
            {/* Header / Timer */}
            <div className="absolute top-4 sm:top-8 pt-safe left-0 right-0 flex justify-center z-10">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 sm:px-6 py-2 rounded-full flex items-center gap-2 sm:gap-3">
                <Clock size={14} className="text-orange-500" />
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-400">
                  Seat Lock Expires In: <span className="text-white">{formatTime(timeLeft)}</span>
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 sm:top-8 pt-safe right-4 sm:right-8 pr-safe p-2 sm:p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all z-10 border border-white/10"
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>

            <div className="w-full h-full flex items-center justify-center relative">
              <AnimatePresence mode="wait">
                {!selectedBlock ? (
                  <motion.div
                    key="stadium-map"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="flex w-full max-w-7xl items-center justify-center lg:justify-between px-4 sm:px-12"
                  >
                    {/* Left: Tiers Filter */}
                    <div className="hidden lg:block w-64 space-y-8">
                      <div className="space-y-2">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Ticket Tiers</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Pick a category to filter</p>
                      </div>
                      <div className="space-y-4">
                        {TIERS.map(tier => (
                          <button
                            key={tier.name}
                            onClick={() => setActiveTier(activeTier === tier.name ? null : tier.name)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${activeTier === tier.name ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                          >
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: tier.color }} />
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-300">{tier.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Center: Stadium Map */}
                    <div className="relative flex items-center justify-center w-full max-w-[90vw] sm:max-w-none">
                      <svg 
                        viewBox="0 0 600 600" 
                        className="w-full h-auto max-w-[500px] sm:max-w-[600px] transform -rotate-90"
                      >
                        {/* Pitch */}
                        <circle cx="300" cy="300" r="100" fill="#064e3b" stroke="#10b981" strokeWidth="2" />
                        <rect x="295" y="250" width="10" height="100" fill="#fbbf24" opacity="0.5" />
                        
                        {/* Blocks */}
                        {BLOCKS.map(block => {
                          const isActive = !activeTier || activeTier === block.tier;
                          return (
                            <g 
                              key={block.id} 
                              className="cursor-pointer group"
                              onClick={() => setSelectedBlock(block)}
                            >
                              <path
                                d={describeArc(300, 300, 220, block.startAngle, block.endAngle)}
                                fill="none"
                                stroke={block.color}
                                strokeWidth="80"
                                opacity={isActive ? 0.8 : 0.1}
                                className="transition-all group-hover:opacity-100"
                              />
                              {/* Labels (Simplified positioning) */}
                              <text
                                x="300"
                                y="300"
                                fill="white"
                                fontSize="10"
                                fontWeight="900"
                                textAnchor="middle"
                                className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest"
                                transform={`rotate(${block.startAngle + (block.endAngle - block.startAngle) / 2 + 90}, 300, 300) translate(0, -220)`}
                              >
                                {block.name}
                              </text>
                            </g>
                          );
                        })}
                      </svg>

                      {/* Center Label */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center px-4">
                          <h2 className="text-2xl sm:text-4xl font-black italic tracking-tighter uppercase text-white drop-shadow-2xl">VPW Stadium</h2>
                          <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-gray-500 mt-1 sm:mt-2">World Cup 2026 · Mumbai</p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Empty for balance or info */}
                    <div className="hidden lg:block w-64"></div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="block-grid"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="flex flex-col items-center justify-center w-full max-w-4xl"
                  >
                    <button 
                      onClick={() => setSelectedBlock(null)}
                      className="flex items-center gap-2 text-gray-500 hover:text-white mb-12 text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                      <ArrowLeft size={14} />
                      Back to Stadium
                    </button>

                    <div className="text-center mb-6 sm:mb-12 px-4">
                      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ backgroundColor: selectedBlock.color }} />
                        <h2 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase italic">{selectedBlock.name}</h2>
                      </div>
                      <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] sm:text-sm">Select your exact seat position</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-4 sm:p-12 rounded-[2rem] sm:rounded-[3rem] w-full max-w-[95vw] sm:max-w-none relative">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#020617] px-4">
                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-green-500">Field View →</span>
                      </div>

                      <div className="grid grid-cols-12 gap-1 sm:gap-3">
                        {isLoadingSeats ? (
                          Array.from({ length: 72 }).map((_, i) => (
                            <div 
                              key={`skeleton-${i}`} 
                              className="aspect-square rounded-md sm:rounded-xl bg-white/5 animate-pulse" 
                            />
                          ))
                        ) : Array.from({ length: 72 }).map((_, i) => {
                          const row = String.fromCharCode(65 + Math.floor(i / 12));
                          const col = (i % 12) + 1;
                          const id = `${selectedBlock.id}-${row}${col}`;
                          const isOccupied = occupiedSeats.includes(id);
                          const isSelected = selectedSeat === id;

                          return (
                            <button
                              key={id}
                              disabled={isOccupied}
                              onClick={() => onSelect(id)}
                              className={`
                                aspect-square rounded-md sm:rounded-xl transition-all relative group
                                ${isSelected ? 'ring-2 sm:ring-4 ring-white' : ''}
                                ${isOccupied ? 'bg-white/5 cursor-not-allowed opacity-40' : 'hover:scale-110 active:scale-95'}
                              `}
                              style={{ backgroundColor: isOccupied ? '#1e293b' : isSelected ? 'white' : selectedBlock.color }}
                            >
                              {isOccupied ? (
                                <Lock size={8} className="text-gray-600 sm:w-3 sm:h-3 absolute inset-0 m-auto" />
                              ) : (
                                <span className="absolute inset-0 flex items-center justify-center text-[6px] sm:text-[8px] font-black text-black opacity-0 group-hover:opacity-100 transition-opacity">
                                  {row}{col}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Row Labels */}
                      <div className="absolute left-4 top-12 bottom-12 flex flex-col justify-between py-2">
                        {['A', 'B', 'C', 'D', 'E', 'F'].map(row => (
                          <span key={row} className="text-[10px] font-black text-gray-600">{row}</span>
                        ))}
                      </div>
                    </div>

                    {selectedSeat && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-12 flex items-center gap-8"
                      >
                        <div className="text-left">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Selected Seat</p>
                          <p className="text-2xl font-black text-white uppercase italic">{selectedSeat.split('-')[1]}</p>
                        </div>
                        <button
                          onClick={() => setIsModalOpen(false)}
                          className="bg-white text-black px-12 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-2xl"
                        >
                          Confirm Selection
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
