import React, { useState, useEffect } from 'react';
import { Notification } from '../../types';
import { X, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import Card from './Card';

interface NotificationToastProps {
    notification: Notification;
    onDismiss: () => void;
}

const ICONS = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertTriangle,
    new_order: Info,
};

const COLORS = {
    info: 'border-blue-500',
    success: 'border-green-500',
    warning: 'border-yellow-500',
    error: 'border-red-500',
    new_order: 'border-orange-500',
};

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (isPaused) return;

        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onDismiss, 300); // Allow time for exit animation
        }, 7000); // 7 seconds auto-dismiss

        return () => clearTimeout(timer);
    }, [onDismiss, isPaused]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(onDismiss, 300);
    };
    
    const Icon = notification.icon || ICONS[notification.type];
    const colorClass = COLORS[notification.type];

    const animationClass = isExiting ? 'animate-slide-out' : 'animate-slide-in';

    return (
        <Card
            className={`flex items-start p-4 border-l-4 ${colorClass} ${animationClass}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {Icon && <Icon className={`h-6 w-6 mr-3 flex-shrink-0 ${notification.type === 'new_order' ? 'text-orange-500' : 'text-current'}`} />}
            <div className="flex-grow">
                <h4 className="font-bold">{notification.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
            </div>
            <button onClick={handleDismiss} className="ml-4 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <X className="h-5 w-5" />
            </button>
        </Card>
    );
};

// Add keyframes to a style tag in index.html or a global CSS file
const styles = `
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
@keyframes slide-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
.animate-slide-in {
  animation: slide-in 0.3s ease-out forwards;
}
.animate-slide-out {
  animation: slide-out 0.3s ease-in forwards;
}
`;

// Inject styles into the document head
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);


export default NotificationToast;
