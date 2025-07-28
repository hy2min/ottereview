import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const Card = ({ children, className, ...props }) => {
  const classes = twMerge(
    clsx("bg-white rounded-lg border border-gray-200 shadow-sm"),
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className, ...props }) => {
  const classes = twMerge(
    clsx("px-6 py-4 border-b border-gray-200"),
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardContent = ({ children, className, ...props }) => {
  const classes = twMerge(clsx("px-6 py-4"), className);

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardFooter = ({ children, className, ...props }) => {
  const classes = twMerge(
    clsx("px-6 py-4 border-t border-gray-200"),
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
