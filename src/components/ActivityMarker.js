function ActivityMarker({
    lastSeen,
    size = "l",
}) {
    let fill = "#e41a1c";
    let formattedDate = "Unknown";
    if ( (lastSeen !== undefined) && (lastSeen !== null) && (! isNaN(lastSeen)) && (lastSeen > 0) ) {
        const formatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' });
        formattedDate = formatter.format(new Date(lastSeen));
        const now = (new Date()).getTime();
        const delta = now - lastSeen;
        if (delta < 7 * 24 * 60 * 60 * 1000) {
            fill = "#4daf4a"
        } else if (delta < 30 * 24 * 60 * 60 * 1000) {
            fill = "#ffff33";
        }
    }
    return (
        <div className={`flag orb size-${size}`} title={formattedDate}>
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="-120 -120 240 240">
                <defs>
                    <filter id="filter_blur"><feGaussianBlur stdDeviation="4"/></filter>
                    <radialGradient id="grad_sphere" cx="50%" cy="50%" r="50%" fx="50%" fy="90%">
                        <stop offset="0%"  stopColor="#000000" stopOpacity="0"/>
                        <stop offset="99%" stopColor="#000000" stopOpacity="0.3"/>
                    </radialGradient>
                    <linearGradient id="grad_highlight" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="10%" stopColor="#ffffff" stopOpacity="0.9"/>
                        <stop offset="99%" stopColor="#ffffff" stopOpacity="0"/>
                    </linearGradient>
                    <g id="orb">
                        <circle  cx="0" cy="0" r="100"/>
                        <circle  cx="0" cy="0" r="100" fill="url(#grad_sphere)"/>
                        <ellipse cx="0" cy="-45" rx="70" ry="50" fill="url(#grad_highlight)" stroke="none" filter="url(#filter_blur)"/>
                    </g>
                </defs>
                <use href="#orb" fill={fill} x="0" y="0" width="200" height="200" />
            </svg>
        </div>
    );
}

export default ActivityMarker;
