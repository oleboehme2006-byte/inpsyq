'use client';

import { useParams } from 'next/navigation';
import { TeamCockpit } from '@/components/dashboard/TeamCockpit';

export default function TeamByIdPage() {
    const params = useParams();
    const teamId = params?.teamId as string || 'engineering';

    return <TeamCockpit teamId={teamId} />;
}
