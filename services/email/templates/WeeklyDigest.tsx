import * as React from 'react';
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
    Hr,
    Row,
    Column,
} from '@react-email/components';

interface WeeklyDigestProps {
    teamName: string;
    weekLabel: string;
    strain: number;
    engagement: number;
    topDriver?: {
        label: string;
        trend: 'improving' | 'worsening' | 'stable';
    };
    topAction?: {
        title: string;
        message: string;
    };
    dashboardUrl: string;
}

export const WeeklyDigest = ({
    teamName = 'Product Team',
    weekLabel = 'Week 42',
    strain = 45,
    engagement = 72,
    topDriver = { label: 'Cognitive Load', trend: 'worsening' },
    topAction = { title: 'Deep Work Blocks', message: 'Implement no-meeting mornings' },
    dashboardUrl = 'https://inpsyq.com/team/product',
}: WeeklyDigestProps) => {
    return (
        <Html>
            <Head />
            <Preview>Weekly Intelligence Update regarding {teamName}</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Section className="mt-[32px]">
                            <div className="flex items-center gap-2">
                                <Text className="text-2xl font-bold text-black p-0 my-0">inPsyq</Text>
                                <div className="h-6 w-px bg-gray-300 mx-3"></div>
                                <Text className="text-lg text-gray-500 p-0 my-0">{teamName}</Text>
                            </div>
                        </Section>

                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Weekly Intelligence Digest <span className="text-gray-400 block text-sm font-normal mt-1">{weekLabel}</span>
                        </Heading>

                        <Section className="my-[32px] mx-auto">
                            <Row>
                                <Column align="center">
                                    <div className="bg-red-50 rounded-lg p-4 mx-2 text-center w-[140px]">
                                        <Text className="text-red-600 text-sm font-bold uppercase m-0 p-0">Strain</Text>
                                        <Text className="text-3xl font-bold text-red-700 m-0 p-0 mt-2">{strain}%</Text>
                                    </div>
                                </Column>
                                <Column align="center">
                                    <div className="bg-blue-50 rounded-lg p-4 mx-2 text-center w-[140px]">
                                        <Text className="text-blue-600 text-sm font-bold uppercase m-0 p-0">Engagement</Text>
                                        <Text className="text-3xl font-bold text-blue-700 m-0 p-0 mt-2">{engagement}%</Text>
                                    </div>
                                </Column>
                            </Row>
                        </Section>

                        {topDriver && (
                            <Section className="px-[20px]">
                                <Text className="text-black text-[14px] leading-[24px]">
                                    <strong>Top Driver:</strong> {topDriver.label} is currently the most significant factor affecting team dynamics ({topDriver.trend}).
                                </Text>
                            </Section>
                        )}

                        {topAction && (
                            <Section className="bg-gray-50 rounded p-[20px] my-[20px]">
                                <Text className="text-gray-500 text-xs font-bold uppercase m-0 p-0 mb-2">Recommended Focus</Text>
                                <Text className="text-black text-lg font-bold m-0 p-0">{topAction.title}</Text>
                                <Text className="text-gray-700 text-sm m-0 p-0 mt-1">{topAction.message}</Text>
                            </Section>
                        )}

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Link
                                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                                href={dashboardUrl}
                            >
                                View Full Analysis
                            </Link>
                        </Section>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                        <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
                            This message was intended for the leadership of {teamName}.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default WeeklyDigest;
