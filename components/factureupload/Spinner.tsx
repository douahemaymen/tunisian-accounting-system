
import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', text }) => {
    const sizeClasses = {
        sm: 'w-6 h-6 border-2',
        md: 'w-8 h-8 border-4',
        lg: 'w-12 h-12 border-4',
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-2">
            <div
                className={`${sizeClasses[size]} border-blue-500 border-t-transparent rounded-full animate-spin`}
            ></div>
            {text && <p className="text-gray-600 animate-pulse">{text}</p>}
        </div>
    );
};
