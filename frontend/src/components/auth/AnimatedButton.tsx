import { Link, type LinkProps } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import type { ComponentType } from 'react';

interface AnimatedButtonProps extends LinkProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
  icon?: 'login' | 'register';
}

const icons = {
  login: LogIn,
  register: UserPlus,
};

export function AnimatedButton({ 
  children, 
  to, 
  variant = 'primary',
  className = '',
  icon = 'login',
  ...props 
}: AnimatedButtonProps) {
  const isPrimary = variant === 'primary';
  const IconComponent = icons[icon];
  
  return (
    <Link
      to={to}
      className={`group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm border transition-all duration-300 ${
        isPrimary
          ? 'border-purple-500/40 text-purple-400 hover:border-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
          : 'border-slate-600/50 text-slate-400 hover:border-slate-500 hover:text-white hover:bg-slate-700/50'
      } ${className}`}
      {...props}
    >
      {/* Text */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>

      {/* Icon container - starts at 0 width */}
      <span 
        className={`relative z-10 flex-shrink-0 overflow-hidden transition-all duration-300 ${
          isPrimary
            ? 'w-0 text-purple-400/0 group-hover:w-5 group-hover:text-purple-400'
            : 'w-0 text-slate-500/0 group-hover:w-5 group-hover:text-slate-300'
        }`}
      >
        <IconComponent className="w-4 h-4" />
      </span>

      {/* Bottom accent line - animates width */}
      <div 
        className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ease-out ${
          isPrimary ? 'bg-purple-400' : 'bg-slate-400'
        } w-0 group-hover:w-full`}
      />
    </Link>
  );
}
