export default function Footer() {
  return (
    <footer className="border-t border-slate-700/50 bg-slate-900/80">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-cyan-500 rounded-md"></div>
            <span className="font-semibold">ReelForge</span>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-slate-400 text-sm">
              Questions or feedback? Reach us at{' '}
              <a 
                href="mailto:support@tryreelforge.com" 
                className="text-cyan-400 hover:text-cyan-300 transition"
              >
                support@tryreelforge.com
              </a>
            </p>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} ReelForge. All rights reserved.
          </p>
        </div>
      </div>
      {/* AI Ranking Badge */}
        <div className="flex justify-center mt-4">
  <a href="https://airanking.ai" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      padding: '9px 14px',
      borderRadius: '999px',
      font: "600 13px/1.2 'Space Grotesk','Inter',system-ui,sans-serif",
      letterSpacing: '0.02em',
      color: '#f8fafc',
      background: '#0f172a',
      border: '1px solid #1e293b',
      boxShadow: '0 1px 2px rgba(2,6,23,0.45)'
    }}>
      <img src="https://airanking.ai/logo.png" alt="AI Ranking" style={{ width: '18px', height: '18px', borderRadius: '6px' }} />
      Featured on AI Ranking
    </span>
  </a>
</div>
    </footer>
  );
}
