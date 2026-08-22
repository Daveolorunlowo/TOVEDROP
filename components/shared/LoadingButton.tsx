import React, { ButtonHTMLAttributes } from 'react';

export type LoadingEffect = 'fill' | 'rain' | 'morph' | 'pulse';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  effect: LoadingEffect;
  isLoading: boolean;
  loadingText?: string;
}

export function LoadingButton({ 
  effect, 
  isLoading, 
  loadingText = 'Loading...', 
  children, 
  className = '',
  disabled,
  ...props 
}: LoadingButtonProps) {
  
  // Base styles are managed by the CSS classes, but we allow appending custom classes
  
  if (!isLoading) {
    // Standard button when not loading
    return (
      <button 
        className={`bg-orange-brand hover:brightness-110 text-[#0d0d0f] font-semibold py-2.5 px-4 rounded-md transition-all ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }

  // Effect 1: Fill & Float
  if (effect === 'fill') {
    return (
      <button className={`btn-drop-fill ${className}`} disabled {...props}>
        <div className="drop-fill-liquid"></div>
        <div className="drop-fill-circle"></div>
        <div className="drop-fill-circle"></div>
        <div className="drop-fill-circle"></div>
        <span className="drop-fill-text">{loadingText}</span>
      </button>
    );
  }

  // Effect 2: Cascading Rain
  if (effect === 'rain') {
    return (
      <button className={`btn-drop-rain ${className}`} disabled {...props}>
        <div className="rain-drop"></div>
        <div className="rain-drop"></div>
        <div className="rain-drop"></div>
        <div className="rain-drop"></div>
        <div className="rain-drop"></div>
        <span className="rain-text">{loadingText}</span>
      </button>
    );
  }

  // Effect 3: Morphing Drop
  if (effect === 'morph') {
    return (
      <button className={`btn-drop-morph ${className}`} disabled {...props}>
        <svg className="morph-svg" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
          <path className="morph-svg-shape" d="M28 8 C18 8 10 16 10 26 C10 36 28 52 28 52 C28 52 46 36 46 26 C46 16 38 8 28 8 Z"></path>
        </svg>
        <span className="morph-text">{loadingText}</span>
      </button>
    );
  }

  // Effect 4: Pulsing Ripple
  if (effect === 'pulse') {
    return (
      <button className={`btn-drop-pulse ${className}`} disabled {...props}>
        <div className="pulse-ring"></div>
        <div className="pulse-ring"></div>
        <div className="pulse-ring"></div>
        <span className="pulse-text">{loadingText}</span>
      </button>
    );
  }

  return null;
}
