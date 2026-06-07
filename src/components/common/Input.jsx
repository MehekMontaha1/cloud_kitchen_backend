import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  className = '',
  containerClassName = '',
  icon,
  ...props
}, ref) => {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-xl border border-slate-200 bg-white 
            px-4 py-3 text-sm text-slate-900 
            placeholder:text-slate-400
            transition-all duration-200
            focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200
            disabled:bg-slate-50 disabled:text-slate-500
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-rose-500">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

export const Textarea = forwardRef(({
  label,
  error,
  className = '',
  containerClassName = '',
  rows = 3,
  ...props
}, ref) => {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full rounded-xl border border-slate-200 bg-white 
          px-4 py-3 text-sm text-slate-900 
          placeholder:text-slate-400
          transition-all duration-200
          focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200
          disabled:bg-slate-50 disabled:text-slate-500
          resize-none
          ${error ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-rose-500">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export const Select = forwardRef(({
  label,
  error,
  className = '',
  containerClassName = '',
  options = [],
  placeholder = 'Select...',
  ...props
}, ref) => {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`
          w-full rounded-xl border border-slate-200 bg-white 
          px-4 py-3 text-sm text-slate-900 
          transition-all duration-200
          focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200
          disabled:bg-slate-50 disabled:text-slate-500
          ${error ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200' : ''}
          ${className}
        `}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs text-rose-500">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
