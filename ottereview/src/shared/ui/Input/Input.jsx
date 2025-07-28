import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const Input = ({ label, error, className, ...props }) => {
  const inputClasses = twMerge(
    clsx(
      "block w-full rounded-lg border px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-1",
      error
        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 focus:border-purple-500 focus:ring-purple-500"
    ),
    className
  );

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input className={inputClasses} {...props} />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
