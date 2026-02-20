import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
    width: 512,
    height: 512,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#000000',
                }}
            >
                {/* Container for the logo content */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                    {/* Psi Symbol (3 Bars) */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '42px' }}>
                        {/* Left Bar */}
                        <div style={{ width: '42px', height: '146px', background: 'white' }} />
                        {/* Middle Bar */}
                        <div style={{ width: '42px', height: '210px', background: 'white' }} />
                        {/* Right Bar */}
                        <div style={{ width: '42px', height: '146px', background: 'white' }} />
                    </div>

                    {/* Spacer (Gap = stroke width = 42px) */}
                    <div style={{ height: '42px' }} />

                    {/* Purple Base Bar */}
                    <div
                        style={{
                            width: '210px', // 3*42 + 2*42 = 126 + 84 = 210. Precise geometry.
                            height: '42px',
                            background: '#8B5CF6',
                            borderRadius: '21px', // Fully circular caps
                            boxShadow: '0 0 30px rgba(139,92,246,0.6)', // Glow
                        }}
                    />
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
