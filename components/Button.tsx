type buttonProps = {
    color?: 'primaryBg' | 'primaryTxt' | 'secondaryBg' | 'accent' | 'alert' | 'success'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    disabled?: boolean
    children: React.ReactNode
}

// COLORS
// PRIMARY BACKGROUND: #FEFBF5 – Ivory (a soft, off-white)
// PRIMARY TEXT: #19374C – Dark Slate Blue (deep, muted navy-blue)
// SECONDARY BACKGROUND: #D5D5D5 – Light Gray (neutral, mid-light gray)
// ACCENT, BUTTONS: #A1C1D9 – Sky Blue (soft, pastel blue)
// ALERTS, ERROR, CTA: #EC1E24 – Crimson Red (vivid, strong red)
// SUCCESS: #76d474 - Muted Green

const colorStyles = {
    primaryBg: 'bg-ivory rounded-lg m-2',
    primaryTxt: 'bg-darkSlateBlue rounded-lg m-2',
    secondaryBg: 'bg-lightGray rounded-lg m-2',
    accent: 'bg-skyBlue rounded-lg m-2',
    alert: 'bg-crimsonRed rounded-lg m-2',
    success: 'bg-mutedGreen rounded-lg m-2'
}

const sizeStyles = {
    sm: 'py-1 px-3',
    md: 'py-2 px-5',
    lg: 'py-3 px-7',
    xl: 'py-3 px-9'
}

function Button({color='primaryBg', size='md', disabled=false, children}: buttonProps) {
    const className = `${colorStyles[color]} ${sizeStyles[size]}`
    return (
        <button className={`${className}`} disabled={disabled}>
            {children}
        </button>
    )
}

export default Button