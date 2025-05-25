export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
      <input
        className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        {...props}
      />
    );
  }
  
  export function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
      <button
        className="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        {...props}
      >
        {children}
      </button>
    );
  }
  
  export function LinkButton({ children, href }: { children: React.ReactNode; href: string }) {
    return (
      <a href={href} className="text-blue-500 hover:underline text-sm">
        {children}
      </a>
    );
  }
  