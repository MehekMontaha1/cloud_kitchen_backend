const Toggle = ({ 
  checked = false, 
  onChange, 
  label,
  disabled = false,
  size = 'md',
  className = ''
}) => {
  const sizes = {
    sm: { track: 'w-9 h-5', thumb: 'w-4 h-4', translate: 'translate-x-4' },
    md: { track: 'w-12 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
    lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7' },
  };

  const { track, thumb, translate } = sizes[size];

  return (
    <label className={`inline-flex items-center gap-3 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex items-center rounded-full p-1 
          transition-colors duration-200 ease-in-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2
          ${track}
          ${checked ? 'bg-emerald-500' : 'bg-slate-200'}
        `}
      >
        <span
          className={`
            inline-block rounded-full bg-white shadow-md 
            transform transition-transform duration-200 ease-in-out
            ${thumb}
            ${checked ? translate : 'translate-x-0'}
          `}
        />
      </button>
      {label && (
        <span className="text-sm font-medium text-slate-700">{label}</span>
      )}
    </label>
  );
};

export default Toggle;
