export const getSubdomain = () => {
    const host = window.location.host;
    const parts = host.split('.');

    // Check if we are on localhost or IP
    if (host.includes('127.0.0.1') || /^\d+\.\d+\.\d+\.\d+/.test(host)) {
        return null;
    }

    if (host.includes('localhost')) {
        // If it's something like greenwood.localhost:8000
        if (parts.length > 1 && parts[0] !== 'localhost') {
            return parts[0];
        }
        return null;
    }

    // For production: schoolname.platform.com
    if (parts.length >= 3) {
        const potentialSubdomain = parts[0];
        if (!['www', 'api', 'admin'].includes(potentialSubdomain)) {
            return potentialSubdomain;
        }
    }

    return null;
};

export const isMainDomain = () => {
    return !getSubdomain();
};
