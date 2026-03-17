const BackgroundBlobs = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <svg
        className="absolute inset-0 w-full h-full animate-network-drift"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" className="[stop-color:oklch(var(--p))]" stopOpacity="0.08" />
            <stop offset="100%" className="[stop-color:oklch(var(--p))]" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient glow */}
        <circle cx="300" cy="250" r="300" fill="url(#glow1)" />
        <circle cx="600" cy="400" r="250" fill="url(#glow1)" />

        {/* Connection lines */}
        <g className="stroke-primary" strokeOpacity="0.06" strokeWidth="1" fill="none">
          <line x1="120" y1="80" x2="200" y2="150" />
          <line x1="200" y1="150" x2="180" y2="260" />
          <line x1="200" y1="150" x2="310" y2="130" />
          <line x1="310" y1="130" x2="350" y2="220" />
          <line x1="350" y1="220" x2="180" y2="260" />
          <line x1="350" y1="220" x2="450" y2="180" />
          <line x1="450" y1="180" x2="520" y2="250" />
          <line x1="520" y1="250" x2="480" y2="350" />
          <line x1="480" y1="350" x2="350" y2="220" />
          <line x1="480" y1="350" x2="600" y2="380" />
          <line x1="600" y1="380" x2="650" y2="300" />
          <line x1="650" y1="300" x2="520" y2="250" />
          <line x1="600" y1="380" x2="700" y2="450" />
          <line x1="700" y1="450" x2="620" y2="500" />
          <line x1="620" y1="500" x2="480" y2="350" />
          <line x1="180" y1="260" x2="100" y2="350" />
          <line x1="100" y1="350" x2="200" y2="420" />
          <line x1="200" y1="420" x2="350" y2="400" />
          <line x1="350" y1="400" x2="480" y2="350" />
          <line x1="200" y1="420" x2="150" y2="520" />
          <line x1="350" y1="400" x2="300" y2="500" />
          <line x1="300" y1="500" x2="150" y2="520" />
          <line x1="700" y1="450" x2="740" y2="350" />
          <line x1="740" y1="350" x2="650" y2="300" />
          <line x1="120" y1="80" x2="250" y2="50" />
          <line x1="250" y1="50" x2="310" y2="130" />
          <line x1="450" y1="180" x2="500" y2="100" />
          <line x1="500" y1="100" x2="650" y2="300" />
          {/* Extended edges */}
          <line x1="60" y1="180" x2="120" y2="80" />
          <line x1="60" y1="180" x2="180" y2="260" />
          <line x1="60" y1="180" x2="100" y2="350" />
          <line x1="250" y1="50" x2="400" y2="50" />
          <line x1="400" y1="50" x2="500" y2="100" />
          <line x1="400" y1="50" x2="310" y2="130" />
          <line x1="500" y1="100" x2="680" y2="120" />
          <line x1="680" y1="120" x2="740" y2="350" />
          <line x1="680" y1="120" x2="650" y2="300" />
          <line x1="700" y1="200" x2="680" y2="120" />
          <line x1="700" y1="200" x2="740" y2="350" />
          <line x1="700" y1="200" x2="650" y2="300" />
          <line x1="700" y1="450" x2="760" y2="510" />
          <line x1="760" y1="510" x2="620" y2="500" />
          <line x1="760" y1="510" x2="740" y2="350" />
          <line x1="420" y1="500" x2="350" y2="400" />
          <line x1="420" y1="500" x2="300" y2="500" />
          <line x1="420" y1="500" x2="550" y2="460" />
          <line x1="550" y1="460" x2="600" y2="380" />
          <line x1="550" y1="460" x2="620" y2="500" />
          <line x1="550" y1="460" x2="480" y2="350" />
          <line x1="80" y1="480" x2="150" y2="520" />
          <line x1="80" y1="480" x2="100" y2="350" />
          <line x1="80" y1="480" x2="200" y2="420" />
        </g>

        {/* Nodes */}
        <g className="fill-primary" opacity="0.12">
          <circle cx="120" cy="80" r="3" />
          <circle cx="200" cy="150" r="4" />
          <circle cx="180" cy="260" r="3" />
          <circle cx="310" cy="130" r="3.5" />
          <circle cx="250" cy="50" r="2.5" />
          <circle cx="350" cy="220" r="4.5" />
          <circle cx="450" cy="180" r="3" />
          <circle cx="500" cy="100" r="2.5" />
          <circle cx="520" cy="250" r="3.5" />
          <circle cx="480" cy="350" r="4" />
          <circle cx="600" cy="380" r="3.5" />
          <circle cx="650" cy="300" r="3" />
          <circle cx="700" cy="450" r="4" />
          <circle cx="740" cy="350" r="2.5" />
          <circle cx="620" cy="500" r="3" />
          <circle cx="100" cy="350" r="3" />
          <circle cx="200" cy="420" r="3.5" />
          <circle cx="350" cy="400" r="3" />
          <circle cx="150" cy="520" r="3" />
          <circle cx="300" cy="500" r="2.5" />
          {/* Extended nodes */}
          <circle cx="60" cy="180" r="2.5" />
          <circle cx="400" cy="50" r="3" />
          <circle cx="680" cy="120" r="3" />
          <circle cx="700" cy="200" r="2.5" />
          <circle cx="760" cy="510" r="3" />
          <circle cx="420" cy="500" r="3.5" />
          <circle cx="550" cy="460" r="3" />
          <circle cx="80" cy="480" r="2.5" />
        </g>

        {/* Hub nodes — pulse animation */}
        <g className="fill-primary animate-hub-pulse">
          <circle cx="350" cy="220" r="2" />
          <circle cx="480" cy="350" r="2" />
          <circle cx="200" cy="150" r="2" />

        </g>
      </svg>
    </div>
  );
};

export default BackgroundBlobs;
