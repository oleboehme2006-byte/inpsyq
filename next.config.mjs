/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            {
                source: '/',
                destination: '/executive',
                permanent: false,
            },
        ];
    },
};

export default nextConfig;
