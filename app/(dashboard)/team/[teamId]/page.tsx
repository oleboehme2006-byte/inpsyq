'use client';

import { TeamClientWrapper } from '@/components/dashboard/team/TeamClientWrapper';

interface TeamPageProps {
    params: { teamId: string };
}

export default function TeamPage({ params }: TeamPageProps) {
    return <TeamClientWrapper teamId={params.teamId} />;
}
