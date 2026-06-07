const Card = ({ 
  children, 
  className = '', 
  padding = 'default',
  hover = false,
  onClick,
  ...props 
}) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl border border-slate-200/60 bg-white/80 
        shadow-soft backdrop-blur-sm
        ${paddings[padding]}
        ${hover ? 'cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-slate-300' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-slate-900 ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className = '' }) => (
  <p className={`mt-1 text-sm text-slate-500 ${className}`}>{children}</p>
);

const CardContent = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-4 flex items-center gap-3 ${className}`}>{children}</div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
