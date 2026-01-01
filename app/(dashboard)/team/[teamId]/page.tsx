import { resolveTeamIdentifier } from '@/lib/teams/resolver';
import { TeamCockpit } from '@/components/dashboard/TeamCockpit';
import { notFound } from 'next/navigation';

interface PageProps {
    params: {
        teamId: string;
    };
}

export default async function TeamByIdPage({ params }: PageProps) {
    const rawId = params.teamId;
    const resolvedId = await resolveTeamIdentifier(rawId);

    if (!resolvedId) {
        notFound();
    }

    return <TeamCockpit teamId={resolvedId} />;
}
