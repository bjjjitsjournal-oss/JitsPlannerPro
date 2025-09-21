export default function SimpleHeader() {
  return (
    <header className="bg-gradient-to-r from-bjj-navy via-slate-800 to-bjj-navy text-white p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-bjj-red to-red-600 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Jits Journal</h1>
            <p className="text-sm text-slate-300 font-medium">Your BJJ Training Companion</p>
          </div>
        </div>
      </div>
    </header>
  );
}