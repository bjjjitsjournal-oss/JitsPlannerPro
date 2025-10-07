export default function EnvCheck() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const hasUrl = !!supabaseUrl;
  const hasKey = !!supabaseKey;
  const allGood = hasUrl && hasKey;

  // Only show if there's an issue
  if (allGood) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-4 z-50 text-center">
      <div className="font-bold">⚠️ Configuration Error</div>
      <div className="text-sm mt-1">
        {!hasUrl && <div>Missing: VITE_SUPABASE_URL</div>}
        {!hasKey && <div>Missing: VITE_SUPABASE_ANON_KEY</div>}
        <div className="mt-2">Add environment variables in Vercel and redeploy</div>
      </div>
    </div>
  );
}
