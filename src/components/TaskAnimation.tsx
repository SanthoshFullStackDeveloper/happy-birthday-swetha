
import React, { useEffect, useState } from 'react';
import { Check, Plus, Edit } from 'lucide-react';

interface TaskAnimationProps {
  type: 'complete' | 'create' | 'edit';
  trigger: boolean;
  onComplete?: () => void;
}

const TaskAnimation: React.FC<TaskAnimationProps> = ({ type, trigger, onComplete }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>([]);

  useEffect(() => {
    if (trigger) {
      setIsAnimating(true);
      
      // Generate confetti particles
      const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 5)],
        delay: Math.random() * 0.5
      }));
      
      setConfetti(particles);
      
      // Reset animation after duration
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setConfetti([]);
        onComplete?.();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  useEffect(() => {
  let timer: NodeJS.Timeout;
  if (trigger) {
    setIsAnimating(true);

    const particles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 5)],
      delay: Math.random() * 0.5
    }));

    setConfetti(particles);

    timer = setTimeout(() => {
      setIsAnimating(false);
      setConfetti([]);
      onComplete?.();
    }, 2000);
  }

  return () => clearTimeout(timer); // always clear
}, [trigger]);


  if (!isAnimating) return null;

  const getIcon = () => {
    switch (type) {
      case 'complete':
        return <Check className="h-8 w-8 text-white" />;
      case 'create':
        return <Plus className="h-8 w-8 text-white" />;
      case 'edit':
        return <Edit className="h-8 w-8 text-white" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'complete':
        return 'from-green-400 to-green-600';
      case 'create':
        return 'from-blue-400 to-blue-600';
      case 'edit':
        return 'from-purple-400 to-purple-600';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {/* Main Icon Animation */}
      <div className={`animate-bounce`}>
        <div className={`
          w-16 h-16 rounded-full bg-gradient-to-br ${getColors()} 
          flex items-center justify-center shadow-2xl
          animate-pulse
        `}>
          {getIcon()}
        </div>
      </div>

      {/* Confetti Particles */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 rounded-full animate-ping"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}s`,
            animationDuration: '1s'
          }}
        />
      ))}

      {/* Ripple Effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`
          w-32 h-32 rounded-full border-4 border-white/30
          animate-ping
        `} />
      </div>
      
      {/* Secondary Ripple */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`
          w-48 h-48 rounded-full border-2 border-white/20
          animate-ping
        `} style={{ animationDelay: '0.3s' }} />
      </div>
    </div>
  );
};

export default TaskAnimation;
