export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchStats() {
    const res = await fetch(`${API_URL}/admin/stats/overview`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
}

export async function fetchWeeklyAnalytics() {
    const res = await fetch(`${API_URL}/admin/analytics/weekly`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
}

export async function fetchProfiles() {
    const res = await fetch(`${API_URL}/admin/employees`);
    if (!res.ok) throw new Error('Failed to fetch profiles');
    return res.json();
}

export async function fetchSettings() {
    const res = await fetch(`${API_URL}/admin/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
}

export async function updateSettings(settings: any) {
    const res = await fetch(`${API_URL}/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
}

export async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_URL}/admin/upload`, {
        method: 'POST',
        body: formData
    });
    if (!res.ok) throw new Error('Failed to upload file');
    return res.json();
}
