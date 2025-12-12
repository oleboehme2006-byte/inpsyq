'use client';
import { useEffect, useState } from 'react';

export default function TeamsPage() {
    const [data, setData] = useState<any[]>([]);
    // Hardcoded team ID for demo
    const teamId = "00000000-0000-0000-0000-000000000001"; // Should be fetched from Org

    useEffect(() => {
        fetch(`/api/admin/profiles?teamId=${teamId}`) // Demo ID
            .then(res => res.json())
            .then(setData)
            .catch(console.error);
    }, []);

    return (
        <div className="p-12">
            <h1 className="text-2xl mb-8">Team Profiles: Engineering</h1>

            <div className="space-y-4">
                {data.length === 0 && <p>No profiles detected yet.</p>}
                {data.map((profile, i) => (
                    <div key={i} className="p-6 bg-white border rounded-lg flex justify-between items-center">
                        <div>
                            <div className="text-lg font-bold">{profile.profile_type}</div>
                            <div className="text-sm text-gray-500">Week of {new Date(profile.week_start).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl">{Math.round(profile.activation_score * 100)}%</div>
                            <div className="text-xs text-gray-400">Confidence: {Math.round(profile.confidence * 100)}%</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
