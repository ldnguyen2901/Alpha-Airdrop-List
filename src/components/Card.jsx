export default function Card({ children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border dark:border-gray-700 shadow-sm">
      {children}
    </div>
  );
}
