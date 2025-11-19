'use client';

interface SpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ text = 'Chargement...', size = 'md' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className={`${sizeClasses[size]} animate-spin`}>
        <div className="h-full w-full rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>
      {text && (
        <p className="text-sm text-gray-600 font-medium">{text}</p>
      )}
    </div>
  );
}