const variants = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
  info: 'bg-blue-100 text-blue-700',
  primary: 'bg-indigo-100 text-indigo-700',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
  lg: 'px-4 py-1.5 text-sm',
};

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '',
  dot = false,
  ...props 
}) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${
          variant === 'success' ? 'bg-emerald-500' :
          variant === 'warning' ? 'bg-amber-500' :
          variant === 'danger' ? 'bg-rose-500' :
          'bg-slate-500'
        }`} />
      )}
      {children}
    </span>
  );
};

export default Badge;
