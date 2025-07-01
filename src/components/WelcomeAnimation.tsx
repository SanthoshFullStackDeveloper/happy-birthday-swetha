
import React, { useEffect, useState } from 'react';
import { Sparkles, Coffee, Target } from 'lucide-react';
import { getAuth } from 'firebase/auth';

interface WelcomeAnimationProps {
  onComplete: () => void;
}

const WelcomeAnimation: React.FC<WelcomeAnimationProps> = ({ onComplete }) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);

  const auth = getAuth();

  useEffect(() => {
    const user = auth.currentUser;
    if (user && user.displayName) {
      setUserName(user.displayName);
    } else {
      setUserName(null);
    }
  }, [auth]);

  const messages = [
    {
      text: `Welcome back, ${userName ?? 'Guest'}!`,
      icon: Sparkles,
      gradient: "from-purple-400 to-pink-400"
    },
    {
      text: "Let's get things done!",
      icon: Target,
      gradient: "from-blue-400 to-indigo-400"
    },
    {
      text: "You've got this!",
      icon: Coffee,
      gradient: "from-green-400 to-emerald-400"
    }
  ];

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setCurrentMessage(prev => {
        if (prev < messages.length - 1) {
          return prev + 1;
        } else {
          clearInterval(messageTimer);
          // Start fade out after showing all messages
          setTimeout(() => {
            setIsVisible(false);
            // Complete animation after fade out
            setTimeout(onComplete, 1000);
          }, 1400);
          return prev;
        }
      });
    }, 1400);

    return () => clearInterval(messageTimer);
  }, [onComplete, messages.length]);

  if (!isVisible) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 z-50 flex items-center justify-center opacity-0 transition-opacity duration-500" />
    );
  }

  const currentMsg = messages[currentMessage];
  const IconComponent = currentMsg.icon;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 z-50 flex items-center justify-center transition-opacity duration-500">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-300 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-32 w-24 h-24 bg-blue-300 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-32 left-32 w-28 h-28 bg-indigo-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-pink-300 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Main Content */}
      <div className="text-center space-y-8 px-4">
        {/* Icon */}
        <div className="flex justify-center">
          <div className={`
            w-20 h-20 rounded-full bg-gradient-to-br ${currentMsg.gradient}
            flex items-center justify-center shadow-2xl
            animate-bounce-in transform-gpu
          `}>
            <IconComponent className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Welcome Message */}
        <div className="space-y-4">
          <h1 className={`
            text-4xl md:text-5xl font-bold bg-gradient-to-r ${currentMsg.gradient} 
            bg-clip-text text-transparent animate-fade-in
            transform-gpu
          `}>
            {currentMsg.text}
          </h1>
          
          {/* Loading indicator */}
          <div className="flex justify-center">
            <div className="flex space-x-2">
              {messages.map((_, index) => (
                <div
                  key={index}
                  className={`
                    w-2 h-2 rounded-full transition-all duration-300
                    ${index <= currentMessage 
                      ? `bg-gradient-to-r ${currentMsg.gradient}` 
                      : 'bg-gray-300'
                    }
                  `}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-ping opacity-70"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeAnimation;
