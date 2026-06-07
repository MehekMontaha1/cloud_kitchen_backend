import { forwardRef } from 'react';

const variants = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600',
  danger: 'bg-rose-500 text-white hover:bg-rose-600',
  warning: 'bg-amber-500 text-white hover:bg-amber-600',
  ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-semibold 
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98]
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span>{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span>{icon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
